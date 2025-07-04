import React, { useState } from 'react'
import { Wallet, TrendingUp, TrendingDown, Edit3, Save, X, History } from 'lucide-react'
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

  const handleEdit = () => {
    setEditAmount(currentBalance?.monthly_income.toString() || '0')
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!editAmount || isNaN(parseFloat(editAmount))) return

    setSaving(true)
    try {
      await updateMonthlyIncome(parseFloat(editAmount))
      setIsEditing(false)
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
    <AnimatedCard className="bg-gradient-to-br from-blue-600 via-blue-700 to-orange-600 rounded-2xl p-6 text-white shadow-xl border border-blue-500/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h2 className="text-lg font-medium text-blue-100">Monthly Balance</h2>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{currentMonth}</span>
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
                placeholder="Enter amount"
                autoFocus
              />
              <div className="flex space-x-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-2 bg-green-500/80 hover:bg-green-500 rounded-lg transition-colors disabled:opacity-50"
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
              <p className="text-3xl font-bold text-white">₹{monthlyIncome.toLocaleString()}</p>
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
          <p className="text-lg font-semibold text-white">₹{remainingBalance.toLocaleString()}</p>
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