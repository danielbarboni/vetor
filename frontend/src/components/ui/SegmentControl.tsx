import React from 'react'

export interface SegmentOption {
  value: string
  label: string
}

export interface SegmentControlProps {
  options: SegmentOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  style?: React.CSSProperties
}

/**
 * Segment Control — multi-option selector.
 *
 * Container: display flex, background --surface2, border --border, border-radius 10px, padding 4px
 * Item (.sg):    flex 1 1 auto, padding 7px 10px, font-size 12px, font-weight 600,
 *                letter-spacing 0.03em, border-radius 8px, color --muted
 * Active (.sg-on): background --seg-on (--color-primary), color --seg-on-tx,
 *                  box-shadow 0 1px 6px rgba(0,0,0,0.22)
 */
export default function SegmentControl({
  options,
  value,
  onChange,
  disabled,
  style,
}: SegmentControlProps) {
  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '4px',
        gap: '2px',
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
      role="group"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            className={active ? 'sg-on' : 'sg'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '1 1 auto',
              padding: '7px 10px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.03em',
              borderRadius: '8px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              border: 'none',
              background: active ? 'var(--seg-on)' : 'transparent',
              color: active ? 'var(--seg-on-tx)' : 'var(--muted)',
              boxShadow: active ? '0 1px 6px rgba(0,0,0,0.22)' : 'none',
              whiteSpace: 'nowrap',
            }}
            role="radio"
            aria-checked={active}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
