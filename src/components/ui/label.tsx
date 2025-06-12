import * as React from 'react';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = '', ...props }, ref) => (
    <label ref={ref} className={`text-sm font-medium ${className}`} {...props} />
  )
);
Label.displayName = 'Label';
