import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Calendar, TrendingUp, TrendingDown, PieChart as PieChartIcon, BarChart3 } from 'lucide-react'
import { useExpenses } from '../contexts/ExpenseContext'
import MonthNavigator from '../components/Dashboard/MonthNavigator'
import AnimatedCard from '../components/UI/AnimatedCard'
import LoadingSpinner from '../components/UI/LoadingSpinner'

const Analytics: React.FC = () => {
  const { expenses, loading } = useExpenses()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Filter expenses for selected month
  const monthlyExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() + 1 === selectedMonth && expenseDate.getFullYear() === selectedYear
  })

  // Generate daily data for the selected month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate()
  }

  const dailyData = Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => {
    const day = i + 1
    const dayExpenses = monthlyExpenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getDate() === day
    })
    const total = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    return {
      day: day.toString(),
      expenses: total,
      transactions: dayExpenses.length
    }
  })

  // Generate last 6 months data
  const monthlyTrendData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(selectedYear, selectedMonth - 1 - i, 1)
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() + 1 === month && expenseDate.getFullYear() === year
    })
    
    const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    return {
      month: date.toLocaleString('default', { month: 'short' }),
      expenses: total,
      year: year
    }
  }).reverse()

  // Category breakdown for selected month
  const categoryData = monthlyExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {})

  const categoryChartData = Object.entries(categoryData).map(([category, amount]) => ({
    category,
    amount: amount as number,
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

  // Weekly analysis
  const getWeeklyData = () => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
    return weeks.map((week, index) => {
      const startDay = index * 7 + 1
      const endDay = Math.min((index + 1) * 7, getDaysInMonth(selectedMonth, selectedYear))
      
      const weekExpenses = monthlyExpenses.filter(expense => {
        const day = new Date(expense.date).getDate()
        return day >= startDay && day <= endDay
      })
      
      return {
        week,
        expenses: weekExpenses.reduce((sum, expense) => sum + expense.amount, 0),
        transactions: weekExpenses.length
      }
    })
  }

  const weeklyData = getWeeklyData()

  // Calculate insights
  const totalMonthExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const avgDailyExpense = totalMonthExpenses / getDaysInMonth(selectedMonth, selectedYear)
  const topCategory = categoryChartData.length > 0 
    ? categoryChartData.reduce((max, cat) => cat.amount > max.amount ? cat : max)
    : null
  const avgConfidence = monthlyExpenses.length > 0 
    ? monthlyExpenses.reduce((sum, exp) => sum + exp.confidence_score, 0) / monthlyExpenses.length
    : 0

  const getMonthName = (month: number, year: number) => {
    return new Date(year, month - 1).toLocaleString('default', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month)
    setSelectedYear(year)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AnimatedCard delay={0}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Detailed insights into your spending patterns</p>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <AnimatedCard delay={100}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-blue-600">₹{totalMonthExpenses.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={150}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Daily Average</p>
                <p className="text-2xl font-bold text-green-600">₹{avgDailyExpense.toFixed(0)}</p>
              </div>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={200}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <PieChartIcon className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Top Category</p>
                <p className="text-2xl font-bold text-purple-600">
                  {topCategory ? topCategory.category : 'None'}
                </p>
              </div>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={250}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">AI Accuracy</p>
                <p className="text-2xl font-bold text-orange-600">{Math.round(avgConfidence * 100)}%</p>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>

      {monthlyExpenses.length === 0 ? (
        <AnimatedCard delay={300} className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600">
              No expenses found for {getMonthName(selectedMonth, selectedYear)}. 
              Add some expenses to see detailed analytics.
            </p>
          </div>
        </AnimatedCard>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatedCard delay={300}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Daily Spending - {getMonthName(selectedMonth, selectedYear)}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                    <Line type="monotone" dataKey="expenses" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </AnimatedCard>

            <AnimatedCard delay={350}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Category Breakdown - {getMonthName(selectedMonth, selectedYear)}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </AnimatedCard>

            <AnimatedCard delay={400}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend (Last 6 Months)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                    <Bar dataKey="expenses" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AnimatedCard>

            <AnimatedCard delay={450}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Weekly Breakdown - {getMonthName(selectedMonth, selectedYear)}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                    <Bar dataKey="expenses" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AnimatedCard>
          </div>

          {/* Detailed Analysis */}
          <AnimatedCard delay={500}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Detailed Analysis - {getMonthName(selectedMonth, selectedYear)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Spending Patterns</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Highest spending day:</span>
                      <span className="font-medium">
                        Day {dailyData.reduce((max, day) => day.expenses > max.expenses ? day : max).day}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Most active week:</span>
                      <span className="font-medium">
                        {weeklyData.reduce((max, week) => week.transactions > max.transactions ? week : max).week}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total transactions:</span>
                      <span className="font-medium">{monthlyExpenses.length}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Category Insights</h4>
                  <div className="space-y-2 text-sm">
                    {categoryChartData.slice(0, 3).map((cat, index) => (
                      <div key={cat.category} className="flex justify-between">
                        <span className="text-gray-600">{cat.category}:</span>
                        <span className="font-medium">₹{cat.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">AI Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average confidence:</span>
                      <span className="font-medium">{Math.round(avgConfidence * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{"High confidence (>80%):"}</span>
                      <span className="font-medium">
                        {monthlyExpenses.filter(exp => exp.confidence_score > 0.8).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Categories detected:</span>
                      <span className="font-medium">{Object.keys(categoryData).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </>
      )}
    </div>
  )
}

export default Analytics