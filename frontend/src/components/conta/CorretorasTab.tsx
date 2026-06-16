/**
 * CorretorasTab.tsx — CTR-02: Broker linking / unlinking (Minha Conta tab 2)
 *
 * Shows CORRETORAS VINCULADAS list with ATIVA/EM BREVE badges.
 * ADICIONAR flow: inline form for MT5 login/password/server → calls linkBroker.
 * DESVINCULAR: destructive confirm modal.
 *
 * Security: raw MT5 password is sent to the backend which forwards it to MetaAPI only.
 * It is never stored in broker_connections (T-01). Status badge shows ATIVA or EM BREVE.
 */
import React, { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { getBrokers, linkBroker, unlinkBroker } from '@/lib/api'
import type { BrokerConnection } from '@/lib/api'

// ── helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isAtiva = status === 'active' || status === 'provisioning' || status === 'ativa'
  return (
    <span style={{
      fontSize: '9px',
      fontWeight: 700,
      letterSpacing: '0.07em',
      padding: '3px 9px',
      borderRadius: '99px',
      fontFamily: 'Inter, sans-serif',
      background: isAtiva ? 'var(--tint-accent)' : 'transparent',
      color: isAtiva ? 'var(--color-accent)' : 'var(--muted2)',
      border: isAtiva ? 'none' : '1px solid var(--border2)',
      whiteSpace: 'nowrap' as const,
    }}>
      {isAtiva ? 'ATIVA' : 'EM BREVE'}
    </span>
  )
}

// Static list of available broker integrations (Phase 1: BTG only active)
const AVAILABLE_BROKERS = [
  { name: 'BTG Pactual', server: 'BTGPactual-MT5-Demo', available: true },
  { name: 'XP Investimentos', server: '', available: false },
  { name: 'Clear Corretora', server: '', available: false },
]

// ── component ─────────────────────────────────────────────────────────────────

