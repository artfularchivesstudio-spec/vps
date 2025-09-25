import { cn } from '@/lib/utils'
import * as React from 'react'

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
})
Select.displayName = 'Select'

const SelectContent = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const SelectItem = ({ children, value }: { children: React.ReactNode; value: string }) => {
  return <option value={value}>{children}</option>
}

const SelectTrigger = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const SelectValue = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
