import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import Link from 'next/link';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-display uppercase tracking-widest2 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 min-h-[44px]';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-ivory hover:bg-lime hover:text-ink',
  secondary: 'border border-ink text-ink hover:bg-ink hover:text-ivory',
  ghost: 'text-ink underline-offset-8 hover:text-burgundy hover:underline',
  danger: 'bg-burgundy text-ivory hover:bg-burgundy-light',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-[11px]',
  md: 'px-6 py-3 text-xs',
  lg: 'px-8 py-4 text-sm',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...props }, ref) => (
    <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
  ),
);
Button.displayName = 'Button';

export function LinkButton({
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </Link>
  );
}
