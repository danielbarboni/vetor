import React, { useState } from 'react'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  hint?: string
  mono?: boolean // use JetBrains Mono for numeric/capital inputs
  error?: string
}

/**
 * Input field — universal text input.
 *
 * Background: --surface2
 * Border:     1px solid --border
 * Border-radius: 10px
 * Padding:    10px 13px
 * Font-size:  13px (13.5px for primary)
 * Focus:      border-color --color-primary
 * Disabled:   background --surface3, color --muted
 * Mono:       add font-family JetBrains Mono
 */
export default function Input({
  label,
  hint,
  mono,
  error,
  disabled,
  style,
  id,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false)
  const inputId = id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '12.5px',
            fontWeight: 600,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {label}
        </label>
      )}

      <input
        id={inputId}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          background: disabled ? 'var(--surface3)' : 'var(--surface2)',
          border: `1px solid ${error ? 'var(--color-loss)' : focused ? 'var(--color-primary)' : 'var(--border)'}`,
          borderRadius: '10px',
          padding: '10px 13px',
          color: disabled ? 'var(--muted)' : 'var(--color-text-hi)',
          fontSize: '13px',
          fontFamily: mono ? "'JetBrains Mono', monospace" : "var(--font-body)",
          outline: 'none',
          transition: 'border-color 0.15s',
          boxSizing: 'border-box',
          ...style,
        }}
        {...rest}
      />

      {error && (
        <span
          style={{
            fontSize: '11px',
            color: 'var(--color-loss)',
            marginTop: '2px',
          }}
        >
          {error}
        </span>
      )}

      {hint && !error && (
        <span
          style={{
            fontSize: '11px',
            color: 'var(--muted2)',
            marginTop: '2px',
          }}
        >
          {hint}
        </span>
      )}
    </div>
  )
}
