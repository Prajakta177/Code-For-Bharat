import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface Expense {
  id: string
  user_id: string
  amount: number
  description: string
  category: string
  confidence_score: number
  date: string
  created_at: string
  updated_at: string
}

interface ExpenseContextType {
  expenses: Expense[]
  loading: boolean
  refreshExpenses: () => Promise<void>
  addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined)

export const useExpenses = () => {
  const context = useContext(ExpenseContext)
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpenseProvider')
  }
  return context
}

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      refreshExpenses()
      setupRealtimeSubscription()
    }
  }, [user])

  const refreshExpenses = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user) return

    const subscription = supabase
      .channel('expenses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setExpenses(prev => [payload.new as Expense, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setExpenses(prev => 
              prev.map(expense => 
                expense.id === payload.new.id ? payload.new as Expense : expense
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setExpenses(prev => 
              prev.filter(expense => expense.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('expenses')
        .insert(expenseData)

      if (error) throw error
      // The realtime subscription will handle updating the state
    } catch (error) {
      console.error('Error adding expense:', error)
      throw error
    }
  }

  const value = {
    expenses,
    loading,
    refreshExpenses,
    addExpense
  }

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  )
}