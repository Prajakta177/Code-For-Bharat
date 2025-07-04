import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface Budget {
  id: string
  user_id: string
  category: string
  limit_amount: number
  current_spent: number
  period: string
  created_at: string
  updated_at: string
}

interface BudgetContextType {
  budgets: Budget[]
  loading: boolean
  addBudget: (budget: Omit<Budget, 'id' | 'user_id' | 'current_spent' | 'created_at' | 'updated_at'>) => Promise<void>
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  refreshBudgets: () => Promise<void>
  getBudgetSpending: (category: string, period: string) => Promise<number>
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined)

export const useBudgets = () => {
  const context = useContext(BudgetContext)
  if (context === undefined) {
    throw new Error('useBudgets must be used within a BudgetProvider')
  }
  return context
}

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      refreshBudgets()
      setupRealtimeSubscription()
    }
  }, [user])

  const refreshBudgets = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Update current_spent for each budget
      const updatedBudgets = await Promise.all(
        (data || []).map(async (budget) => {
          const spent = await getBudgetSpending(budget.category, budget.period)
          return { ...budget, current_spent: spent }
        })
      )
      
      setBudgets(updatedBudgets)
    } catch (error) {
      console.error('Error fetching budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user) return

    const subscription = supabase
      .channel('budgets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refreshBudgets() // Refresh when budgets change
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const getBudgetSpending = async (category: string, period: string): Promise<number> => {
    if (!user) return 0

    try {
      const now = new Date()
      let startDate: Date

      switch (period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'weekly':
          startDate = new Date(now)
          startDate.setDate(now.getDate() - now.getDay())
          break
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .eq('category', category)
        .gte('date', startDate.toISOString().split('T')[0])

      if (error) throw error

      return (data || []).reduce((sum, expense) => sum + expense.amount, 0)
    } catch (error) {
      console.error('Error calculating budget spending:', error)
      return 0
    }
  }

  const addBudget = async (budgetData: Omit<Budget, 'id' | 'user_id' | 'current_spent' | 'created_at' | 'updated_at'>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('budgets')
        .insert({
          ...budgetData,
          user_id: user.id,
          current_spent: 0
        })

      if (error) throw error
      await refreshBudgets()
    } catch (error) {
      console.error('Error adding budget:', error)
      throw error
    }
  }

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await refreshBudgets()
    } catch (error) {
      console.error('Error updating budget:', error)
      throw error
    }
  }

  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)

      if (error) throw error
      await refreshBudgets()
    } catch (error) {
      console.error('Error deleting budget:', error)
      throw error
    }
  }

  const value = {
    budgets,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    refreshBudgets,
    getBudgetSpending
  }

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  )
}