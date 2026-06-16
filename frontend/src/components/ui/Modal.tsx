import React, { useEffect } from 'react'

export type ModalWidth = 'standard' | 'large'

export interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  width?: ModalWidth
  style?: React.CSSProperties
}

/**
 * Modal overlay — renders children only when open=true.
 *
 * Backdrop: rgba(0,0,0,0.6)
 * Container: background --surface, border-radius 16–20px, box-shadow --shadow-modal
 * Standard width: 480px | Large: 640px
 * Animation: scale 0.96→1.0 + opacity 0→1 over 250ms --ease-out
 * Closes on backdrop click or Escape key.
 */
export default function Modal({
  open,
  onClose,
  children,
  width = 'standard',
  style,
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const widthPx = width === 'large' ? '640px' : '480px'

  return (
    <div
      data-testid="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        padding: '24px',
      }}
      onClick={(e) => {
        // Close only when clicking the backdrop itself
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          background: 'var(--surface)',
          borderRadius: width === 'large' ? '20px' : '16px',
          boxShadow: 'var(--shadow-modal)',
          width: '100%',
          maxWidth: widthPx,
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          animation: 'modalIn 250ms cubic-bezier(0.16, 1, 0.3, 1) both',
          ...style,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
