import React, { useState } from 'react'
import { Wallet, TrendingUp, TrendingDown, Edit3, Save, X, History, Check } from 'lucide-react'
import { useBalance } from '../../contexts/BalanceContext'
import AnimatedCard from '../UI/AnimatedCard'
import LoadingSpinner from '../UI/LoadingSpinner'

interface EditableBalanceCardProps {
  onViewHistory: () => void
}

const EditableBalanceCard: React.FC<EditableBalanceCardProps> = ({ onViewHistory }) => {
  const { currentBalance, updateMonthlyIncome, loading } = useBalance()
  const [isEditing, setIsEditing] = useState(false)
  const [editAmount, setEditAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showTickAnimation, setShowTickAnimation] = useState(false)

  const handleEdit = () => {
    setEditAmount(currentBalance?.monthly_income.toString() || '0')
    setIsEditing(true)
  }

  const showSuccessMessage = () => {
    setShowSuccess(true)
    setShowTickAnimation(true)
    setTimeout(() => {
      setShowSuccess(false)
      setShowTickAnimation(false)
    }, 2000)
  }

  const handleSave = async () => {
    if (!editAmount || isNaN(parseFloat(editAmount))) return

    setSaving(true)
    try {
      await updateMonthlyIncome(parseFloat(editAmount))
      setIsEditing(false)
      showSuccessMessage()
    } catch (error) {
      console.error('Error updating income:', error)
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
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (loading) {
    return (
      <AnimatedCard className="bg-gradient-to-br from-blue-600 via-blue-700 to-orange-600 rounded-2xl p-6 text-white shadow-xl border border-blue-500/20">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="md" />
        </div>
      </AnimatedCard>
    )
  }

  const monthlyIncome = currentBalance?.monthly_income || 0
  const totalExpenses = currentBalance?.total_expenses || 0
  const remainingBalance = currentBalance?.remaining_balance || 0

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <AnimatedCard className="bg-gradient-to-br from-blue-600 via-blue-700 to-orange-600 rounded-2xl p-6 text-white shadow-xl border border-blue-500/20 relative overflow-hidden">
      {/* Success Toast */}
      {showSuccess && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-top-2 duration-300 z-10">
          <Check className={`w-4 h-4 ${showTickAnimation ? 'animate-bounce' : ''}`} />
          <span className="text-sm font-medium">Monthly Balance Updated!</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h2 className="text-lg font-medium text-blue-100">Monthly Balance</h2>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{currentMonth}</span>
          </div>
          
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">₹</span>
              <div className="relative">
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="bg-white/20 text-white placeholder-white/70 border border-white/30 rounded-lg px-3 py-2 text-xl font-bold w-40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
                  placeholder="Enter amount"
                  autoFocus
                />
                {/* Enter key hint */}
                <div className="absolute -bottom-6 left-0 text-xs text-blue-200 opacity-75">
                  Press Enter to save
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-2 bg-green-500/80 hover:bg-green-500 rounded-lg transition-colors disabled:opacity-50 group"
                  title="Save (or press Enter)"
                >
                  {saving ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors group"
                  title="Cancel (or press Escape)"
                >
                  <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <p className="text-3xl font-bold text-white">₹{monthlyIncome.toLocaleString()}</p>
              <button
                onClick={handleEdit}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors group"
                title="Edit monthly income"
              >
                <Edit3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              {/* Success tick animation */}
              {showTickAnimation && (
                <div className="p-2 bg-green-500 rounded-lg animate-bounce">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <button
            onClick={onViewHistory}
            className="flex items-center space-x-1 text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-full transition-colors"
          >
            <History className="w-3 h-3" />
            <span>History</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-4 h-4 text-red-300" />
            <span className="text-sm text-blue-100">Spent</span>
          </div>
          <p className="text-lg font-semibold text-white">₹{totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-300" />
            <span className="text-sm text-blue-100">Remaining</span>
          </div>
          <p className={`text-lg font-semibold transition-colors duration-500 ${
            showSuccess ? 'text-green-300' : 'text-white'
          }`}>
            ₹{remainingBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-blue-100">Budget Usage</span>
          <span className="font-medium">
            {monthlyIncome > 0 ? `${Math.round((totalExpenses / monthlyIncome) * 100)}%` : '0%'}
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              totalExpenses > monthlyIncome
                ? 'bg-red-400'
                : totalExpenses > monthlyIncome * 0.8
                ? 'bg-yellow-400'
                : 'bg-green-400'
            }`}
            style={{
              width: `${Math.min(
                monthlyIncome > 0 ? (totalExpenses / monthlyIncome) * 100 : 0,
                100
              )}%`
            }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-blue-100">Budget Status</span>
        <div className={`flex items-center space-x-1 ${
          remainingBalance >= 0 ? 'text-green-300' : 'text-red-300'
        }`}>
          {remainingBalance >= 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {remainingBalance >= 0 ? 'On Track' : 'Over Budget'}
          </span>
        </div>
      </div>

      {!isEditing && (
        <div className="mt-4 text-xs text-blue-200 bg-white/10 rounded-lg p-2">
          💡 Click the edit icon to update your monthly income/allowance
        </div>
      )}
    </AnimatedCard>
  )
}

export default EditableBalanceCard