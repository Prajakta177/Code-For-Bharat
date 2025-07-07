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
    } else {
      // Clear expenses when user logs out
      setExpenses([])
      setLoading(false)
    }
  }, [user])

  const refreshExpenses = async () => {
    if (!user) return

    try {
      console.log('Refreshing expenses for user:', user.id)
      setLoading(true)
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching expenses:', error)
        throw error
      }
      
      console.log('Fetched expenses:', data)
      setExpenses(data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user) return

    console.log('Setting up realtime subscription for user:', user.id)
    
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
          console.log('Realtime expense change:', payload)
          
          if (payload.eventType === 'INSERT') {
            console.log('New expense added via realtime:', payload.new)
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
      console.log('Unsubscribing from realtime')
      subscription.unsubscribe()
    }
  }

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return

    try {
      console.log('Adding expense:', expenseData)
      
      const { data, error } = await supabase
        .from('expenses')
        .insert(expenseData)
        .select()
        .single()

      if (error) {
        console.error('Error adding expense:', error)
        throw error
      }
      
      console.log('Expense added successfully:', data)
      
      // Immediately update local state for instant feedback
      setExpenses(prev => [data, ...prev])
      
      // Also refresh to ensure consistency after a short delay
      setTimeout(() => {
        refreshExpenses()
      }, 1000)
      
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