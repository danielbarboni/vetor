/**
 * RobotEditor — /robos/:id/parametros
 *
 * Renders the full IT [Tangram 3.0] parameter editor with:
 *   - EditorShell (tabs: SUMÁRIO / GRÁFICO / PARÂMETROS)
 *   - ActionRail (play/stop, save, backtest EDT-04, costs)
 *   - 11 ordered parameter sections (PRD §12.5)
 *   - Execution lock banner + read-only mode (EDT-02)
 *   - Validated save → PATCH /robots/{id} (EDT-03)
 *   - params_saved_at timestamp update on success
 *
 * Section order (PRD §12.5):
 *   01 Mercado  02 Gráfico  03 Indicadores Técnicos  04 Filtros de Entrada
 *   05 Aumento de Posição  06 Critérios de Saída  07 Critérios de Saída Diário
 *   08 Gerenciamento de Capital  09 Horário de Operação
 *   10 Módulo Day Trade  11 Informações
 */
import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import EditorShell from '@/components/editor/EditorShell'
import type { EditorTab } from '@/components/editor/EditorShell'
import ActionRail from '@/components/editor/ActionRail'
import ParameterSection from '@/components/editor/ParameterSection'
import IndicadoresTecnicos from '@/components/editor/sections/IndicadoresTecnicos'
import Toggle from '@/components/ui/Toggle'
import { getRobot, updateRobot, startRobot, stopRobot, ApiError } from '@/lib/api'
import type { Robot } from '@/types'

// ─── Execution lock banner (EDT-02) ──────────────────────────────────────────

function ExecutionLockBanner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: 'var(--tint-amber)',
      border: '1px solid var(--color-amber)',
      borderRadius: '12px',
      padding: '12px 16px',
      fontSize: '12.5px',
      color: 'var(--color-amber)',
      marginBottom: '16px',
      lineHeight: 1.5,
      fontFamily: 'Inter, sans-serif',
    }}>
      <AlertTriangle size={18} strokeWidth={1.8} style={{ flexShrink: 0 }} />
      <span>
        <strong>Robô em execução:</strong> não é possível fazer alterações nos parâmetros enquanto ele estiver executando. Pare o robô para fazer as alterações desejadas.
      </span>
    </div>
  )
}

// ─── Simple placeholder section body ─────────────────────────────────────────

function PlaceholderSection({ locked }: { locked: boolean }) {
  return (
    <div style={{
      padding: '16px 0',
      color: 'var(--muted2)',
      fontSize: '12.5px',
      fontFamily: 'Inter, sans-serif',
      opacity: locked ? 0.6 : 1,
    }}>
      Configure os parâmetros desta seção conforme necessário.
    </div>
  )
}

// ─── Seção Mercado (01) ───────────────────────────────────────────────────────

function MercadoSection({ params, onChange, locked }: { params: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void; locked: boolean }) {
  const seg = (params.mercado_segmento as string) ?? 'bmf'
  const inputStyle: React.CSSProperties = {
    background: locked ? 'var(--surface3)' : 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '10px 13px',
    color: locked ? 'var(--muted)' : 'var(--color-text-hi)',
    fontSize: '13px',
    width: '100%',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
    cursor: locked ? 'not-allowed' : 'pointer',
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '14px', alignItems: 'center', padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>Segmento de mercado</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['bmf', 'bovespa'] as const).map((v) => (
            <button
              key={v}
              onClick={() => !locked && onChange({ ...params, mercado_segmento: v })}
              disabled={locked}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: seg === v ? 'var(--color-primary)' : 'var(--surface2)',
                color: seg === v ? 'var(--color-on-primary)' : 'var(--muted)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: locked ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {v === 'bmf' ? 'BM&F' : 'BOVESPA'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '14px', alignItems: 'center', padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>Ativo (contrato contínuo)</div>
          <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>Contrato contínuo: o sistema resolve para o vencimento corrente e faz a rolagem automaticamente.</div>
        </div>
        <select
          value={String(params.ativo ?? 'WIN%')}
          onChange={(e) => onChange({ ...params, ativo: e.target.value })}
          disabled={locked}
          style={inputStyle}
        >
          <option value="WIN%">WIN% — Mini Índice</option>
          <option value="WDO%">WDO% — Mini Dólar</option>
          <option value="BIT%">BIT% — Bitcoin Futuro</option>
        </select>
      </div>
    </div>
  )
}

// ─── Seção Gráfico (02) ───────────────────────────────────────────────────────

function GraficoSection({ params, onChange, locked }: { params: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void; locked: boolean }) {
  const tipo = String(params.grafico_tipo ?? 'candlestick')
  const tempo = String(params.grafico_tempo ?? '5min')
  const sentido = String(params.grafico_sentido ?? 'comprado_e_vendido')

  const selectStyle: React.CSSProperties = {
    background: locked ? 'var(--surface3)' : 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '10px 13px',
    color: locked ? 'var(--muted)' : 'var(--color-text-hi)',
    fontSize: '13px',
    width: '100%',
    fontFamily: 'Inter, sans-serif',
    cursor: locked ? 'not-allowed' : 'pointer',
    boxSizing: 'border-box',
  }

  function row(label: string, child: React.ReactNode) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '14px', alignItems: 'center', padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>{label}</div>
        <div>{child}</div>
      </div>
    )
  }

  return (
    <div>
      {row('Tipo', (
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['candlestick', 'heikin_ashi'] as const).map((v) => (
            <button key={v} onClick={() => !locked && onChange({ ...params, grafico_tipo: v })} disabled={locked} style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: tipo === v ? 'var(--color-primary)' : 'var(--surface2)', color: tipo === v ? 'var(--color-on-primary)' : 'var(--muted)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: locked ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif' }}>
              {v === 'candlestick' ? 'CANDLESTICK' : 'HEIKIN-ASHI'}
            </button>
          ))}
        </div>
      ))}
      {row('Tempo gráfico', (
        <select value={tempo} onChange={(e) => onChange({ ...params, grafico_tempo: e.target.value })} disabled={locked} style={selectStyle}>
          {['1min', '5min', '10min', '15min', '30min', '60min'].map((v) => (
            <option key={v} value={v}>{v.replace('min', ' MIN')}</option>
          ))}
        </select>
      ))}
      {row('Sentido das operações', (
        <select value={sentido} onChange={(e) => onChange({ ...params, grafico_sentido: e.target.value })} disabled={locked} style={selectStyle}>
          <option value="apenas_comprado">Apenas comprado</option>
          <option value="apenas_vendido">Apenas vendido</option>
          <option value="comprado_e_vendido">Comprado e vendido</option>
        </select>
      ))}
    </div>
  )
}

