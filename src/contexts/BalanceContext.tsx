import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface MonthlyBalance {
  id: string
  user_id: string
  month: number
  year: number
  monthly_income: number
  total_expenses: number
  remaining_balance: number
  created_at: string
  updated_at: string
}

interface BalanceContextType {
  currentBalance: MonthlyBalance | null
  balanceHistory: MonthlyBalance[]
  loading: boolean
  updateMonthlyIncome: (amount: number, month?: number, year?: number) => Promise<void>
  getCurrentMonthBalance: () => Promise<MonthlyBalance | null>
  getBalanceHistory: () => Promise<MonthlyBalance[]>
  refreshBalances: () => Promise<void>
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined)

export const useBalance = () => {
  const context = useContext(BalanceContext)
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider')
  }
  return context
}

export const BalanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentBalance, setCurrentBalance] = useState<MonthlyBalance | null>(null)
  const [balanceHistory, setBalanceHistory] = useState<MonthlyBalance[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      refreshBalances()
    }
  }, [user])

  const refreshBalances = async () => {
    if (!user) return

    try {
      setLoading(true)
      await Promise.all([
        getCurrentMonthBalance(),
        getBalanceHistory()
      ])
    } catch (error) {
      console.error('Error refreshing balances:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentMonthBalance = async (): Promise<MonthlyBalance | null> => {
    if (!user) return null

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    try {
      const { data, error } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error
      }

      if (data) {
        setCurrentBalance(data)
        return data
      } else {
        // Create current month record if it doesn't exist
        const newBalance = await createMonthlyBalance(0, currentMonth, currentYear)
        setCurrentBalance(newBalance)
        return newBalance
      }
    } catch (error) {
      console.error('Error getting current month balance:', error)
      return null
    }
  }

  const getBalanceHistory = async (): Promise<MonthlyBalance[]> => {
    if (!user) return []

    try {
      const { data, error } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(12) // Last 12 months

      if (error) throw error

      setBalanceHistory(data || [])
      return data || []
    } catch (error) {
      console.error('Error getting balance history:', error)
      return []
    }
  }

  const createMonthlyBalance = async (
    income: number, 
    month: number, 
    year: number
  ): Promise<MonthlyBalance> => {
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('monthly_balances')
      .insert({
        user_id: user.id,
        month,
        year,
        monthly_income: income,
        total_expenses: 0,
        remaining_balance: income
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateMonthlyIncome = async (
    amount: number, 
    month?: number, 
    year?: number
  ): Promise<void> => {
    if (!user) return

    const now = new Date()
    const targetMonth = month || (now.getMonth() + 1)
    const targetYear = year || now.getFullYear()

    try {
      // First, try to update existing record
      const { data: existingData, error: selectError } = await supabase
        .from('monthly_balances')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', targetMonth)
        .eq('year', targetYear)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError
      }

      if (existingData) {
        // Update existing record
        const { data, error } = await supabase
          .from('monthly_balances')
          .update({
            monthly_income: amount,
            remaining_balance: amount - existingData.total_expenses
          })
          .eq('id', existingData.id)
          .select()
          .single()

        if (error) throw error

        if (targetMonth === now.getMonth() + 1 && targetYear === now.getFullYear()) {
          setCurrentBalance(data)
        }
      } else {
        // Create new record
        const newBalance = await createMonthlyBalance(amount, targetMonth, targetYear)
        
        if (targetMonth === now.getMonth() + 1 && targetYear === now.getFullYear()) {
          setCurrentBalance(newBalance)
        }
      }

      // Refresh history
      await getBalanceHistory()
    } catch (error) {
      console.error('Error updating monthly income:', error)
      throw error
    }
  }

  const value = {
    currentBalance,
    balanceHistory,
    loading,
    updateMonthlyIncome,
    getCurrentMonthBalance,
    getBalanceHistory,
    refreshBalances
  }

  return (
    <BalanceContext.Provider value={value}>
      {children}
    </BalanceContext.Provider>
  )
}