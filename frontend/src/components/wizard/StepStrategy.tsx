/**
 * StepStrategy — Wizard Step 1: Strategy catalog (WIZ-01, WIZ-02).
 *
 * - Search input "Buscar estratégia…"
 * - Grid of strategy cards (.wc / .wc-on)
 * - selectable=true  → "+" select button, SAIBA MAIS link
 * - selectable=false → "EM BREVE" badge + disabled "+" (.dis) + SAIBA MAIS link
 * - SaibaMaisModal opens on SAIBA MAIS click
 */

import { useState } from 'react'
import { strategyCatalog, type StrategyEntry } from '@/data/strategyCatalog'
import SaibaMaisModal from './SaibaMaisModal'

interface StepStrategyProps {
  selected: string | null
  onSelect: (id: string) => void
}

export default function StepStrategy({ selected, onSelect }: StepStrategyProps) {
  const [search, setSearch] = useState('')
  const [saibaMais, setSaibaMais] = useState<StrategyEntry | null>(null)

  const filtered = strategyCatalog.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        placeholder="Buscar estratégia…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '9px 12px',
          width: '300px',
          marginBottom: '16px',
          color: 'var(--text)',
          fontSize: '13px',
          fontFamily: 'var(--font-body)',
          outline: 'none',
        }}
      />

      {/* Strategy grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '14px',
        }}
      >
        {filtered.map((strategy) => {
          const isSelected = selected === strategy.id
          const isDisabled = !strategy.selectable

          return (
            <div
              key={strategy.id}
              style={{
                border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--border)'}`,
                background: isSelected ? 'var(--tint-primary)' : 'var(--surface)',
                borderRadius: '16px',
                padding: '18px',
                cursor: isDisabled ? 'default' : 'pointer',
                opacity: isDisabled ? 0.45 : 1,
                pointerEvents: isDisabled ? 'none' : 'auto',
                transition: 'all 0.15s',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {/* Card top row: author + EM BREVE badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.07em',
                    color: 'var(--muted2)',
                    textTransform: 'uppercase',
                  }}
                >
                  {strategy.author}
                </span>
                {isDisabled && (
                  <span
                    style={{
                      fontSize: '8.5px',
                      fontWeight: 700,
                      letterSpacing: '0.09em',
                      background: 'var(--surface3)',
                      color: 'var(--muted2)',
                      border: '1px solid var(--border2)',
                      borderRadius: '99px',
                      padding: '4px 10px',
                      textTransform: 'uppercase',
                      pointerEvents: 'none',
                    }}
                  >
                    EM BREVE
                  </span>
                )}
              </div>

              {/* Strategy name */}
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  lineHeight: 1.3,
                }}
              >
                {strategy.name}
              </div>

              {/* Description */}
              <div
                style={{
                  fontSize: '12.5px',
                  fontWeight: 400,
                  color: 'var(--muted)',
                  lineHeight: 1.5,
                  flex: 1,
                }}
              >
                {strategy.description}
              </div>

              {/* Card bottom row: SAIBA MAIS + select button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '4px',
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSaibaMais(strategy)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.09em',
                    color: 'var(--color-primary)',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    pointerEvents: isDisabled ? 'none' : 'auto',
                  }}
                >
                  SAIBA MAIS
                </button>

                {/* "+" select button */}
                <button
                  onClick={() => onSelect(strategy.id)}
                  disabled={isDisabled}
                  aria-label={`Selecionar ${strategy.name}`}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '99px',
                    border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--border2)'}`,
                    background: isSelected ? 'var(--color-primary)' : 'transparent',
                    color: isSelected ? 'var(--color-on-primary)' : 'var(--color-primary)',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    fontWeight: 700,
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  {isSelected ? '✓' : '+'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Saiba Mais modal */}
      {saibaMais && (
        <SaibaMaisModal strategy={saibaMais} onClose={() => setSaibaMais(null)} />
      )}
    </div>
  )
}
