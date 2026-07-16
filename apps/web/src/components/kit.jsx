import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) {
  const variants = {
    primary:
      'bg-mv-accent text-mv-bg hover:bg-mv-accent2 focus-visible:ring-mv-accent',
    secondary:
      'bg-mv-elevated text-mv-text hover:bg-mv-border focus-visible:ring-mv-accent border border-mv-border',
    ghost: 'bg-transparent text-mv-textsec hover:bg-mv-elevated focus-visible:ring-mv-accent',
    danger: 'bg-destructive text-white hover:opacity-90 focus-visible:ring-destructive',
    outline:
      'bg-transparent border border-mv-accent text-mv-accent2 hover:bg-mv-accent hover:text-mv-bg focus-visible:ring-mv-accent',
  };
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-13 px-7 text-base py-3',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-mv-bg disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className, hover = false, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-mv-border bg-mv-card p-6',
        hover && 'transition-all duration-200 hover:border-mv-accent/60 hover:-translate-y-0.5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Field({ label, htmlFor, error, hint, children, className }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-mv-textsec">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-mv-muted">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export const Input = React.forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-xl border border-mv-border bg-mv-bg2 px-4 text-sm text-mv-text placeholder:text-mv-muted transition-colors focus:border-mv-accent focus:outline-none focus:ring-1 focus:ring-mv-accent',
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[96px] w-full rounded-xl border border-mv-border bg-mv-bg2 px-4 py-3 text-sm text-mv-text placeholder:text-mv-muted transition-colors focus:border-mv-accent focus:outline-none focus:ring-1 focus:ring-mv-accent',
        className,
      )}
      {...props}
    />
  );
});

export function Badge({ children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-mv-border bg-mv-elevated px-3 py-1 text-xs font-medium text-mv-textsec',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className }) {
  return <Loader2 className={cn('w-6 h-6 text-mv-accent animate-spin', className)} />;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-mv-border bg-mv-card/50 px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-mv-elevated text-mv-accent2">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-mv-text">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-mv-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-xl bg-mv-elevated/60', className)} />;
}
