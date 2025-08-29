import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
}

export default function Card({ 
  children, 
  className = '',
  padding = 'md',
  shadow = 'md'
}: CardProps) {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg'
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8'
  }
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-lg',
    lg: 'shadow-xl'
  }
  
  const combinedClasses = `${baseClasses} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${className}`.trim()

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  )
}