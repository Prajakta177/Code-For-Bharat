import React from 'react'
import InsightCard from '../components/Insights/InsightCard'
import { Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react'

const Insights: React.FC = () => {
  const insights = [
    {
      title: "High Food Spending Alert",
      description: "You've spent 25% more on food this month compared to last month. Consider cooking at home more often to save money.",
      type: "warning" as const,
      priority: "high" as const
    },
    {
      title: "Great Job on Travel Budget!",
      description: "You're 20% under your travel budget this month. Keep up the good work with public transport usage.",
      type: "success" as const,
      priority: "medium" as const
    },
    {
      title: "Weekend Spending Pattern",
      description: "You tend to spend 40% more on weekends. Try planning weekend activities with a set budget.",
      type: "info" as const,
      priority: "medium" as const
    },
    {
      title: "Savings Opportunity",
      description: "Based on your spending pattern, you could save ₹2,000 monthly by reducing entertainment expenses by 30%.",
      type: "tip" as const,
      priority: "high" as const
    },
    {
      title: "Category Diversification",
      description: "Your expenses are well-distributed across categories. This shows good financial balance.",
      type: "success" as const,
      priority: "low" as const
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Insights</h1>
          <p className="text-gray-600 mt-2">AI-powered recommendations to improve your spending habits</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Lightbulb className="w-4 h-4" />
          <span>Updated daily</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-red-600">2</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Medium Priority</p>
              <p className="text-2xl font-bold text-yellow-600">2</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Low Priority</p>
              <p className="text-2xl font-bold text-green-600">1</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Your Insights</h2>
        {insights.map((insight, index) => (
          <InsightCard
            key={index}
            title={insight.title}
            description={insight.description}
            type={insight.type}
            priority={insight.priority}
          />
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 How AI Insights Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium mb-2">Pattern Recognition</h4>
            <p>AI analyzes your spending patterns to identify trends and anomalies in your financial behavior.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Personalized Recommendations</h4>
            <p>Based on your unique spending habits, AI provides tailored advice to help you save money.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Behavioral Analysis</h4>
            <p>The system learns from your transaction history to predict future spending and suggest optimizations.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Real-time Updates</h4>
            <p>Insights are updated daily as you add new expenses, ensuring recommendations stay relevant.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Insights