import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ExpenseProvider } from './contexts/ExpenseContext'
import { BalanceProvider } from './contexts/BalanceContext'
import { BudgetProvider } from './contexts/BudgetContext'
import { SavingsProvider } from './contexts/SavingsContext'
import AuthForm from './components/Auth/AuthForm'
import Header from './components/Layout/Header'
import Sidebar from './components/Layout/Sidebar'
import ChatBot from './components/Chat/ChatBot'
import Dashboard from './pages/Dashboard'
import AddExpense from './pages/AddExpense'
import Analytics from './pages/Analytics'
import Budgets from './pages/Budgets'
import Savings from './pages/Savings'
import Insights from './pages/Insights'
import Settings from './pages/Settings'
import LoadingSpinner from './components/UI/LoadingSpinner'

const AppContent: React.FC = () => {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Loading ExpenseAI..." />
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'add-expense':
        return <AddExpense onExpenseAdded={() => setActiveTab('dashboard')} />
      case 'analytics':
        return <Analytics />
      case 'budgets':
        return <Budgets />
      case 'savings':
        return <Savings />
      case 'insights':
        return <Insights />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <SavingsProvider>
      <BudgetProvider>
        <BalanceProvider>
          <ExpenseProvider>
            <div className="min-h-screen bg-gray-50">
              <Header />
              <div className="flex">
                <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
                <main className="flex-1 p-6 animate-in fade-in duration-500">
                  {renderContent()}
                </main>
              </div>
              <ChatBot />
            </div>
          </ExpenseProvider>
        </BalanceProvider>
      </BudgetProvider>
    </SavingsProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App