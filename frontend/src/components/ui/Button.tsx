import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'destructive'
export type ButtonSize = 'compact' | 'standard' | 'wizard'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
}

/**
 * Canonical Button primitive.
 * Uses CSS aliases only — no hex values except destructive text (#FFFFFF per spec).
 *
 * Variants:
 *   primary    — --color-primary bg, --color-on-primary text
 *   secondary  — outlined --border2, --muted text
 *   destructive — --color-loss bg, #FFFFFF text (per UI-SPEC)
 *
 * Sizes:
 *   compact  — padding 9px 16px, font-size 11px, border-radius 10px
 *   standard — padding 11px 20px, font-size 12px, border-radius 10px
 *   wizard   — padding 12px 24px, font-size 12px, border-radius 12px
 */
export default function Button({
  variant = 'primary',
  size = 'standard',
  children,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    letterSpacing: '0.06em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'all 0.15s',
    opacity: disabled ? 0.45 : 1,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  }

  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    compact: {
      padding: '9px 16px',
      fontSize: '11px',
      borderRadius: '10px',
    },
    standard: {
      padding: '11px 20px',
      fontSize: '12px',
      borderRadius: '10px',
    },
    wizard: {
      padding: '12px 24px',
      fontSize: '12px',
      borderRadius: '12px',
    },
  }

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: 'var(--color-primary)',
      color: 'var(--color-on-primary)',
    },
    secondary: {
      background: 'transparent',
      border: '1px solid var(--border2)',
      color: 'var(--muted)',
    },
    destructive: {
      background: 'var(--color-loss)',
      color: '#FFFFFF', // per UI-SPEC: destructive buttons use white text
    },
  }

  return (
    <button
      disabled={disabled}
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}
