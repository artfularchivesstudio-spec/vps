import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white hover:bg-primary/90 focus:ring-primary',
        destructive:
          'bg-danger text-white hover:bg-danger/90 focus:ring-danger',
        outline:
          'border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground focus:ring-accent',
        secondary:
          'bg-secondary text-white hover:bg-secondary/80 focus:ring-secondary',
        ghost: 'hover:bg-accent hover:text-accent-foreground focus:ring-accent',
        link: 'text-primary underline-offset-4 hover:underline focus:ring-primary',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={clsx(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };