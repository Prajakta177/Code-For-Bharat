import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface SavingsGoal {
  id: string
  user_id: string
  month: number
  year: number
  target_amount: number
  saved_amount: number
  is_achieved: boolean
  created_at: string
  updated_at: string
}

interface SavingsContextType {
  savingsGoals: SavingsGoal[]
  currentGoal: SavingsGoal | null
  loading: boolean
  setSavingsGoal: (targetAmount: number, month?: number, year?: number) => Promise<void>
  updateSavingsGoal: (id: string, targetAmount: number) => Promise<void>
  deleteSavingsGoal: (id: string) => Promise<void>
  getCurrentMonthGoal: () => Promise<SavingsGoal | null>
  getSavingsHistory: () => Promise<SavingsGoal[]>
  refreshSavings: () => Promise<void>
}

const SavingsContext = createContext<SavingsContextType | undefined>(undefined)

export const useSavings = () => {
  const context = useContext(SavingsContext)
  if (context === undefined) {
    throw new Error('useSavings must be used within a SavingsProvider')
  }
  return context
}

export const SavingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [currentGoal, setCurrentGoal] = useState<SavingsGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      refreshSavings()
    }
  }, [user])

  const refreshSavings = async () => {
    if (!user) return

    try {
      setLoading(true)
      await Promise.all([
        getCurrentMonthGoal(),
        getSavingsHistory()
      ])
    } catch (error) {
      console.error('Error refreshing savings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentMonthGoal = async (): Promise<SavingsGoal | null> => {
    if (!user) return null

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle()

      if (error) {
        throw error
      }

      setCurrentGoal(data || null)
      return data || null
    } catch (error) {
      console.error('Error getting current month savings goal:', error)
      return null
    }
  }

  const getSavingsHistory = async (): Promise<SavingsGoal[]> => {
    if (!user) return []

    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(12) // Last 12 months

      if (error) throw error

      setSavingsGoals(data || [])
      return data || []
    } catch (error) {
      console.error('Error getting savings history:', error)
      return []
    }
  }

  const setSavingsGoal = async (
    targetAmount: number, 
    month?: number, 
    year?: number
  ): Promise<void> => {
    if (!user) return

    const now = new Date()
    const targetMonth = month || (now.getMonth() + 1)
    const targetYear = year || now.getFullYear()

    try {
      // Check if goal already exists
      const { data: existingData, error: selectError } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', targetMonth)
        .eq('year', targetYear)
        .maybeSingle()

      if (selectError) {
        throw selectError
      }

      if (existingData) {
        // Update existing goal
        const { data, error } = await supabase
          .from('savings_goals')
          .update({ target_amount: targetAmount })
          .eq('id', existingData.id)
          .select()
          .single()

        if (error) throw error

        if (targetMonth === now.getMonth() + 1 && targetYear === now.getFullYear()) {
          setCurrentGoal(data)
        }
      } else {
        // Create new goal
        const { data, error } = await supabase
          .from('savings_goals')
          .insert({
            user_id: user.id,
            month: targetMonth,
            year: targetYear,
            target_amount: targetAmount,
            saved_amount: 0,
            is_achieved: false
          })
          .select()
          .single()

        if (error) throw error

        if (targetMonth === now.getMonth() + 1 && targetYear === now.getFullYear()) {
          setCurrentGoal(data)
        }
      }

      // Refresh history
      await getSavingsHistory()
    } catch (error) {
      console.error('Error setting savings goal:', error)
      throw error
    }
  }

  const updateSavingsGoal = async (id: string, targetAmount: number): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .update({ target_amount: targetAmount })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Update current goal if it's the one being updated
      if (currentGoal && currentGoal.id === id) {
        setCurrentGoal(data)
      }

      // Refresh history
      await getSavingsHistory()
    } catch (error) {
      console.error('Error updating savings goal:', error)
      throw error
    }
  }

  const deleteSavingsGoal = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Clear current goal if it's the one being deleted
      if (currentGoal && currentGoal.id === id) {
        setCurrentGoal(null)
      }

      // Refresh history
      await getSavingsHistory()
    } catch (error) {
      console.error('Error deleting savings goal:', error)
      throw error
    }
  }

  const value = {
    savingsGoals,
    currentGoal,
    loading,
    setSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    getCurrentMonthGoal,
    getSavingsHistory,
    refreshSavings
  }

  return (
    <SavingsContext.Provider value={value}>
      {children}
    </SavingsContext.Provider>
  )
}