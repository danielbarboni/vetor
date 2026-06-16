/**
 * RobotFilters — strategy multi-select, Posicionados toggle, grid/list, name search (ROB-06).
 *
 * Binds to the robots Zustand store for shared filter state.
 * Ported from prototype filter row (lines 177-187).
 */

import { useRobotsStore } from '@/stores/robots'

const STRATEGY_OPTIONS = [
  'Indicadores Técnicos',
  'Médias Móveis',
  'Bandas de Bollinger',
  'HiLo Activator',
  'Price Action',
  'RenkoBot Start',
]

export default function RobotFilters() {
  const {
    strategyFilter,
    posicionadosOnly,
    viewMode,
    searchQuery,
    setStrategyFilter,
    togglePosicionados,
    setViewMode,
    setSearchQuery,
  } = useRobotsStore()

  // Simple single-select that maps to the multi-select array for now
  // (multi-select UI to be added in a future iteration if needed)
  const selectedStrategy = strategyFilter[0] ?? ''

  function handleStrategyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    setStrategyFilter(val ? [val] : [])
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {/* Search input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '8px 12px',
          width: '220px',
          color: 'var(--muted2)',
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="M20 20l-4.4-4.4" />
        </svg>
        <input
          type="text"
          placeholder="Buscar robô…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontSize: '12.5px',
            width: '100%',
          }}
        />
      </div>

      {/* Strategy select */}
      <select
        value={selectedStrategy}
        onChange={handleStrategyChange}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '8px 12px',
          color: selectedStrategy ? 'var(--text)' : 'var(--muted)',
          fontSize: '12.5px',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <option value="">Todas as estratégias</option>
        {STRATEGY_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Posicionados toggle */}
      <div
        onClick={togglePosicionados}
        style={{
          padding: '8px 14px',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all .15s',
          background: posicionadosOnly ? 'var(--tint-primary)' : 'var(--surface)',
          color: posicionadosOnly ? 'var(--color-primary)' : 'var(--muted)',
          border: `1px solid ${posicionadosOnly ? 'var(--color-primary)' : 'var(--border)'}`,
          userSelect: 'none',
        }}
      >
        Posicionados
      </div>

      {/* Grid / List view toggle */}
      <div
        style={{
          display: 'flex',
          gap: '2px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '4px',
        }}
      >
        {/* Grid icon */}
        <button
          onClick={() => setViewMode('grid')}
          title="Visualização em grade"
          style={{
            background: viewMode === 'grid' ? 'var(--color-primary)' : 'transparent',
            border: 'none',
            borderRadius: '7px',
            padding: '6px 8px',
            cursor: 'pointer',
            color: viewMode === 'grid' ? 'var(--color-on-primary)' : 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            transition: 'all .15s',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>

        {/* List icon */}
        <button
          onClick={() => setViewMode('list')}
          title="Visualização em lista"
          style={{
            background: viewMode === 'list' ? 'var(--color-primary)' : 'transparent',
            border: 'none',
            borderRadius: '7px',
            padding: '6px 8px',
            cursor: 'pointer',
            color: viewMode === 'list' ? 'var(--color-on-primary)' : 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            transition: 'all .15s',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
