/**
 * ContextMenu — ⋮ dropdown for robot cards (ROB-05).
 *
 * Action set varies by robot state:
 *   executando → Ver Sumário, Pausar/Parar, Criar backtest, Duplicar
 *   parado     → Ver Sumário, Editar parâmetros, Iniciar, Arquivar, Excluir, Criar backtest, Duplicar
 *   arquivado  → Desarquivar, Excluir
 *
 * Destructive confirms (Arquivar / Excluir) are handled by the parent via callbacks
 * so the Modal can be rendered at the page level and properly unmounted.
 */

import { useEffect, useRef } from 'react'
import type { RobotStatus } from '@/types'

interface ContextMenuProps {
  robotId: string
  status: RobotStatus
  open: boolean
  onClose: () => void
  onVerSumario: () => void
  onEditarParametros: () => void
  onIniciar: () => void
  onParar: () => void
  onArquivar: () => void
  onDesarquivar: () => void
  onExcluir: () => void
  onCriarBacktest: () => void
  onDuplicar: () => void
}

interface MenuItem {
  label: string
  onClick: () => void
  destructive?: boolean
  separator?: boolean
}

export default function ContextMenu({
  status,
  open,
  onClose,
  onVerSumario,
  onEditarParametros,
  onIniciar,
  onParar,
  onArquivar,
  onDesarquivar,
  onExcluir,
  onCriarBacktest,
  onDuplicar,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, onClose])

  if (!open) return null

  let items: MenuItem[] = []

  if (status === 'executando') {
    items = [
      { label: 'Ver Sumário', onClick: onVerSumario },
      { label: 'Criar backtest', onClick: onCriarBacktest },
      { label: 'Duplicar', onClick: onDuplicar },
      { label: 'Pausar/Parar', onClick: onParar, destructive: true, separator: true },
    ]
  } else if (status === 'parado' || status === 'rascunho') {
    items = [
      { label: 'Ver Sumário', onClick: onVerSumario },
      { label: 'Editar parâmetros', onClick: onEditarParametros },
      { label: 'Iniciar', onClick: onIniciar },
      { label: 'Criar backtest', onClick: onCriarBacktest },
      { label: 'Duplicar', onClick: onDuplicar },
      { label: 'Arquivar', onClick: onArquivar, destructive: true, separator: true },
      { label: 'Excluir', onClick: onExcluir, destructive: true },
    ]
  } else if (status === 'arquivado') {
    items = [
      { label: 'Desarquivar', onClick: onDesarquivar },
      { label: 'Excluir', onClick: onExcluir, destructive: true, separator: true },
    ]
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: '28px',
        right: '0',
        zIndex: 50,
        background: 'var(--surface)',
        border: '1px solid var(--border2)',
        borderRadius: '12px',
        padding: '6px',
        minWidth: '180px',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation()
            item.onClick()
            onClose()
          }}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            background: 'none',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12.5px',
            fontWeight: 500,
            cursor: 'pointer',
            color: item.destructive ? 'var(--color-loss)' : 'var(--text)',
            marginTop: item.separator ? '4px' : undefined,
            borderTop: item.separator ? '1px solid var(--border)' : undefined,
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
