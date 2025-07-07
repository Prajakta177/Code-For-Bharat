import React, { useState, useEffect } from 'react'
import { Wallet, TrendingUp, TrendingDown, PieChart, Sparkles, Plus, Calendar } from 'lucide-react'
import { useExpenses } from '../contexts/ExpenseContext'
import { useBalance } from '../contexts/BalanceContext'
import { useAuth } from '../contexts/AuthContext'
import StatsCard from '../components/Dashboard/StatsCard'
import ExpenseChart from '../components/Dashboard/ExpenseChart'
import RecentExpenses from '../components/Dashboard/RecentExpenses'
import EditableBalanceCard from '../components/Dashboard/EditableBalanceCard'
import BalanceHistoryModal from '../components/Dashboard/BalanceHistoryModal'
import MonthNavigator from '../components/Dashboard/MonthNavigator'
import AnimatedCard from '../components/UI/AnimatedCard'
import LoadingSpinner from '../components/UI/LoadingSpinner'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const { expenses, loading: expensesLoading, refreshExpenses } = useExpenses()
  const { currentBalance, loading: balanceLoading } = useBalance()
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const loading = expensesLoading || balanceLoading

  // Force refresh expenses when component mounts
  useEffect(() => {
    if (user) {
      console.log('Dashboard mounted, refreshing expenses...')
      refreshExpenses()
    }
  }, [user])

  // Filter expenses for selected month/year
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() + 1 === selectedMonth && expenseDate.getFullYear() === selectedYear
  })

  console.log('Dashboard - Total expenses:', expenses.length)
  console.log('Dashboard - Filtered expenses for current month:', filteredExpenses.length)

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  
  // Get current month data for balance card
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear
  
  const monthlyIncome = isCurrentMonth ? (currentBalance?.monthly_income || 0) : 0
  const remainingBalance = isCurrentMonth ? (currentBalance?.remaining_balance || 0) : monthlyIncome - totalExpenses

  // Calculate previous month comparison
  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1
  const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear
  
  const prevMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() + 1 === prevMonth && expenseDate.getFullYear() === prevYear
  })

  const prevMonthTotal = prevMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const monthlyChange = prevMonthTotal - totalExpenses // Positive means we spent less this month

  // Calculate category breakdown for selected month
  const categoryTotals = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {})

  const chartData = Object.entries(categoryTotals).map(([category, amount]) => ({
    name: category,
    value: amount as number,
    color: {
      'Food': '#10b981',
      'Travel': '#3b82f6',
      'Entertainment': '#8b5cf6',
      'Shopping': '#ec4899',
      'Education': '#f59e0b',
      'Healthcare': '#ef4444',
      'Utilities': '#6b7280',
      'Miscellaneous': '#6b7280'
    }[category] || '#6b7280'
  }))

  const recentExpenses = filteredExpenses.slice(0, 5)

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month)
    setSelectedYear(year)
  }

  const getMonthName = (month: number, year: number) => {
    return new Date(year, month - 1).toLocaleString('default', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AnimatedCard delay={0}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              Dashboard
              <Sparkles className="w-6 h-6 ml-2 text-orange-500" />
            </h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.email?.split('@')[0]}!</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">AI-Powered Insights</p>
            <p className="text-xs text-gray-400">
              {expenses.length} total expenses • Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </AnimatedCard>

      {/* Month Navigator */}
      <AnimatedCard delay={50}>
        <MonthNavigator 
          currentMonth={selectedMonth}
          currentYear={selectedYear}
          onMonthChange={handleMonthChange}
        />
      </AnimatedCard>

      {/* Balance Card - Only show for current month */}
      {isCurrentMonth && (
        <AnimatedCard delay={100}>
          <EditableBalanceCard onViewHistory={() => setShowHistoryModal(true)} />
        </AnimatedCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedCard delay={200}>
          <StatsCard
            title={`${getMonthName(selectedMonth, selectedYear)} Expenses`}
            value={`₹${totalExpenses.toFixed(2)}`}
            change={`${filteredExpenses.length} transactions`}
            changeType="neutral"
            icon={Wallet}
            color="bg-gradient-to-r from-blue-600 to-blue-700"
          />
        </AnimatedCard>
        <AnimatedCard delay={300}>
          <StatsCard
            title="Daily Average"
            value={`₹${filteredExpenses.length > 0 ? (totalExpenses / new Date(selectedYear, selectedMonth, 0).getDate()).toFixed(2) : '0.00'}`}
            change="This month"
            changeType="neutral"
            icon={TrendingUp}
            color="bg-gradient-to-r from-green-600 to-green-700"
          />
        </AnimatedCard>
        <AnimatedCard delay={400}>
          <StatsCard
            title="Categories"
            value={Object.keys(categoryTotals).length.toString()}
            change="Active categories"
            changeType="neutral"
            icon={PieChart}
            color="bg-gradient-to-r from-purple-600 to-purple-700"
          />
        </AnimatedCard>
        <AnimatedCard delay={500}>
          <StatsCard
            title="vs Previous Month"
            value={`₹${Math.abs(monthlyChange).toFixed(2)}`}
            change={monthlyChange >= 0 ? 'Less spent' : 'More spent'}
            changeType={monthlyChange >= 0 ? 'decrease' : 'increase'}
            icon={monthlyChange >= 0 ? TrendingDown : TrendingUp}
            color="bg-gradient-to-r from-orange-600 to-orange-700"
          />
        </AnimatedCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedCard delay={600}>
          {chartData.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Expense Breakdown - {getMonthName(selectedMonth, selectedYear)}
              </h3>
              <ExpenseChart data={chartData} />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Expense Breakdown - {getMonthName(selectedMonth, selectedYear)}
              </h3>
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No expenses for {getMonthName(selectedMonth, selectedYear)}</p>
                  {isCurrentMonth && (
                    <>
                      <p className="text-sm mt-2">Add your first expense to see AI insights!</p>
                      <button 
                        onClick={() => window.location.hash = '#add-expense'}
                        className="mt-4 bg-gradient-to-r from-blue-600 to-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:from-blue-700 hover:to-orange-600 transition-all flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Expense</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </AnimatedCard>
        <AnimatedCard delay={700}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Expenses - {getMonthName(selectedMonth, selectedYear)}
            </h3>
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No expenses for this month yet.</p>
                {isCurrentMonth && (
                  <p className="text-sm text-gray-400 mt-2">Start tracking your expenses to see them here!</p>
                )}
              </div>
            ) : (
              <RecentExpenses expenses={recentExpenses} />
            )}
          </div>
        </AnimatedCard>
      </div>

      {filteredExpenses.length > 0 && (
        <AnimatedCard delay={800} className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              AI Insights - {getMonthName(selectedMonth, selectedYear)}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white/50 rounded-lg p-3">
              <p className="font-medium text-gray-900">Top Category</p>
              <p className="text-gray-600">
                {chartData.length > 0 
                  ? chartData.reduce((max, cat) => cat.value > max.value ? cat : max).name
                  : 'No data'
                }
              </p>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <p className="font-medium text-gray-900">AI Accuracy</p>
              <p className="text-gray-600">
                {filteredExpenses.length > 0 
                  ? `${Math.round(filteredExpenses.reduce((sum, exp) => sum + exp.confidence_score, 0) / filteredExpenses.length * 100)}%`
                  : 'No data'
                }
              </p>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <p className="font-medium text-gray-900">Transactions</p>
              <p className="text-gray-600">{filteredExpenses.length}</p>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <p className="font-medium text-gray-900">
                {isCurrentMonth ? 'Savings Rate' : 'Month Status'}
              </p>
              <p className="text-gray-600">
                {isCurrentMonth && monthlyIncome > 0 
                  ? `${Math.round((remainingBalance / monthlyIncome) * 100)}%`
                  : `₹${totalExpenses.toFixed(2)} spent`
                }
              </p>
            </div>
          </div>
        </AnimatedCard>
      )}

      {/* Quick Actions for Current Month */}
      {isCurrentMonth && (
        <AnimatedCard delay={900} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
            >
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">View Balance History</p>
                <p className="text-sm text-blue-600">Track your monthly financial progress</p>
              </div>
            </button>
          </div>
        </AnimatedCard>
      )}

      {/* Balance History Modal */}
      <BalanceHistoryModal 
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </div>
  )
}

export default Dashboard