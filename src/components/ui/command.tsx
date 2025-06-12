import * as React from 'react';

export const Command = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => <div ref={ref} {...props} />
);
Command.displayName = 'Command';

export const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ ...props }, ref) => <input ref={ref} {...props} />);
CommandInput.displayName = 'CommandInput';

export const CommandList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => <div ref={ref} {...props} />
);
CommandList.displayName = 'CommandList';

export const CommandEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => <div ref={ref} {...props} />
);
CommandEmpty.displayName = 'CommandEmpty';

export type CommandGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  heading?: string;
};

export const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProps>(
  ({ heading, children, ...props }, ref) => (
    <div ref={ref} {...props}>
      {heading && (
        <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">{heading}</div>
      )}
      {children}
    </div>
  )
);
CommandGroup.displayName = 'CommandGroup';

export type CommandItemProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string;
  onSelect?: (value: string) => void;
  disabled?: boolean;
};

export const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(
  ({ onSelect, value, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e);
      if (value) {
        onSelect?.(value);
      }
    };

    return <div ref={ref} onClick={handleClick} {...props} />;
  }
);
CommandItem.displayName = 'CommandItem';

export const CommandSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => <div ref={ref} {...props} />);
CommandSeparator.displayName = 'CommandSeparator';
