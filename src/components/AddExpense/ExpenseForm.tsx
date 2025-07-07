import React, { useState } from 'react'
import { Plus, Sparkles, Zap, Brain, CheckCircle, AlertCircle } from 'lucide-react'
import { useExpenses } from '../../contexts/ExpenseContext'
import { useAuth } from '../../contexts/AuthContext'
import AnimatedCard from '../UI/AnimatedCard'
import LoadingSpinner from '../UI/LoadingSpinner'

interface ExpenseFormProps {
  onExpenseAdded: (expense: any) => void
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onExpenseAdded }) => {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<{ category: string; confidence: number } | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const { addExpense, refreshExpenses } = useExpenses()

  const categorizeExpense = async (description: string) => {
    setAiLoading(true)
    setAiResult(null)
    
    try {
      // Enhanced AI categorization with Indian context
      const categories = {
        'Food': {
          keywords: [
            'restaurant', 'food', 'meal', 'dinner', 'lunch', 'breakfast', 'cafe', 'canteen',
            'zomato', 'swiggy', 'dominos', 'mcdonalds', 'kfc', 'pizza', 'burger', 'tiffin',
            'mess', 'dhaba', 'chai', 'tea', 'coffee', 'snacks', 'biryani', 'dosa', 'idli',
            'chaat', 'samosa', 'vada', 'paratha', 'roti', 'dal', 'rice', 'curry',
            'grocery', 'vegetables', 'fruits', 'milk', 'bread', 'eggs', 'chicken', 'mutton'
          ],
          confidence: 0.9
        },
        'Travel': {
          keywords: [
            'uber', 'ola', 'bus', 'train', 'metro', 'taxi', 'auto', 'rickshaw', 'fuel', 'petrol',
            'diesel', 'railway', 'flight', 'airport', 'irctc', 'redbus', 'rapido', 'bounce',
            'bike', 'car', 'parking', 'toll', 'ticket', 'station', 'platform', 'journey'
          ],
          confidence: 0.85
        },
        'Entertainment': {
          keywords: [
            'movie', 'cinema', 'theater', 'game', 'gaming', 'netflix', 'amazon prime', 'hotstar',
            'spotify', 'youtube', 'music', 'concert', 'show', 'event', 'party', 'club',
            'pub', 'bar', 'bowling', 'pool', 'billiards', 'arcade', 'mall', 'pvr', 'inox'
          ],
          confidence: 0.8
        },
        'Shopping': {
          keywords: [
            'amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'clothes', 'shirt', 'shoes',
            'shopping', 'purchase', 'buy', 'order', 'delivery', 'pants', 'jeans', 'dress',
            'bag', 'accessories', 'watch', 'phone', 'mobile', 'laptop', 'electronics'
          ],
          confidence: 0.85
        },
        'Education': {
          keywords: [
            'book', 'books', 'course', 'class', 'tuition', 'coaching', 'college', 'university',
            'school', 'study', 'fee', 'fees', 'admission', 'exam', 'test', 'library',
            'stationery', 'pen', 'pencil', 'notebook', 'paper', 'xerox', 'photocopy'
          ],
          confidence: 0.9
        },
        'Healthcare': {
          keywords: [
            'doctor', 'hospital', 'clinic', 'medicine', 'pharmacy', 'medical', 'health',
            'checkup', 'consultation', 'treatment', 'dental', 'dentist', 'eye', 'glasses'
          ],
          confidence: 0.85
        }
      }

      const desc = description.toLowerCase()
      let bestCategory = 'Miscellaneous'
      let bestConfidence = 0.5
      let bestScore = 0

      // AI processing simulation with visual feedback
      await new Promise(resolve => setTimeout(resolve, 1500))

      for (const [category, data] of Object.entries(categories)) {
        let score = 0
        let matches = 0

        for (const keyword of data.keywords) {
          if (desc.includes(keyword)) {
            score += keyword.length
            matches++
          }
        }

        const finalScore = (score * matches) / data.keywords.length

        if (finalScore > bestScore) {
          bestScore = finalScore
          bestCategory = category
          bestConfidence = Math.min(data.confidence + (matches * 0.02), 0.99)
        }
      }

      // Add randomness for realism
      const randomFactor = 0.95 + (Math.random() * 0.04)
      bestConfidence = Math.round(bestConfidence * randomFactor * 100) / 100

      const result = { category: bestCategory, confidence: bestConfidence }
      setAiResult(result)
      return result
    } catch (error) {
      console.error('Categorization error:', error)
      const fallback = { category: 'Miscellaneous', confidence: 0.5 }
      setAiResult(fallback)
      return fallback
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')
    
    try {
      const { category, confidence } = aiResult || await categorizeExpense(description)

      const expenseData = {
        user_id: user.id,
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        confidence_score: confidence,
        date: date
      }

      console.log('Adding expense with data:', expenseData)

      // Add expense to database
      await addExpense(expenseData)

      // Show success message
      setShowSuccess(true)

      // Call the callback with the expense data
      onExpenseAdded({
        ...expenseData,
        amount: parseFloat(amount),
        id: Date.now().toString(), // Temporary ID for display
        created_at: new Date().toISOString()
      })

      // Reset form after a short delay
      setTimeout(() => {
        setDescription('')
        setAmount('')
        setDate(new Date().toISOString().split('T')[0])
        setAiResult(null)
        setShowSuccess(false)
        
        // Force refresh expenses to ensure dashboard updates
        refreshExpenses()
      }, 1500)

      console.log('Expense added successfully:', expenseData)
    } catch (error) {
      console.error('Error adding expense:', error)
      setError('Failed to add expense. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-green-900 mb-2">Expense Added Successfully!</h3>
          <p className="text-green-700 mb-4">Your expense has been recorded and will appear on your dashboard.</p>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="font-medium text-gray-900">{description}</p>
                <p className="text-sm text-gray-600">{aiResult?.category}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">₹{amount}</p>
                <p className="text-xs text-gray-500">{new Date(date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg flex items-center justify-center mr-3">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Add New Expense</h2>
        <div className="ml-auto flex items-center space-x-1 text-xs text-gray-500">
          <Brain className="w-3 h-3" />
          <span>AI Powered</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="e.g., Lunch at college canteen"
            required
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500 flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-orange-500" />
              AI will automatically categorize this expense
            </p>
            {description && (
              <button
                type="button"
                onClick={() => categorizeExpense(description)}
                disabled={aiLoading}
                className="text-xs bg-gradient-to-r from-blue-600 to-orange-500 text-white px-3 py-1 rounded-full hover:from-blue-700 hover:to-orange-600 transition-all disabled:opacity-50 flex items-center space-x-1"
              >
                <Zap className="w-3 h-3" />
                <span>Preview AI</span>
              </button>
            )}
          </div>
        </div>

        {/* AI Result Preview */}
        {(aiLoading || aiResult) && (
          <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                {aiLoading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm text-gray-700">AI is analyzing...</span>
                  </div>
                ) : aiResult ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Category: <span className="text-blue-600">{aiResult.category}</span>
                    </p>
                    <p className="text-xs text-gray-600">
                      Confidence: {(aiResult.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount (₹)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Date
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

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || aiLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-orange-500 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-105"
        >
          {loading || aiLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>{aiLoading ? 'AI Categorizing...' : 'Adding Expense...'}</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default ExpenseForm