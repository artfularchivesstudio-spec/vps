import React from 'react';
import { cn } from '@/lib/utils';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  className?: string;
}

// Simple toast function for basic usage
export const toast = (options: {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}) => {
  const { title, description, variant = 'default' } = options;
  // For now, we'll use a simple alert
  // In a real implementation, you'd want to use a proper toast library
  const message = title ? `${title}${description ? ': ' + description : ''}` : description || 'Notification';
  
  if (variant === 'destructive') {
    console.error(message);
    alert(`Error: ${message}`);
  } else if (variant === 'success') {
    console.log(message);
    alert(`Success: ${message}`);
  } else {
    console.log(message);
    alert(message);
  }
};

// Toast component for rendering
const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, title, description, variant = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-white border-gray-200 text-gray-900',
      destructive: 'bg-red-50 border-red-200 text-red-900',
      success: 'bg-green-50 border-green-200 text-green-900'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full rounded-lg border p-4 shadow-lg',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {title && (
          <div className="font-semibold mb-1">{title}</div>
        )}
        {description && (
          <div className="text-sm opacity-90">{description}</div>
        )}
      </div>
    );
  }
);

Toast.displayName = 'Toast';

export { Toast };
export type { ToastProps };