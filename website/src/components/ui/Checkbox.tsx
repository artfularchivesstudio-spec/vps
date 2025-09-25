import { cn } from '@/lib/utils'
import * as React from 'react'

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    indeterminate?: boolean
  }
>(({ className, indeterminate, ...props }, ref) => {
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate || false
    }
  }, [indeterminate])

  React.useImperativeHandle(ref, () => inputRef.current!)

  return (
    <input
      ref={inputRef}
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800',
        'focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
})
Checkbox.displayName = 'Checkbox'

export { Checkbox }
