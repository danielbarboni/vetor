/**
 * UltimosAcessosTab.tsx — CTR-04: Login history (Minha Conta tab 4)
 *
 * Table: DATA/HORA | DISPOSITIVO/NAVEGADOR | IP | LOCALIZAÇÃO
 * Current session shows "SESSÃO ATUAL" accent badge.
 * IP and date displayed in JetBrains Mono per UI-SPEC.
 *
 * Data source: GET /account/sessions (from plan 04 auth router, reused here).
 */
import React, { useEffect, useState } from 'react'
import { getSessions } from '@/lib/api'
import type { SessionEntry } from '@/lib/api'

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

// ── component ─────────────────────────────────────────────────────────────────

const COL_WIDTHS = '160px 1.4fr 160px 1fr'

function TableHeader() {
  const thStyle: React.CSSProperties = {
    fontSize: '9.5px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--muted2)',
    fontFamily: 'Inter, sans-serif',
    padding: '10px 16px',
    textAlign: 'left' as const,
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: COL_WIDTHS, borderBottom: '1px solid var(--border)' }}>
      <div style={thStyle}>DATA / HORA</div>
      <div style={thStyle}>DISPOSITIVO / NAVEGADOR</div>
      <div style={thStyle}>IP</div>
      <div style={thStyle}>LOCALIZAÇÃO</div>
    </div>
  )
}

function TableRow({ entry, isLast }: { entry: SessionEntry; isLast: boolean }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: COL_WIDTHS,
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      padding: '0',
    }}>
      {/* DATA/HORA */}
      <div style={{
        padding: '12px 16px',
        fontSize: '11.5px',
        fontFamily: "'JetBrains Mono', monospace",
        color: 'var(--muted)',
        alignSelf: 'center',
      }}>
        {formatDate(entry.created_at)}
      </div>

      {/* DISPOSITIVO/NAVEGADOR */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{
          fontSize: '13px', fontWeight: 500, color: 'var(--text)',
          fontFamily: 'Inter, sans-serif',
        }}>
          {entry.device}
        </span>
        {entry.is_current && (
          <span style={{
            fontSize: '8.5px',
            fontWeight: 700,
            letterSpacing: '0.07em',
            padding: '3px 8px',
            borderRadius: '99px',
            background: 'var(--tint-accent)',
            color: 'var(--color-accent)',
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap',
          }}>
            SESSÃO ATUAL
          </span>
        )}
      </div>

      {/* IP */}
      <div style={{
        padding: '12px 16px',
        fontSize: '12px',
        fontFamily: "'JetBrains Mono', monospace",
        color: 'var(--text)',
        alignSelf: 'center',
      }}>
        {entry.ip}
      </div>

      {/* LOCALIZAÇÃO — placeholder in Phase 1 */}
      <div style={{
        padding: '12px 16px',
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
        color: 'var(--muted2)',
        alignSelf: 'center',
      }}>
        —
      </div>
    </div>
  )
}

export default function UltimosAcessosTab() {
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSessions()
      .then((res) => setSessions(res.sessions))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ marginTop: '18px' }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        <TableHeader />

        {loading ? (
          <div style={{
            padding: '22px 16px',
            color: 'var(--muted)',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
          }}>
            Carregando...
          </div>
        ) : sessions.length === 0 ? (
          <div style={{
            padding: '22px 16px',
            color: 'var(--muted2)',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
          }}>
            Nenhum acesso registrado.
          </div>
        ) : (
          sessions.map((s, i) => (
            <TableRow key={s.session_id} entry={s} isLast={i === sessions.length - 1} />
          ))
        )}
      </div>
    </div>
  )
}
