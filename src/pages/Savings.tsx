import React, { useState } from 'react'
import { Target, Award, TrendingUp, Calendar, History, Sparkles, Edit3, Save, X } from 'lucide-react'
import { useSavings } from '../contexts/SavingsContext'
import { useBalance } from '../contexts/BalanceContext'
import SavingsHistoryModal from '../components/Savings/SavingsHistoryModal'
import AnimatedCard from '../components/UI/AnimatedCard'
import LoadingSpinner from '../components/UI/LoadingSpinner'

const Savings: React.FC = () => {
  const { currentGoal, setSavingsGoal, loading: savingsLoading } = useSavings()
  const { currentBalance, loading: balanceLoading } = useBalance()
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editAmount, setEditAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const loading = savingsLoading || balanceLoading

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  const remainingBalance = currentBalance?.remaining_balance || 0
  const targetAmount = currentGoal?.target_amount || 0
  const savedAmount = Math.max(remainingBalance, 0)
  const isAchieved = savedAmount >= targetAmount && targetAmount > 0
  const progressPercentage = targetAmount > 0 ? Math.min((savedAmount / targetAmount) * 100, 100) : 0

  const handleEdit = () => {
    setEditAmount(targetAmount.toString())
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!editAmount || isNaN(parseFloat(editAmount))) return

    setSaving(true)
    try {
      await setSavingsGoal(parseFloat(editAmount))
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating savings goal:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditAmount('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading savings data..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AnimatedCard delay={0}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              Savings Goals
              <Sparkles className="w-6 h-6 ml-2 text-green-500 animate-pulse" />
            </h1>
            <p className="text-gray-600 mt-2">Set and track your monthly savings targets</p>
          </div>
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center space-x-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg transition-colors"
          >
            <History className="w-4 h-4" />
            <span>View History</span>
          </button>
        </div>
      </AnimatedCard>

      {/* Main Savings Goal Card */}
      <AnimatedCard delay={100}>
        <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-600 rounded-2xl p-8 text-white shadow-xl border border-green-500/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-xl font-medium text-green-100">Monthly Savings Target</h2>
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">{currentMonth}</span>
                {isAchieved && (
                  <div className="flex items-center space-x-1">
                    <Award className="w-5 h-5 text-yellow-300" />
                    <span className="text-sm text-yellow-300 font-medium">Goal Achieved!</span>
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <div className="flex items-center space-x-3">
                  <span className="text-3xl font-bold">₹</span>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-white/20 text-white placeholder-white/70 border border-white/30 rounded-lg px-4 py-3 text-2xl font-bold w-48 focus:outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="Enter target amount"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {saving ? <LoadingSpinner size="sm" /> : <Save className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-3 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <p className="text-4xl font-bold text-white">
                    ₹{targetAmount > 0 ? targetAmount.toLocaleString() : '0'}
                  </p>
                  <button
                    onClick={handleEdit}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end space-y-3">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
              {isAchieved && (
                <Sparkles className="w-6 h-6 text-yellow-300 animate-bounce" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-300" />
                <span className="text-green-100">Amount Saved</span>
              </div>
              <p className="text-2xl font-semibold text-white">₹{savedAmount.toLocaleString()}</p>
              <p className="text-sm text-green-200 mt-1">From remaining balance</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-5 h-5 text-blue-300" />
                <span className="text-green-100">Still Needed</span>
              </div>
              <p className="text-2xl font-semibold text-white">
                ₹{Math.max(0, targetAmount - savedAmount).toLocaleString()}
              </p>
              <p className="text-sm text-green-200 mt-1">To reach your goal</p>
            </div>
          </div>

          {/* Progress Bar */}
          {targetAmount > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-green-100">Progress towards goal</span>
                <span className="font-medium text-lg">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${
                    isAchieved ? 'bg-yellow-400' : 'bg-white'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-green-100">
              {targetAmount > 0 ? 'Savings Status' : 'Set your monthly savings target'}
            </span>
            <div className={`flex items-center space-x-2 ${
              isAchieved ? 'text-yellow-300' : savedAmount > 0 ? 'text-green-300' : 'text-white'
            }`}>
              {isAchieved ? (
                <>
                  <Award className="w-5 h-5" />
                  <span className="font-medium">Congratulations! Goal Achieved!</span>
                </>
              ) : savedAmount > 0 ? (
                <>
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">Making Progress</span>
                </>
              ) : (
                <span className="font-medium">
                  {targetAmount > 0 ? 'Not Started' : 'No Goal Set'}
                </span>
              )}
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* How It Works */}
      <AnimatedCard delay={200}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-600" />
            How Savings Work
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Set Your Target</h4>
              <p className="text-sm text-gray-600">
                Set a monthly savings goal based on your income and expenses
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Track Progress</h4>
              <p className="text-sm text-gray-600">
                Your savings are calculated from your remaining monthly balance
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Achieve Goals</h4>
              <p className="text-sm text-gray-600">
                Reach your target and build healthy financial habits
              </p>
            </div>
          </div>
        </div>
      </AnimatedCard>

      {/* Tips */}
      <AnimatedCard delay={300}>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Savings Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-2 text-green-800">Smart Saving Strategies</h4>
              <ul className="space-y-1">
                <li>• Start with small, achievable goals (10-20% of income)</li>
                <li>• Automate your savings by setting monthly targets</li>
                <li>• Track your progress weekly to stay motivated</li>
                <li>• Celebrate when you achieve your monthly goals</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-green-800">Increase Your Savings</h4>
              <ul className="space-y-1">
                <li>• Reduce unnecessary expenses like frequent dining out</li>
                <li>• Use student discounts and offers whenever possible</li>
                <li>• Cook meals at home instead of ordering food</li>
                <li>• Review and adjust your budget monthly</li>
              </ul>
            </div>
          </div>
        </div>
      </AnimatedCard>

      {!isEditing && targetAmount === 0 && (
        <AnimatedCard delay={400}>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <Target className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to Start Saving?</h3>
            <p className="text-blue-700 mb-4">
              Set your first monthly savings goal and start building your financial future!
            </p>
            <button
              onClick={handleEdit}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Set Savings Goal
            </button>
          </div>
        </AnimatedCard>
      )}

      <SavingsHistoryModal 
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </div>
  )
}

export default Savings