/**
 * StepAsset — Wizard Step 3: Asset selection (WIZ-04, D-12).
 *
 * - Market segment label "BM&F"
 * - Asset chips: WIN% / WDO% / BIT%
 * - Single-select; selected chip gets .lwc-on styling (border --color-primary + 3px ring --tint-primary)
 */

import type { Asset } from '@/types'

interface StepAssetProps {
  selected: Asset | null
  onSelect: (asset: Asset) => void
}

const ASSETS: Asset[] = ['WIN%', 'WDO%', 'BIT%']

const ASSET_LABELS: Record<Asset, string> = {
  'WIN%': 'WIN%',
  'WDO%': 'WDO%',
  'BIT%': 'BIT%',
}

const ASSET_DESCRIPTIONS: Record<Asset, string> = {
  'WIN%': 'Mini Índice Bovespa',
  'WDO%': 'Mini Dólar Comercial',
  'BIT%': 'Bitcoin Futuro',
}

export default function StepAsset({ selected, onSelect }: StepAssetProps) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '560px',
      }}
    >
      {/* Market segment label */}
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.09em',
          color: 'var(--muted2)',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}
      >
        BM&amp;F
      </div>

      {/* Asset chips */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {ASSETS.map((asset) => {
          const isSelected = selected === asset

          return (
            <button
              key={asset}
              onClick={() => onSelect(asset)}
              style={{
                border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--border)'}`,
                background: 'var(--surface)',
                borderRadius: '16px',
                padding: '14px 22px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                boxShadow: isSelected
                  ? '0 0 0 3px var(--tint-primary)'
                  : 'none',
                minWidth: '100px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: isSelected ? 'var(--color-primary)' : 'var(--text)',
                }}
              >
                {ASSET_LABELS[asset]}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 400,
                  color: 'var(--muted)',
                }}
              >
                {ASSET_DESCRIPTIONS[asset]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
