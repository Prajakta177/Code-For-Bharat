import React, { useState } from 'react'
import { Edit3, Save, X, Trash2 } from 'lucide-react'
import { useExpenses } from '../../contexts/ExpenseContext'
import LoadingSpinner from '../UI/LoadingSpinner'

interface Expense {
  id: string
  description: string
  category: string
  amount: number
  date: string
  confidence_score: number
}

interface EditableExpenseItemProps {
  expense: Expense
  onDelete?: (id: string) => void
}

const EditableExpenseItem: React.FC<EditableExpenseItemProps> = ({ expense, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    description: expense.description,
    amount: expense.amount.toString(),
    category: expense.category,
    date: expense.date
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { refreshExpenses } = useExpenses()

  const categories = [
    'Food', 'Travel', 'Entertainment', 'Shopping', 'Education', 
    'Healthcare', 'Utilities', 'Miscellaneous'
  ]

  const categoryColors: { [key: string]: string } = {
    'Food': 'bg-green-100 text-green-800',
    'Travel': 'bg-blue-100 text-blue-800',
    'Entertainment': 'bg-purple-100 text-purple-800',
    'Shopping': 'bg-pink-100 text-pink-800',
    'Education': 'bg-yellow-100 text-yellow-800',
    'Healthcare': 'bg-red-100 text-red-800',
    'Utilities': 'bg-gray-100 text-gray-800',
    'Miscellaneous': 'bg-gray-100 text-gray-800'
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!editData.description.trim() || !editData.amount || isNaN(parseFloat(editData.amount))) {
      return
    }

    setSaving(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      
      const { error } = await supabase
        .from('expenses')
        .update({
          description: editData.description.trim(),
          amount: parseFloat(editData.amount),
          category: editData.category,
          date: editData.date
        })
        .eq('id', expense.id)

      if (error) throw error

      setIsEditing(false)
      await refreshExpenses()
    } catch (error) {
      console.error('Error updating expense:', error)
      alert('Failed to update expense. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date
    })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    setDeleting(true)
    try {
      const { supabase } = await import('../../lib/supabase')
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id)

      if (error) throw error

      if (onDelete) {
        onDelete(expense.id)
      }
      await refreshExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Failed to delete expense. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            onKeyPress={handleKeyPress}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Description"
          />
          <input
            type="number"
            step="0.01"
            value={editData.amount}
            onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
            onKeyPress={handleKeyPress}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Amount"
          />
          <select
            value={editData.category}
            onChange={(e) => setEditData({ ...editData, category: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="date"
            value={editData.date}
            onChange={(e) => setEditData({ ...editData, date: e.target.value })}
            onKeyPress={handleKeyPress}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            title="Save changes"
          >
            {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
          </button>
          <button
            onClick={handleCancel}
            className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            title="Cancel editing"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-4 flex-1">
        <div className="flex flex-col">
          <p className="font-medium text-gray-900">{expense.description}</p>
          <p className="text-sm text-gray-500">{new Date(expense.date).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          categoryColors[expense.category] || categoryColors['Miscellaneous']
        }`}>
          {expense.category}
        </span>
        <span className="font-semibold text-gray-900 min-w-[80px] text-right">₹{expense.amount}</span>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleEdit}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            title="Edit expense"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            title="Delete expense"
          >
            {deleting ? <LoadingSpinner size="sm" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditableExpenseItem