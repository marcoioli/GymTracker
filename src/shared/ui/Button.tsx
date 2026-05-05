import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'default' | 'touch' | 'compact'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean
  size?: ButtonSize
  variant?: ButtonVariant
}

const VARIANT_CLASS_NAMES: Record<ButtonVariant, string> = {
  primary: 'cta-button',
  secondary: 'secondary-button',
  ghost: 'ghost-button',
  danger: 'ghost-button ghost-button--danger'
}

const SIZE_CLASS_NAMES: Record<ButtonSize, string> = {
  default: '',
  touch: 'button--touch',
  compact: 'button--compact'
}

export function Button({ className = '', fullWidth = false, size = 'default', type = 'button', variant = 'primary', ...props }: ButtonProps) {
  const classes = [VARIANT_CLASS_NAMES[variant], SIZE_CLASS_NAMES[size], fullWidth ? 'button--full-width' : '', className]
    .filter(Boolean)
    .join(' ')

  return <button className={classes} type={type} {...props} />
}
