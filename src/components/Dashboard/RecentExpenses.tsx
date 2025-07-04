import React from 'react'
import { format } from 'date-fns'

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
  const categoryColors: { [key: string]: string } = {
    'Food': 'bg-green-100 text-green-800',
    'Travel': 'bg-blue-100 text-blue-800',
    'Entertainment': 'bg-purple-100 text-purple-800',
    'Shopping': 'bg-pink-100 text-pink-800',
    'Education': 'bg-yellow-100 text-yellow-800',
    'Miscellaneous': 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Expenses</h3>
      <div className="space-y-4">
        {expenses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No expenses yet. Add your first expense!</p>
        ) : (
          expenses.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex flex-col">
                  <p className="font-medium text-gray-900">{expense.description}</p>
                  <p className="text-sm text-gray-500">{format(new Date(expense.date), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  categoryColors[expense.category] || categoryColors['Miscellaneous']
                }`}>
                  {expense.category}
                </span>
                <span className="font-semibold text-gray-900">₹{expense.amount}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default RecentExpenses