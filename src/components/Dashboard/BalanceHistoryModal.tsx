import React from 'react'
import { X, Calendar, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { useBalance } from '../../contexts/BalanceContext'
import LoadingSpinner from '../UI/LoadingSpinner'

interface BalanceHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

const BalanceHistoryModal: React.FC<BalanceHistoryModalProps> = ({ isOpen, onClose }) => {
  const { balanceHistory, loading } = useBalance()

  if (!isOpen) return null

  const getMonthName = (month: number, year: number) => {
    return new Date(year, month - 1).toLocaleString('default', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const getStatusColor = (remaining: number) => {
    if (remaining > 0) return 'text-green-600 bg-green-50'
    if (remaining === 0) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getStatusText = (remaining: number) => {
    if (remaining > 0) return 'Surplus'
    if (remaining === 0) return 'Balanced'
    return 'Deficit'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Balance History</h2>
                <p className="text-blue-100">Track your monthly financial progress</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Loading balance history..." />
            </div>
          ) : balanceHistory.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No History Yet</h3>
              <p className="text-gray-600">Start tracking your expenses to build your balance history.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {balanceHistory.map((balance) => (
                <div
                  key={balance.id}
                  className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getMonthName(balance.month, balance.year)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Updated {new Date(balance.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(balance.remaining_balance)}`}>
                      {getStatusText(balance.remaining_balance)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Income</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900">
                        ₹{balance.monthly_income.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-gray-600">Expenses</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900">
                        ₹{balance.total_expenses.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Wallet className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-600">Remaining</span>
                      </div>
                      <p className={`text-xl font-bold ${
                        balance.remaining_balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ₹{balance.remaining_balance.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="w-4 h-4 bg-purple-600 rounded-full"></span>
                        <span className="text-sm font-medium text-gray-600">Savings Rate</span>
                      </div>
                      <p className="text-xl font-bold text-purple-600">
                        {balance.monthly_income > 0 
                          ? `${Math.round((balance.remaining_balance / balance.monthly_income) * 100)}%`
                          : '0%'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Spending Progress</span>
                      <span>
                        {balance.monthly_income > 0 
                          ? `${Math.round((balance.total_expenses / balance.monthly_income) * 100)}%`
                          : '0%'
                        } of income spent
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          balance.total_expenses > balance.monthly_income
                            ? 'bg-red-500'
                            : balance.total_expenses > balance.monthly_income * 0.8
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            balance.monthly_income > 0 
                              ? (balance.total_expenses / balance.monthly_income) * 100 
                              : 0,
                            100
                          )}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing last {balanceHistory.length} months of balance history
            </p>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-blue-600 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-orange-600 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BalanceHistoryModal