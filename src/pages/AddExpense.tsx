import React, { useState } from 'react'
import ExpenseForm from '../components/AddExpense/ExpenseForm'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import AnimatedCard from '../components/UI/AnimatedCard'

interface AddExpenseProps {
  onExpenseAdded?: () => void
}

const AddExpense: React.FC<AddExpenseProps> = ({ onExpenseAdded }) => {
  const [showSuccess, setShowSuccess] = useState(false)

  const handleExpenseAdded = () => {
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      if (onExpenseAdded) {
        onExpenseAdded()
      }
    }, 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <AnimatedCard delay={0}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Add New Expense</h1>
          <p className="text-gray-600 mt-2">Track your spending with AI-powered categorization</p>
        </div>
      </AnimatedCard>

      {showSuccess && (
        <AnimatedCard className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div className="flex-1">
            <p className="text-green-800 font-medium">Expense added successfully!</p>
            <p className="text-green-700 text-sm">Redirecting to dashboard...</p>
          </div>
        </AnimatedCard>
      )}

      <AnimatedCard delay={200}>
        <ExpenseForm onExpenseAdded={handleExpenseAdded} />
      </AnimatedCard>

      <AnimatedCard delay={400} className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Smart Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Be specific in your descriptions for better AI categorization</li>
          <li>• Include merchant names (e.g., "Lunch at McDonald's")</li>
          <li>• Add expenses regularly to get better insights</li>
          <li>• Use consistent naming for recurring expenses</li>
          <li>• Check the AI preview before submitting for accuracy</li>
        </ul>
      </AnimatedCard>
    </div>
  )
}

export default AddExpense