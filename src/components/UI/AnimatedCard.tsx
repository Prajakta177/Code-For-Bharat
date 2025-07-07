import React from 'react'

interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  delay?: number
  hover?: boolean
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  className = '', 
  delay = 0,
  hover = true 
}) => {
  return (
    <div 
      className={`
        animate-in fade-in slide-in-from-bottom-4 duration-700 
        ${hover ? 'hover:scale-105 hover:shadow-lg transition-all duration-300' : ''}
        ${className}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export default AnimatedCard