import React from 'react'
import type { BadgeStatus } from '../../types'

export interface BadgeProps {
  status: BadgeStatus
  label?: string
  style?: React.CSSProperties
}

/**
 * Status Badge — maps status to UI-SPEC Status Badge Color Map.
 * All colors use CSS aliases / token references — no hex values.
 */

interface BadgeColorConfig {
  background: string
  color: string
  border?: string
}

const STATUS_MAP: Record<BadgeStatus, BadgeColorConfig & { defaultLabel: string }> = {
  executando: {
    background: 'var(--tint-profit)',
    color: 'var(--color-profit)',
    defaultLabel: 'EXECUTANDO',
  },
  parado: {
    background: 'var(--surface3)',
    color: 'var(--muted)',
    defaultLabel: 'PARADO',
  },
  arquivado: {
    background: 'var(--surface2)',
    color: 'var(--muted2)',
    defaultLabel: 'ARQUIVADO',
  },
  pessimista: {
    background: 'var(--surface3)',
    color: 'var(--muted)',
    defaultLabel: 'PESSIMISTA',
  },
  moderado: {
    background: 'var(--tint-info)',
    color: 'var(--color-info)',
    defaultLabel: 'MODERADO',
  },
  otimista: {
    background: 'var(--tint-amber)',
    color: 'var(--color-amber)',
    defaultLabel: 'OTIMISTA',
  },
  assinada: {
    background: 'var(--tint-primary)',
    color: 'var(--color-primary)',
    defaultLabel: 'ASSINADA',
  },
  em_breve: {
    background: 'var(--surface3)',
    color: 'var(--muted2)',
    border: 'var(--border2)',
    defaultLabel: 'EM BREVE',
  },
  ativa: {
    background: 'var(--tint-accent)',
    color: 'var(--color-accent)',
    defaultLabel: 'ATIVA',
  },
  sessao_atual: {
    background: 'var(--tint-accent)',
    color: 'var(--color-accent)',
    defaultLabel: 'SESSÃO ATUAL',
  },
  recomendado: {
    background: 'var(--tint-primary)',
    color: 'var(--color-primary)',
    defaultLabel: 'RECOMENDADO',
  },
}

export default function Badge({ status, label, style }: BadgeProps) {
  const config = STATUS_MAP[status]
  const displayLabel = label ?? config.defaultLabel

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '99px',
        padding: '3px 8px',
        fontSize: '8.5px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        background: config.background,
        color: config.color,
        border: config.border ? `1px solid ${config.border}` : undefined,
        ...style,
      }}
    >
      {displayLabel}
    </span>
  )
}
