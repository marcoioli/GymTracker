import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

type FieldProps = {
  children: ReactNode
  className?: string
  compact?: boolean
  hint?: ReactNode
  htmlFor?: string
  label: ReactNode
}

type FieldInputProps = InputHTMLAttributes<HTMLInputElement>
type FieldSelectProps = SelectHTMLAttributes<HTMLSelectElement>
type FieldTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function Field({ children, className = '', compact = false, hint, htmlFor, label }: FieldProps) {
  return (
    <label className={['ui-field', compact ? 'ui-field--compact' : '', className].filter(Boolean).join(' ')} htmlFor={htmlFor}>
      <span className="ui-field__label">{label}</span>
      {hint ? <span className="ui-field__hint">{hint}</span> : null}
      {children}
    </label>
  )
}

export function FieldInput({ className = '', ...props }: FieldInputProps) {
  return <input className={['text-input', className].filter(Boolean).join(' ')} {...props} />
}

export function FieldSelect({ className = '', ...props }: FieldSelectProps) {
  return <select className={['text-input', className].filter(Boolean).join(' ')} {...props} />
}

export function FieldTextarea({ className = '', ...props }: FieldTextareaProps) {
  return <textarea className={['text-input', className].filter(Boolean).join(' ')} {...props} />
}
