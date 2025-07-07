import React, { useState } from 'react'
import { Target, Edit3, Save, X, TrendingUp, Award, Sparkles } from 'lucide-react'
import { useSavings } from '../../contexts/SavingsContext'
import { useBalance } from '../../contexts/BalanceContext'
import LoadingSpinner from '../UI/LoadingSpinner'

const SavingsGoalCard: React.FC = () => {
  const { currentGoal, setSavingsGoal, loading } = useSavings()
  const { currentBalance } = useBalance()
  const [isEditing, setIsEditing] = useState(false)
  const [editAmount, setEditAmount] = useState('')
  const [saving, setSaving] = useState(false)

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
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-600 rounded-2xl p-6 text-white shadow-xl border border-green-500/20">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="md" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-600 rounded-2xl p-6 text-white shadow-xl border border-green-500/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h2 className="text-lg font-medium text-green-100">Savings Goal</h2>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{currentMonth}</span>
            {isAchieved && (
              <div className="flex items-center space-x-1">
                <Award className="w-4 h-4 text-yellow-300" />
                <span className="text-xs text-yellow-300 font-medium">Achieved!</span>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">₹</span>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-white/20 text-white placeholder-white/70 border border-white/30 rounded-lg px-3 py-2 text-xl font-bold w-40 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="Enter target"
                autoFocus
              />
              <div className="flex space-x-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCancel}
                  className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <p className="text-3xl font-bold text-white">
                ₹{targetAmount > 0 ? targetAmount.toLocaleString() : '0'}
              </p>
              <button
                onClick={handleEdit}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          {isAchieved && (
            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-300" />
            <span className="text-sm text-green-100">Saved</span>
          </div>
          <p className="text-lg font-semibold text-white">₹{savedAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-blue-300" />
            <span className="text-sm text-green-100">Remaining</span>
          </div>
          <p className="text-lg font-semibold text-white">
            ₹{Math.max(0, targetAmount - savedAmount).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {targetAmount > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-green-100">Progress</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                isAchieved ? 'bg-yellow-400' : 'bg-white'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-green-100">
          {targetAmount > 0 ? 'Savings Status' : 'Set your first goal'}
        </span>
        <div className={`flex items-center space-x-1 ${
          isAchieved ? 'text-yellow-300' : savedAmount > 0 ? 'text-green-300' : 'text-white'
        }`}>
          {isAchieved ? (
            <>
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">Goal Achieved!</span>
            </>
          ) : savedAmount > 0 ? (
            <>
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">In Progress</span>
            </>
          ) : (
            <span className="text-sm font-medium">
              {targetAmount > 0 ? 'Not Started' : 'No Goal Set'}
            </span>
          )}
        </div>
      </div>

      {!isEditing && targetAmount === 0 && (
        <div className="mt-4 text-xs text-green-200 bg-white/10 rounded-lg p-2">
          💡 Click the edit icon to set your monthly savings target
        </div>
      )}

      {!isEditing && targetAmount > 0 && !isAchieved && (
        <div className="mt-4 text-xs text-green-200 bg-white/10 rounded-lg p-2">
          💪 You need ₹{(targetAmount - savedAmount).toLocaleString()} more to reach your goal!
        </div>
      )}
    </div>
  )
}

export default SavingsGoalCard