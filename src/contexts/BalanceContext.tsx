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
      setupRealtimeSubscription()
      loadCachedBalance()
    }
  }, [user])

  // Load cached balance from localStorage
  const loadCachedBalance = () => {
    if (!user) return
    
    try {
      const cached = localStorage.getItem(`balance_${user.id}`)
      if (cached) {
        const cachedBalance = JSON.parse(cached)
        // Only use cache if it's for current month
        const now = new Date()
        if (cachedBalance.month === now.getMonth() + 1 && cachedBalance.year === now.getFullYear()) {
          setCurrentBalance(cachedBalance)
        }
      }
    } catch (error) {
      console.error('Error loading cached balance:', error)
    }
  }

  // Save balance to localStorage
  const cacheBalance = (balance: MonthlyBalance) => {
    if (!user) return
    
    try {
      localStorage.setItem(`balance_${user.id}`, JSON.stringify(balance))
    } catch (error) {
      console.error('Error caching balance:', error)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user) return

    const subscription = supabase
      .channel('balance_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monthly_balances',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Balance changed:', payload)
          refreshBalances() // Refresh when balances change
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

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
        .select('id,user_id,month,year,monthly_income,total_expenses,remaining_balance,created_at,updated_at')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (data) {
        setCurrentBalance(data)
        cacheBalance(data)
        return data
      } else {
        // Create current month record if it doesn't exist
        try {
          const newBalance = await createMonthlyBalance(0, currentMonth, currentYear)
          setCurrentBalance(newBalance)
          cacheBalance(newBalance)
          return newBalance
        } catch (createError: any) {
          // Handle race condition: if another process created the record first
          if (createError?.code === '23505' || createError?.message?.includes('unique constraint')) {
            // Re-fetch the existing record that was created by another process
            const { data: existingData, error: refetchError } = await supabase
              .from('monthly_balances')
              .select('id,user_id,month,year,monthly_income,total_expenses,remaining_balance,created_at,updated_at')
              .eq('user_id', user.id)
              .eq('month', currentMonth)
              .eq('year', currentYear)
              .single()

            if (refetchError) {
              throw refetchError
            }

            setCurrentBalance(existingData)
            cacheBalance(existingData)
            return existingData
          }
          // Re-throw if it's a different error
          throw createError
        }
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
        .select('id,user_id,month,year,monthly_income,total_expenses,remaining_balance,created_at,updated_at')
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
      .select('id,user_id,month,year,monthly_income,total_expenses,remaining_balance,created_at,updated_at')
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
        .select('id,user_id,month,year,monthly_income,total_expenses,remaining_balance,created_at,updated_at')
        .eq('user_id', user.id)
        .eq('month', targetMonth)
        .eq('year', targetYear)
        .maybeSingle()

      if (selectError) {
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
          .select('id,user_id,month,year,monthly_income,total_expenses,remaining_balance,created_at,updated_at')
          .single()

        if (error) throw error

        if (targetMonth === now.getMonth() + 1 && targetYear === now.getFullYear()) {
          setCurrentBalance(data)
          cacheBalance(data)
        }
      } else {
        // Create new record
        try {
          const newBalance = await createMonthlyBalance(amount, targetMonth, targetYear)
          
          if (targetMonth === now.getMonth() + 1 && targetYear === now.getFullYear()) {
            setCurrentBalance(newBalance)
            cacheBalance(newBalance)
          }
        } catch (createError: any) {
          // Handle race condition during income update
          if (createError?.code === '23505' || createError?.message?.includes('unique constraint')) {
            // Re-fetch and update the existing record
            const { data: existingData, error: refetchError } = await supabase
              .from('monthly_balances')
              .select('id,user_id,month,year,monthly_income,total_expenses,remaining_balance,created_at,updated_at')
              .eq('user_id', user.id)
              .eq('month', targetMonth)
              .eq('year', targetYear)
              .single()

            if (refetchError) {
              throw refetchError
            }

            // Update the existing record with new income
            const { data: updatedData, error: updateError } = await supabase
              .from('monthly_balances')
              .update({
                monthly_income: amount,
                remaining_balance: amount - existingData.total_expenses
              })
              .eq('id', existingData.id)
              .select('id,user_id,month,year,monthly_income,total_expenses,remaining_balance,created_at,updated_at')
              .single()

            if (updateError) {
              throw updateError
            }

            if (targetMonth === now.getMonth() + 1 && targetYear === now.getFullYear()) {
              setCurrentBalance(updatedData)
              cacheBalance(updatedData)
            }
          } else {
            throw createError
          }
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