import React from 'react'
import EditableExpenseItem from './EditableExpenseItem'

interface Expense {
  id: string
  description: string
  category: string
  amount: number
  date: string
  confidence_score: number
}

interface RecentExpensesProps {
  expenses: Expense[]
}

const RecentExpenses: React.FC<RecentExpensesProps> = ({ expenses }) => {
  return (
    <div className="space-y-4">
      {expenses.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No expenses yet. Add your first expense!</p>
      ) : (
        expenses.map((expense) => (
          <EditableExpenseItem 
            key={expense.id} 
            expense={expense}
          />
        ))
      )}
    </div>
  )
}

export default RecentExpenses