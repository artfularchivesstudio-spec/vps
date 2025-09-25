import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  lines?: number
  height?: string
  width?: string
}

export const Skeleton = ({ className, lines = 1, height = 'h-4', width = 'w-full' }: SkeletonProps) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
            height,
            width,
            className
          )}
        />
      ))}
    </div>
  )
}

export const SkeletonCard = ({ className }: { className?: string }) => {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="rounded-md bg-gray-200 dark:bg-gray-700 h-48 mb-4" />
      <Skeleton lines={3} />
    </div>
  )
}

export const SkeletonTable = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div key={colIndex} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  )
}