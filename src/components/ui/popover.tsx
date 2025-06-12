import * as React from 'react';

export const Popover = ({
  children,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  return <>{children}</>;
};

export const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children }, _ref) => <>{children}</>);
PopoverTrigger.displayName = 'PopoverTrigger';

export const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: string }
>(({ className = '', ...props }, ref) => (
  <div ref={ref} className={`bg-popover z-50 w-72 rounded-md border p-4 ${className}`} {...props} />
));
PopoverContent.displayName = 'PopoverContent';
