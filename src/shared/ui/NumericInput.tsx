import type { InputHTMLAttributes } from 'react'

import { Field } from './Field'

type NumericInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  align?: 'start' | 'center'
  hint?: string
  label: string
  size?: 'default' | 'touch'
}

export function NumericInput({ align = 'start', className = '', hint, id, inputMode = 'numeric', label, size = 'default', ...props }: NumericInputProps) {
  return (
    <Field className="numeric-input" hint={hint} htmlFor={id} label={label}>
      <input
        className={['text-input', size === 'touch' ? 'text-input--touch' : '', align === 'center' ? 'text-input--center' : '', className]
          .filter(Boolean)
          .join(' ')}
        id={id}
        inputMode={inputMode}
        type="text"
        {...props}
      />
    </Field>
  )
}
