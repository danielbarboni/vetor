/**
 * RobotWizard — 4-step robot creation wizard at /robos/wizard.
 *
 * Steps: 1=ESTRATÉGIA, 2=MODO, 3=DADOS, 4=CONFIGURAR
 *
 * Fully ephemeral (D-13): no server calls until Step 4 "CRIAR ROBÔ →".
 * On finish: calls api.createRobot → navigates to /robos/{id}/parametros (WIZ-06).
 * On 409 conflict: shows inline name error without leaving Step 4.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { createRobot, ApiError } from '@/lib/api'
import type { Asset, RobotMode } from '@/types'
import { strategyCatalog } from '@/data/strategyCatalog'

import StepIndicator from '@/components/wizard/StepIndicator'
import StepStrategy from '@/components/wizard/StepStrategy'
import StepMode from '@/components/wizard/StepMode'
import StepAsset from '@/components/wizard/StepAsset'
import StepConfigure from '@/components/wizard/StepConfigure'

// Parse "R$ 5.000,00" → 5000 for submission
function parseCapital(value: string): number {
  const clean = value.replace(/[^\d,]/g, '').replace(',', '.')
  const parsed = parseFloat(clean)
  return isNaN(parsed) ? 5000 : parsed
}

export default function RobotWizard() {
  const navigate = useNavigate()

  // ─── Ephemeral wizard state (D-13) ───────────────────────────────────────────
  const [step, setStep] = useState(1)
  const [strategyId, setStrategyId] = useState<string | null>(null)
  const [mode, setMode] = useState<RobotMode | null>(null)
  const [asset, setAsset] = useState<Asset | null>(null)
  const [robotName, setRobotName] = useState('')
  const [simulationCapital, setSimulationCapital] = useState('R$ 5.000,00')
  const [nameError, setNameError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ─── Navigation helpers ───────────────────────────────────────────────────────
  const canAdvance = (): boolean => {
    if (step === 1) return strategyId !== null
    if (step === 2) return mode !== null
    if (step === 3) return asset !== null
    if (step === 4) return robotName.trim().length > 0
    return false
  }

  function goBack() {
    if (step > 1) setStep((s) => s - 1)
  }

  function goNext() {
    if (canAdvance() && step < 4) setStep((s) => s + 1)
  }

  // ─── Submit (Step 4 only) ─────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!canAdvance() || submitting) return
    setNameError(null)
    setSubmitting(true)

    try {
      const robot = await createRobot({
        name: robotName.trim(),
        strategy_type: 'indicadores_tecnicos',
        mode: mode!,
        asset: asset!,
        simulation_capital: mode === 'simulado' ? parseCapital(simulationCapital) : null,
        fill_policy: 'pessimista',
        status: 'rascunho',
      })
      navigate(`/robos/${robot.id}/parametros`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setNameError('Já existe um robô com este nome neste ambiente. Escolha um nome diferente.')
      } else {
        setNameError('Erro ao criar robô. Tente novamente.')
      }
      setSubmitting(false)
    }
  }

  // ─── Derived values ───────────────────────────────────────────────────────────
  const selectedStrategy = strategyCatalog.find((s) => s.id === strategyId) ?? null

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '28px 28px 80px',
        animation: 'fadeUp 0.25s ease',
      }}
    >
      {/* Breadcrumb */}
      <div
        style={{
          fontSize: '11.5px',
          color: 'var(--muted2)',
          fontFamily: 'var(--font-body)',
          marginBottom: '6px',
        }}
      >
        Robôs &rsaquo; Criando seu robô
      </div>

      {/* Title */}
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--text)',
          margin: 0,
        }}
      >
        Criando seu robô
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: '13px',
          fontWeight: 400,
          color: 'var(--muted)',
          marginTop: '3px',
          marginBottom: 0,
        }}
      >
        Quatro passos e seu robô estará pronto para configurar — sem escrever uma linha de código.
      </p>

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Step content */}
      {step === 1 && (
        <StepStrategy
          selected={strategyId}
          onSelect={(id) => setStrategyId(id)}
        />
      )}

      {step === 2 && (
        <StepMode
          selected={mode}
          onSelect={(m) => setMode(m)}
        />
      )}

      {step === 3 && (
        <StepAsset
          selected={asset}
          onSelect={(a) => setAsset(a)}
        />
      )}

      {step === 4 && (
        <StepConfigure
          name={robotName}
          onNameChange={(v) => {
            setRobotName(v)
            if (nameError) setNameError(null)
          }}
          nameError={nameError}
          mode={mode}
          strategyName={selectedStrategy?.name ?? 'Indicadores Técnicos [Tangram 3.0]'}
          onChangeStrategy={() => setStep(1)}
          simulationCapital={simulationCapital}
          onCapitalChange={setSimulationCapital}
        />
      )}

      {/* Navigation buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginTop: '28px',
        }}
      >
        {step > 1 && (
          <button
            onClick={goBack}
            disabled={submitting}
            style={{
              border: '1px solid var(--border2)',
              borderRadius: '12px',
              padding: '11px 20px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--muted)',
              background: 'transparent',
              cursor: submitting ? 'not-allowed' : 'pointer',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              opacity: submitting ? 0.45 : 1,
              fontFamily: 'var(--font-body)',
            }}
          >
            VOLTAR
          </button>
        )}

        {step < 4 ? (
          <button
            onClick={goNext}
            disabled={!canAdvance()}
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: canAdvance() ? 'pointer' : 'not-allowed',
              opacity: canAdvance() ? 1 : 0.45,
              pointerEvents: canAdvance() ? 'auto' : 'none',
              transition: 'all 0.15s',
              fontFamily: 'var(--font-body)',
            }}
          >
            AVANÇAR →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canAdvance() || submitting}
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: canAdvance() && !submitting ? 'pointer' : 'not-allowed',
              opacity: canAdvance() && !submitting ? 1 : 0.45,
              pointerEvents: canAdvance() && !submitting ? 'auto' : 'none',
              transition: 'all 0.15s',
              fontFamily: 'var(--font-body)',
            }}
          >
            {submitting ? 'Criando...' : 'CRIAR ROBÔ →'}
          </button>
        )}
      </div>
    </div>
  )
}
