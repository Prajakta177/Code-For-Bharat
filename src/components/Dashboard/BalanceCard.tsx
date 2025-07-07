import React from 'react'
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import AnimatedCard from '../UI/AnimatedCard'

interface BalanceCardProps {
  totalBalance: number
  totalIncome: number
  totalExpenses: number
  monthlyChange: number
}

const BalanceCard: React.FC<BalanceCardProps> = ({ 
  totalBalance, 
  totalIncome, 
  totalExpenses, 
  monthlyChange 
}) => {
  const isPositiveChange = monthlyChange >= 0

  return (
    <AnimatedCard className="bg-gradient-to-br from-blue-600 via-blue-700 to-orange-600 rounded-2xl p-6 text-white shadow-xl border border-blue-500/20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-blue-100">Total Balance</h2>
          <p className="text-3xl font-bold text-white">₹{totalBalance.toLocaleString()}</p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Wallet className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-300" />
            <span className="text-sm text-blue-100">Income</span>
          </div>
          <p className="text-lg font-semibold text-white">₹{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-4 h-4 text-red-300" />
            <span className="text-sm text-blue-100">Expenses</span>
          </div>
          <p className="text-lg font-semibold text-white">₹{totalExpenses.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-blue-100">This month</span>
        <div className={`flex items-center space-x-1 ${
          isPositiveChange ? 'text-green-300' : 'text-red-300'
        }`}>
          {isPositiveChange ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isPositiveChange ? '+' : ''}₹{Math.abs(monthlyChange).toLocaleString()}
          </span>
        </div>
      </div>
    </AnimatedCard>
  )
}

export default BalanceCard