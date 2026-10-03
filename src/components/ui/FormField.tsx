import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';

interface FieldWrapperProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

function FieldWrapper({ label, error, hint, required, children }: FieldWrapperProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required && <span className="text-burgundy"> *</span>}
      </label>
      {children(id, describedBy)}
      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-burgundy">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  'min-h-[44px] w-full border border-ink/20 bg-ivory px-3.5 py-2.5 text-base text-ink placeholder:text-ink-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:bg-ink/5 aria-[invalid=true]:border-burgundy';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & Omit<FieldWrapperProps, 'children'>;

export function TextField({ label, error, hint, required, className = '', ...props }: TextFieldProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required}>
      {(id, describedBy) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          required={required}
          className={`${inputClass} ${className}`}
          {...props}
        />
      )}
    </FieldWrapper>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & Omit<FieldWrapperProps, 'children'>;

export function TextAreaField({ label, error, hint, required, className = '', ...props }: TextAreaFieldProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required}>
      {(id, describedBy) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          required={required}
          rows={4}
          className={`${inputClass} resize-y`}
          {...props}
        />
      )}
    </FieldWrapper>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> &
  Omit<FieldWrapperProps, 'children'> & { children: ReactNode };

export function SelectField({ label, error, hint, required, className = '', children, ...props }: SelectFieldProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required}>
      {(id, describedBy) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          required={required}
          className={`${inputClass} ${className}`}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldWrapper>
  );
}
