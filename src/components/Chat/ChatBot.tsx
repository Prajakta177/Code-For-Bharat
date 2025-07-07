import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, X, Bot, User, Sparkles } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface Message {
  id: string
  message: string
  response?: string
  message_type: 'user' | 'assistant'
  created_at: string
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen && user) {
      loadChatHistory()
    }
  }, [isOpen, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChatHistory = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI processing with realistic delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    const lowerMessage = userMessage.toLowerCase()

    // Financial advice responses
    if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
      return "💰 Great question about saving! Here are some student-friendly tips:\n\n• Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings\n• Cook at home instead of ordering food - you can save ₹3000+ monthly\n• Use student discounts whenever possible\n• Track your daily expenses to identify spending patterns\n• Set up automatic transfers to a savings account"
    }

    if (lowerMessage.includes('budget') || lowerMessage.includes('budgeting')) {
      return "📊 Budgeting is key to financial success! Here's how to start:\n\n• List all your income sources (allowance, part-time job, etc.)\n• Track expenses for a week to understand your spending\n• Categorize expenses: Food, Travel, Entertainment, Education\n• Set realistic limits for each category\n• Review and adjust monthly\n• Use our budget feature to set automated alerts!"
    }

    if (lowerMessage.includes('food') || lowerMessage.includes('eating')) {
      return "🍽️ Food expenses are often the biggest for students! Try these:\n\n• Plan meals weekly and make a grocery list\n• Cook in batches and store portions\n• Limit eating out to 2-3 times per week\n• Share meals with friends to split costs\n• Look for student meal plans or discounts\n• Carry snacks to avoid impulse purchases"
    }

    if (lowerMessage.includes('travel') || lowerMessage.includes('transport')) {
      return "🚌 Smart travel tips for students:\n\n• Use public transport instead of cabs when possible\n• Get monthly bus/metro passes for better rates\n• Walk or cycle for short distances\n• Share rides with friends\n• Book train tickets in advance for discounts\n• Use student concession cards"
    }

    if (lowerMessage.includes('expense') || lowerMessage.includes('spending')) {
      return "📱 I can help you track expenses better:\n\n• Add expenses immediately after spending\n• Be specific in descriptions for better AI categorization\n• Review your weekly spending patterns\n• Set up budget alerts to avoid overspending\n• Use our insights feature for personalized recommendations\n• Export data monthly to analyze trends"
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "👋 Hello! I'm your AI financial assistant. I'm here to help you manage your expenses better!\n\nI can help you with:\n• Budgeting tips\n• Saving strategies\n• Expense tracking advice\n• Financial insights\n• Student-specific money tips\n\nWhat would you like to know about managing your finances?"
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return "🤖 I'm your personal finance AI assistant! Here's how I can help:\n\n💡 **Smart Insights**: Analyze your spending patterns\n📊 **Budget Advice**: Create realistic budgets\n💰 **Saving Tips**: Student-friendly money-saving strategies\n📱 **App Guidance**: Help you use ExpenseAI features\n🎯 **Goal Setting**: Plan for your financial goals\n\nJust ask me anything about managing your money as a student!"
    }

    // Default responses with variety
    const defaultResponses = [
      "🤔 That's an interesting question! While I specialize in financial advice, I'd love to help you with budgeting, saving, or expense tracking. What financial topic can I assist you with?",
      "💭 I'm focused on helping you manage your finances better! Ask me about budgeting, saving money, tracking expenses, or any financial challenges you're facing as a student.",
      "🎯 I'm your financial AI assistant! I can provide personalized advice on spending, saving, budgeting, and making the most of your money as a student. What would you like to know?",
      "✨ Let me help you with your finances! I can share tips on budgeting, saving strategies, expense management, or answer any money-related questions you have."
    ]

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Add user message immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      message: userMessage,
      message_type: 'user',
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMsg])

    try {
      // Save user message to database
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        message: userMessage,
        message_type: 'user'
      })

      // Generate AI response
      const aiResponse = await generateAIResponse(userMessage)

      // Add AI response
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        message: aiResponse,
        message_type: 'assistant',
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, aiMsg])

      // Save AI response to database
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        message: aiResponse,
        message_type: 'assistant'
      })

    } catch (error) {
      console.error('Error sending message:', error)
      // Add error message
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        message: "Sorry, I'm having trouble responding right now. Please try again!",
        message_type: 'assistant',
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Chat Toggle Button - Higher z-index */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 w-12 h-12 rounded-full shadow-lg transition-all duration-300 z-[60] flex items-center justify-center ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600 rotate-180' 
            : 'bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 animate-pulse'
        }`}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-5 h-5 text-white" />
            <Sparkles className="w-2 h-2 text-white absolute -top-0.5 -right-0.5 animate-bounce" />
          </div>
        )}
      </button>

      {/* Chat Window - Higher z-index to appear above navigation */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-80 h-96 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-[60] animate-in slide-in-from-bottom-4 duration-300">
          {/* Header - Made more compact */}
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-3 rounded-t-xl">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">ExpenseAI Assistant</h3>
                <p className="text-white/80 text-xs">Your finance helper</p>
              </div>
              <div className="ml-auto">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Messages - Reduced height */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 chat-messages">
            {messages.length === 0 && (
              <div className="text-center py-4">
                <Bot className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">
                  Hi! I'm your AI financial assistant. Ask me anything about managing your expenses!
                </p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-1.5 max-w-[75%] ${
                  msg.message_type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.message_type === 'user' 
                      ? 'bg-blue-500' 
                      : 'bg-gradient-to-r from-orange-500 to-orange-600'
                  }`}>
                    {msg.message_type === 'user' ? (
                      <User className="w-2.5 h-2.5 text-white" />
                    ) : (
                      <Bot className="w-2.5 h-2.5 text-white" />
                    )}
                  </div>
                  <div className={`p-2.5 rounded-xl text-xs ${
                    msg.message_type === 'user'
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    <p className="whitespace-pre-line leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-1.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                    <Bot className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div className="bg-gray-100 p-2.5 rounded-xl rounded-bl-sm">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input - Made more compact */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about budgeting, saving..."
                className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-orange-500 text-white p-1.5 rounded-lg hover:from-blue-700 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatBot