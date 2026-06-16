/**
 * ParameterSection — accordion section for the editor parameter panel.
 *
 * UI-SPEC:
 *   Container: background:--surface; border:1px solid --border; border-radius:14px;
 *              margin-bottom:10px; overflow:hidden
 *   Header: display:flex; align-items:center; gap:12px; padding:14px 18px; cursor:pointer
 *   Number badge: 26×26px; border-radius:8px; background:--surface3;
 *                 JBMono 10.5px w700 --muted
 *   Title: Inter 14px w600; subtitle: Inter 11.5px --muted2; margin-top:1px
 *   Body: padding:2px 18px 18px; border-top:1px solid --border
 */
import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface ParameterSectionProps {
  number: number
  title: string
  subtitle?: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export default function ParameterSection({
  number,
  title,
  subtitle,
  children,
  defaultOpen = false,
}: ParameterSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      marginBottom: '10px',
      overflow: 'hidden',
    }}>
      {/* Section header */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Number badge */}
        <div style={{
          width: '26px',
          height: '26px',
          borderRadius: '8px',
          background: 'var(--surface3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10.5px',
          fontWeight: 700,
          color: 'var(--muted)',
          flexShrink: 0,
        }}>
          {String(number).padStart(2, '0')}
        </div>

        {/* Title + subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text)',
            fontFamily: 'Inter, sans-serif',
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontSize: '11.5px',
              color: 'var(--muted2)',
              marginTop: '1px',
              fontFamily: 'Inter, sans-serif',
            }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Chevron */}
        <ChevronDown
          size={16}
          strokeWidth={1.8}
          style={{
            color: 'var(--muted2)',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </div>

      {/* Section body */}
      {open && (
        <div style={{
          padding: '2px 18px 18px',
          borderTop: '1px solid var(--border)',
        }}>
          {children}
        </div>
      )}
    </div>
  )
}
