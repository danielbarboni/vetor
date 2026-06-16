import React from 'react'

export interface ToggleProps {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  label?: string
  style?: React.CSSProperties
}

/**
 * Toggle Switch — controlled component.
 *
 * Track: 38×22px, border-radius 99px
 * Knob off (.kb):  margin-left 0,  background --knob-off
 * Knob on (.kb-on): margin-left 16px, background --color-primary
 * Transition: all 0.18s
 */
export default function Toggle({ value, onChange, disabled, label, style }: ToggleProps) {
  function handleClick() {
    if (!disabled) {
      onChange(!value)
    }
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
      onClick={handleClick}
      role="switch"
      aria-checked={value}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {/* Track */}
      <div
        style={{
          width: '38px',
          height: '22px',
          borderRadius: '99px',
          border: '1px solid var(--border2)',
          background: 'var(--surface2)',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          transition: 'all 0.18s',
          position: 'relative',
        }}
      >
        {/* Knob */}
        <div
          className={value ? 'kb-on' : 'kb'}
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '99px',
            background: value ? 'var(--color-primary)' : 'var(--knob-off)',
            marginLeft: value ? '16px' : '0',
            transition: 'all 0.18s',
            flexShrink: 0,
          }}
        />
      </div>

      {/* Optional label */}
      {label && (
        <span
          style={{
            fontSize: '13px',
            color: 'var(--text)',
            fontWeight: 500,
            userSelect: 'none',
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
