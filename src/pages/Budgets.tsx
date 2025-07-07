import React, { useState } from 'react'
import { Target, AlertCircle, CheckCircle, Plus, Edit3, Trash2 } from 'lucide-react'
import { useBudgets } from '../contexts/BudgetContext'
import AddBudgetModal from '../components/Budget/AddBudgetModal'
import AnimatedCard from '../components/UI/AnimatedCard'
import LoadingSpinner from '../components/UI/LoadingSpinner'

const Budgets: React.FC = () => {
  const { budgets, loading, deleteBudget } = useBudgets()
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const getProgressColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusIcon = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100
    if (percentage >= 100) return <AlertCircle className="w-5 h-5 text-red-500" />
    if (percentage >= 90) return <AlertCircle className="w-5 h-5 text-yellow-500" />
    return <CheckCircle className="w-5 h-5 text-green-500" />
  }

  const getStatusText = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100
    if (percentage >= 100) return 'Over Budget'
    if (percentage >= 90) return 'Near Limit'
    return 'On Track'
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteBudget(id)
    } catch (error) {
      console.error('Error deleting budget:', error)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading budgets..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AnimatedCard delay={0}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
            <p className="text-gray-600 mt-2">Track and manage your spending limits</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-orange-600 transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Budget</span>
          </button>
        </div>
      </AnimatedCard>

      {budgets.length === 0 ? (
        <AnimatedCard delay={100} className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Budgets Yet</h3>
            <p className="text-gray-600 mb-6">Create your first budget to start tracking your spending limits.</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-600 to-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-orange-600 transition-all flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Budget</span>
            </button>
          </div>
        </AnimatedCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget, index) => (
            <AnimatedCard key={budget.id} delay={index * 100}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{budget.category}</h3>
                      <p className="text-sm text-gray-500 capitalize">{budget.period}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(budget.current_spent, budget.limit_amount)}
                    <div className="flex space-x-1">
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                        <Edit3 className="w-3 h-3 text-gray-500" />
                      </button>
                      <button 
                        onClick={() => handleDelete(budget.id)}
                        disabled={deletingId === budget.id}
                        className="p-1 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                      >
                        {deletingId === budget.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Trash2 className="w-3 h-3 text-red-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Spent</span>
                    <span className="font-medium">₹{budget.current_spent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Limit</span>
                    <span className="font-medium">₹{budget.limit_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining</span>
                    <span className={`font-medium ${budget.current_spent > budget.limit_amount ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{Math.max(0, budget.limit_amount - budget.current_spent).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-medium text-xs px-2 py-1 rounded-full ${
                      budget.current_spent >= budget.limit_amount 
                        ? 'bg-red-100 text-red-600'
                        : budget.current_spent >= budget.limit_amount * 0.9
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {getStatusText(budget.current_spent, budget.limit_amount)}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{Math.round((budget.current_spent / budget.limit_amount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(budget.current_spent, budget.limit_amount)} transition-all`}
                      style={{ width: `${Math.min((budget.current_spent / budget.limit_amount) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}

      <AnimatedCard delay={400} className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Budget Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium mb-2">Smart Budgeting</h4>
            <ul className="space-y-1">
              <li>• Set realistic budgets based on your income</li>
              <li>• Use the 50/30/20 rule for allocation</li>
              <li>• Review and adjust budgets monthly</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Stay on Track</h4>
            <ul className="space-y-1">
              <li>• Track expenses daily to avoid overspending</li>
              <li>• Set up alerts when approaching limits</li>
              <li>• Celebrate when you stay under budget</li>
            </ul>
          </div>
        </div>
      </AnimatedCard>

      <AddBudgetModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  )
}

export default Budgets