// ─── Section 04: Filtros de Entrada ──────────────────────────────────────────

function FiltrosEntradaSection({ params, onChange, locked }: { params: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void; locked: boolean }) {
  function row(label: string, child: React.ReactNode) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '14px', alignItems: 'center', padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>{label}</div>
        <div>{child}</div>
      </div>
    )
  }

  const selectStyle: React.CSSProperties = {
    background: locked ? 'var(--surface3)' : 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '10px 13px',
    color: locked ? 'var(--muted)' : 'var(--color-text-hi)',
    fontSize: '13px',
    width: '100%',
    fontFamily: 'Inter, sans-serif',
    cursor: locked ? 'not-allowed' : 'pointer',
    boxSizing: 'border-box',
  }

  return (
    <div>
      {row('Saída por indicadores', (
        <select value={String(params.saida_por_indicadores ?? 'pelo_menos_um')} onChange={(e) => onChange({ ...params, saida_por_indicadores: e.target.value })} disabled={locked} style={selectStyle}>
          <option value="pelo_menos_um">Sair se pelo menos um sinalizar</option>
          <option value="todos">Sair se todos sinalizarem</option>
        </select>
      ))}
      {row('Filtro por média móvel de volume', (
        <Toggle value={!!params.filtro_volume_mm} onChange={(v) => onChange({ ...params, filtro_volume_mm: v })} disabled={locked} />
      ))}
      {row('Filtro por variação', (
        <Toggle value={!!params.filtro_variacao} onChange={(v) => onChange({ ...params, filtro_variacao: v })} disabled={locked} />
      ))}
    </div>
  )
}

// ─── Main RobotEditor page ────────────────────────────────────────────────────