export default function CorretorasTab() {
  const [brokers, setBrokers] = useState<BrokerConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [unlinkTarget, setUnlinkTarget] = useState<BrokerConnection | null>(null)

  // Link form state
  const [linkForm, setLinkForm] = useState({ login: '', password: '', server: 'BTGPactual-MT5-Demo', broker_name: 'BTG Pactual' })
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  useEffect(() => {
    getBrokers()
      .then(setBrokers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleLink() {
    if (!linkForm.login || !linkForm.password) return
    setLinking(true)
    setLinkError(null)
    try {
      await linkBroker(linkForm)
      const updated = await getBrokers()
      setBrokers(updated)
      setShowAdd(false)
      setLinkForm({ login: '', password: '', server: 'BTGPactual-MT5-Demo', broker_name: 'BTG Pactual' })
    } catch (err: unknown) {
      setLinkError(err instanceof Error ? err.message : 'Erro ao vincular corretora.')
    } finally {
      setLinking(false)
    }
  }

  async function handleUnlink() {
    if (!unlinkTarget) return
    try {
      await unlinkBroker(unlinkTarget.id)
      setBrokers((bs) => bs.filter((b) => b.id !== unlinkTarget.id))
    } catch {
      /* ignore */
    } finally {
      setUnlinkTarget(null)
    }
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '10px 13px',
    color: 'var(--text)',
    fontSize: '13px',
    width: '100%',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ marginTop: '18px' }}>

      {/* ── CORRETORAS VINCULADAS ──────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '22px',
        marginBottom: '14px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <div style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
            color: 'var(--muted2)', fontFamily: 'Inter, sans-serif',
          }}>
            CORRETORAS VINCULADAS
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '10.5px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            ADICIONAR
          </button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
            Carregando...
          </div>
        ) : brokers.filter((b) => b.status !== 'unlinked').length === 0 ? (
          <div style={{ color: 'var(--muted2)', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
            Nenhuma corretora vinculada.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {brokers
              .filter((b) => b.status !== 'unlinked')
              .map((b, i, arr) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: '13px', fontWeight: 500, color: 'var(--text)',
                      fontFamily: 'Inter, sans-serif',
                    }}>
                      {b.broker_name}
                    </div>
                    {b.metaapi_account_id && (
                      <div style={{
                        fontSize: '11px', color: 'var(--muted2)', marginTop: '2px',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {b.metaapi_account_id}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <StatusBadge status={b.status} />
                    <button
                      onClick={() => setUnlinkTarget(b)}
                      style={{
                        background: 'transparent', border: 'none',
                        fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em',
                        color: 'var(--color-loss)', cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif', padding: 0,
                      }}
                    >
                      DESVINCULAR
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ── CORRETORAS INTEGRADAS DISPONÍVEIS ─────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '22px',
      }}>
        <div style={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
          color: 'var(--muted2)', fontFamily: 'Inter, sans-serif', marginBottom: '16px',
        }}>
          CORRETORAS INTEGRADAS DISPONÍVEIS
        </div>
        {AVAILABLE_BROKERS.map((b, i) => (
          <div
            key={b.name}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 0',
              borderBottom: i < AVAILABLE_BROKERS.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{
              fontSize: '13px', fontWeight: 500, color: 'var(--text)',
              fontFamily: 'Inter, sans-serif',
            }}>
              {b.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {!b.available && <StatusBadge status="em breve" />}
              {b.available && (
                <button
                  onClick={() => { setLinkForm((f) => ({ ...f, server: b.server, broker_name: b.name })); setShowAdd(true) }}
                  style={{
                    border: '1px solid var(--border2)', borderRadius: '10px',
                    padding: '6px 12px', fontSize: '10.5px', fontWeight: 700,
                    letterSpacing: '0.06em', color: 'var(--muted)',
                    background: 'transparent', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  VINCULAR
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Link broker modal ──────────────────────────────────────────────── */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setLinkError(null) }}>
        <div style={{ padding: '28px' }}>
          <div style={{
            fontSize: '16px', fontWeight: 700, fontFamily: "'Sora', sans-serif",
            color: 'var(--text)', marginBottom: '18px',
          }}>
            Vincular corretora
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label style={{
                fontSize: '11.5px', fontWeight: 600, color: 'var(--text)',
                display: 'block', marginBottom: '5px', fontFamily: 'Inter, sans-serif',
              }}>
                Login MT5
              </label>
              <input
                style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                value={linkForm.login}
                onChange={(e) => setLinkForm((f) => ({ ...f, login: e.target.value }))}
                placeholder="12345678"
                autoComplete="off"
              />
            </div>
            <div>
              <label style={{
                fontSize: '11.5px', fontWeight: 600, color: 'var(--text)',
                display: 'block', marginBottom: '5px', fontFamily: 'Inter, sans-serif',
              }}>
                Senha MT5
              </label>
              <input
                type="password"
                style={inputStyle}
                value={linkForm.password}
                onChange={(e) => setLinkForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Senha da conta MT5"
                autoComplete="new-password"
              />
            </div>
          </div>

          {linkError && (
            <div style={{
              color: 'var(--color-loss)', fontSize: '12px',
              fontFamily: 'Inter, sans-serif', marginBottom: '14px',
            }}>
              {linkError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setShowAdd(false); setLinkError(null) }}
              style={{
                border: '1px solid var(--border2)', borderRadius: '10px',
                padding: '9px 18px', fontSize: '12px', fontWeight: 700,
                color: 'var(--muted)', background: 'transparent', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleLink}
              disabled={linking || !linkForm.login || !linkForm.password}
              style={{
                background: 'var(--color-primary)', color: 'var(--color-on-primary)',
                borderRadius: '10px', border: 'none',
                padding: '9px 18px', fontSize: '12px', fontWeight: 700,
                cursor: linking ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                opacity: (linking || !linkForm.login || !linkForm.password) ? 0.55 : 1,
              }}
            >
              {linking ? 'Vinculando...' : 'VINCULAR'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Desvincular confirm modal ──────────────────────────────────────── */}
      <Modal open={!!unlinkTarget} onClose={() => setUnlinkTarget(null)}>
        <div style={{ padding: '28px' }}>
          <div style={{
            fontSize: '16px', fontWeight: 700, fontFamily: "'Sora', sans-serif",
            color: 'var(--text)', marginBottom: '10px',
          }}>
            Desvincular corretora?
          </div>
          <div style={{
            fontSize: '13px', color: 'var(--muted)', lineHeight: 1.55,
            fontFamily: 'Inter, sans-serif', marginBottom: '24px',
          }}>
            Robôs no Modo Real serão pausados se a corretora for desvinculada.
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setUnlinkTarget(null)}
              style={{
                border: '1px solid var(--border2)', borderRadius: '10px',
                padding: '9px 18px', fontSize: '12px', fontWeight: 700,
                color: 'var(--muted)', background: 'transparent', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleUnlink}
              style={{
                background: 'var(--color-loss)', color: '#FFFFFF',
                borderRadius: '10px', border: 'none',
                padding: '9px 18px', fontSize: '12px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              Desvincular
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
