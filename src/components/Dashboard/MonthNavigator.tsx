import React from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface MonthNavigatorProps {
  currentMonth: number
  currentYear: number
  onMonthChange: (month: number, year: number) => void
}

const MonthNavigator: React.FC<MonthNavigatorProps> = ({ 
  currentMonth, 
  currentYear, 
  onMonthChange 
}) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      onMonthChange(12, currentYear - 1)
    } else {
      onMonthChange(currentMonth - 1, currentYear)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      onMonthChange(1, currentYear + 1)
    } else {
      onMonthChange(currentMonth + 1, currentYear)
    }
  }

  const goToCurrentMonth = () => {
    const now = new Date()
    onMonthChange(now.getMonth() + 1, now.getFullYear())
  }

  const isCurrentMonth = () => {
    const now = new Date()
    return currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear()
  }

  return (
    <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <button
        onClick={goToPreviousMonth}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>

      <div className="flex items-center space-x-3">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth - 1]} {currentYear}
        </h2>
        {!isCurrentMonth() && (
          <button
            onClick={goToCurrentMonth}
            className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
          >
            Current
          </button>
        )}
      </div>

      <button
        onClick={goToNextMonth}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  )
}

export default MonthNavigator