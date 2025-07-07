import React, { useState } from 'react'
import { Plus, CheckCircle, ArrowLeft, Calendar, DollarSign, Tag, FileText, Sparkles } from 'lucide-react'
import { useExpenses } from '../contexts/ExpenseContext'
import { useAuth } from '../contexts/AuthContext'
import AnimatedCard from '../components/UI/AnimatedCard'
import LoadingSpinner from '../components/UI/LoadingSpinner'

interface AddExpenseProps {
  onExpenseAdded?: () => void
}

const AddExpense: React.FC<AddExpenseProps> = ({ onExpenseAdded }) => {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [addedExpense, setAddedExpense] = useState<any>(null)
  const [error, setError] = useState('')

  const { user } = useAuth()
  const { addExpense, refreshExpenses } = useExpenses()

  const categories = [
    'Food',
    'Travel', 
    'Entertainment',
    'Shopping',
    'Education',
    'Healthcare',
    'Utilities',
    'Miscellaneous'
  ]

  const categoryIcons = {
    'Food': '🍽️',
    'Travel': '🚗',
    'Entertainment': '🎬',
    'Shopping': '🛍️',
    'Education': '📚',
    'Healthcare': '🏥',
    'Utilities': '💡',
    'Miscellaneous': '📦'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!amount || !category || !date) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const expenseData = {
        user_id: user.id,
        description: note.trim() || `${category} expense`,
        amount: parseFloat(amount),
        category,
        confidence_score: 0.95, // High confidence for manual entry
        date: date
      }

      console.log('Adding expense with data:', expenseData)

      // Add expense to database
      await addExpense(expenseData)

      // Show success message
      setAddedExpense({
        ...expenseData,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      })
      setShowSuccess(true)

      // Reset form after a short delay
      setTimeout(() => {
        setAmount('')
        setCategory('')
        setNote('')
        setDate(new Date().toISOString().split('T')[0])
        setShowSuccess(false)
        setAddedExpense(null)
        
        // Force refresh expenses to ensure dashboard updates
        refreshExpenses()
        
        // Navigate back to dashboard if callback provided
        if (onExpenseAdded) {
          onExpenseAdded()
        }
      }, 2000)

    } catch (error) {
      console.error('Error adding expense:', error)
      setError('Failed to add expense. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAnother = () => {
    setAmount('')
    setCategory('')
    setNote('')
    setDate(new Date().toISOString().split('T')[0])
    setShowSuccess(false)
    setAddedExpense(null)
    setError('')
  }

  const handleGoToDashboard = () => {
    if (onExpenseAdded) {
      onExpenseAdded()
    }
  }

  if (showSuccess && addedExpense) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <AnimatedCard className="bg-green-50 border border-green-200 rounded-xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-900 mb-2">Expense Added Successfully!</h3>
            <p className="text-green-700 mb-6">Your expense has been recorded and will appear on your dashboard.</p>
            
            <div className="bg-white rounded-lg p-6 border border-green-200 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{categoryIcons[addedExpense.category as keyof typeof categoryIcons]}</span>
                    <div>
                      <p className="font-medium text-gray-900 text-lg">{addedExpense.category}</p>
                      {addedExpense.description !== `${addedExpense.category} expense` && (
                        <p className="text-sm text-gray-600">{addedExpense.description}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(addedExpense.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">₹{parseFloat(addedExpense.amount).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 justify-center">
              <button
                onClick={handleAddAnother}
                className="flex items-center space-x-2 bg-white text-green-700 border border-green-300 px-6 py-3 rounded-lg hover:bg-green-50 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another</span>
              </button>
              <button
                onClick={handleGoToDashboard}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-orange-600 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </button>
            </div>
            
            <p className="text-sm text-green-600 mt-4">
              Automatically redirecting to dashboard in a few seconds...
            </p>
          </div>
        </AnimatedCard>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <AnimatedCard delay={0}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Expense</h1>
          <p className="text-gray-600 mt-2">Track your spending with detailed categorization</p>
        </div>
      </AnimatedCard>

      <AnimatedCard delay={100}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount Field */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span>Expense Amount *</span>
                </div>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Date Field */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Date *</span>
                </div>
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                required
              />
            </div>

            {/* Category Field */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span>Category *</span>
                </div>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-1 ${
                      category === cat
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{categoryIcons[cat as keyof typeof categoryIcons]}</span>
                    <span className="text-xs font-medium">{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Note Field */}
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Note (Optional)</span>
                </div>
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                placeholder="Add a description or note about this expense..."
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !amount || !category}
              className="w-full bg-gradient-to-r from-blue-600 to-orange-500 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-105"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Adding Expense...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Save Expense</span>
                </>
              )}
            </button>
          </form>
        </div>
      </AnimatedCard>

      <AnimatedCard delay={200}>
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-orange-500" />
            Smart Expense Tracking Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-2">Be Specific</h4>
              <ul className="space-y-1">
                <li>• Add detailed notes for better tracking</li>
                <li>• Choose the most accurate category</li>
                <li>• Include merchant or location names</li>
                <li>• Record expenses immediately</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Stay Organized</h4>
              <ul className="space-y-1">
                <li>• Review your expenses weekly</li>
                <li>• Set up budgets for each category</li>
                <li>• Use the dashboard for insights</li>
                <li>• Track patterns and trends</li>
              </ul>
            </div>
          </div>
        </div>
      </AnimatedCard>
    </div>
  )
}

export default AddExpense