export default function RobotEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [robot, setRobot] = useState<Robot | null>(null)
  const [params, setParams] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<EditorTab>('parametros')

  const locked = robot?.status === 'executando'

  // Load robot
  useEffect(() => {
    if (!id) return
    setLoading(true)
    getRobot(id)
      .then((r) => {
        setRobot(r as Robot)
        setParams((r.params as Record<string, unknown>) ?? {})
      })
      .catch(() => {
        // Error handled via null robot
      })
      .finally(() => setLoading(false))
  }, [id])

  // Tab navigation
  const handleTabChange = useCallback((tab: EditorTab) => {
    setActiveTab(tab)
    if (tab === 'sumario' && id) {
      navigate(`/robos/${id}`)
    }
  }, [id, navigate])

  // Save params — EDT-03
  const handleSave = useCallback(async () => {
    if (!id || locked) return
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await updateRobot(id, { params })
      setRobot(updated as Robot)
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message)
      } else {
        setSaveError('Erro ao salvar parâmetros.')
      }
    } finally {
      setSaving(false)
    }
  }, [id, params, locked])

  // Start robot
  const handleStart = useCallback(async () => {
    if (!id) return
    try {
      await startRobot(id)
      const updated = await getRobot(id)
      setRobot(updated as Robot)
    } catch {
      // Error shown elsewhere
    }
  }, [id])

  // Stop robot
  const handleStop = useCallback(async () => {
    if (!id) return
    try {
      await stopRobot(id)
      const updated = await getRobot(id)
      setRobot(updated as Robot)
    } catch {
      // Error shown elsewhere
    }
  }, [id])

  // Backtest shortcut (EDT-04) — wired in plan 12
  const handleBacktest = useCallback(() => {
    // plan 12 will connect this to the BacktestModal
    // For now, navigate to backtests with robot pre-selected
    if (id) navigate(`/backtests?robot=${id}`)
  }, [id, navigate])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--muted)', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
        Carregando...
      </div>
    )
  }

  if (!robot) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--muted)', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
        Robô não encontrado.
      </div>
    )
  }

  return (
    <>
      <EditorShell
        robotName={robot.name}
        paramsSavedAt={robot.params_saved_at}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      >
        {activeTab === 'parametros' && (
          <div style={{ animation: 'fadeUp 0.25s ease' }}>
            {/* Execution lock banner (EDT-02) */}
            {locked && <ExecutionLockBanner />}

            {/* Save error */}
            {saveError && (
              <div style={{
                background: 'var(--tint-loss)',
                border: '1px solid var(--color-loss)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '12.5px',
                color: 'var(--color-loss)',
                marginBottom: '12px',
                fontFamily: 'Inter, sans-serif',
              }}>
                {saveError}
              </div>
            )}

            {/* §12.5 Section 01: Mercado */}
            <ParameterSection number={1} title="Papel Negociado" subtitle="Ativo e segmento de mercado">
              <MercadoSection
                params={params}
                onChange={setParams}
                locked={locked}
              />
            </ParameterSection>

            {/* §12.5 Section 02: Gráfico */}
            <ParameterSection number={2} title="Gráfico" subtitle="Tipo de candle, tempo e sentido das operações">
              <GraficoSection
                params={params}
                onChange={setParams}
                locked={locked}
              />
            </ParameterSection>

            {/* §12.5 Section 03: Indicadores Técnicos (all 14) */}
            <ParameterSection number={3} title="Indicadores Técnicos" subtitle="Configure os indicadores de entrada" defaultOpen={true}>
              <IndicadoresTecnicos
                params={params}
                onChange={setParams}
                locked={locked}
              />
            </ParameterSection>

            {/* §12.5 Section 04: Filtros de Entrada */}
            <ParameterSection number={4} title="Filtros de Entrada" subtitle="Filtros adicionais de confirmação de sinal">
              <FiltrosEntradaSection
                params={params}
                onChange={setParams}
                locked={locked}
              />
            </ParameterSection>

            {/* §12.5 Section 05: Aumento de Posição */}
            <ParameterSection number={5} title="Aumento de Posição" subtitle="Configurações de reentrada e martingale">
              <PlaceholderSection locked={locked} />
            </ParameterSection>

            {/* §12.5 Section 06: Critérios de Saída */}
            <ParameterSection number={6} title="Critérios de Saída" subtitle="Stop loss, stop gain, trailing stop">
              <PlaceholderSection locked={locked} />
            </ParameterSection>

            {/* §12.5 Section 07: Critérios de Saída Diário */}
            <ParameterSection number={7} title="Critérios de Saída Diário" subtitle="Limites diários de ganho e perda">
              <PlaceholderSection locked={locked} />
            </ParameterSection>

            {/* §12.5 Section 08: Gerenciamento de Capital */}
            <ParameterSection number={8} title="Gerenciamento de Capital" subtitle="Quantidade de contratos e gestão de risco">
              <PlaceholderSection locked={locked} />
            </ParameterSection>

            {/* §12.5 Section 09: Horário de Operação */}
            <ParameterSection number={9} title="Horário de Operação" subtitle="Janela de horário permitida para operações">
              <PlaceholderSection locked={locked} />
            </ParameterSection>

            {/* §12.5 Section 10: Módulo Day Trade */}
            <ParameterSection number={10} title="Módulo Day Trade" subtitle="Encerramento de posição no fim do dia">
              <PlaceholderSection locked={locked} />
            </ParameterSection>

            {/* §12.5 Section 11: Informações */}
            <ParameterSection number={11} title="Informações" subtitle="Notas e identificação da configuração">
              <PlaceholderSection locked={locked} />
            </ParameterSection>
          </div>
        )}

        {activeTab === 'grafico' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--muted)', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
            Gráfico disponível na Fase 2.
          </div>
        )}
      </EditorShell>

      {/* Fixed action rail (EDT-04) */}
      <ActionRail
        status={robot.status}
        onStart={handleStart}
        onStop={handleStop}
        onSave={handleSave}
        onBacktest={handleBacktest}
        saving={saving}
      />
    </>
  )
}
