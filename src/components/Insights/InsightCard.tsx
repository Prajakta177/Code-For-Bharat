import React from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'

interface InsightCardProps {
  title: string
  description: string
  type: 'warning' | 'success' | 'info' | 'tip'
  priority: 'high' | 'medium' | 'low'
}

const InsightCard: React.FC<InsightCardProps> = ({ title, description, type, priority }) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      case 'success':
        return <CheckCircle className="w-5 h-5" />
      case 'info':
        return <TrendingUp className="w-5 h-5" />
      case 'tip':
        return <TrendingDown className="w-5 h-5" />
      default:
        return <TrendingUp className="w-5 h-5" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'warning':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'tip':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getPriorityBadge = () => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    )
  }

  return (
    <div className={`p-4 rounded-lg border ${getStyles()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="mt-1">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-sm mt-1 opacity-90">{description}</p>
          </div>
        </div>
        {getPriorityBadge()}
      </div>
    </div>
  )
}

export default InsightCard