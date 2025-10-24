import React from 'react';
import { cn } from '../../lib/utils';

interface InputGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({ children, className }) => {
  return (
    <div className={cn("relative flex", className)}>
      {children}
    </div>
  );
};

interface InputGroupPrefixProps {
  children: React.ReactNode;
  className?: string;
}

export const InputGroupPrefix: React.FC<InputGroupPrefixProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-md",
      className
    )}>
      {children}
    </div>
  );
};

interface InputGroupInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const InputGroupInput = React.forwardRef<HTMLInputElement, InputGroupInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-r-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
