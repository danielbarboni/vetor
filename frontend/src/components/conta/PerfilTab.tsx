/**
 * PerfilTab.tsx — CTR-01: Personal data + security (Minha Conta tab 1)
 *
 * Layout: two-column grid (1.4fr 1fr)
 * Left: DADOS PESSOAIS card — avatar, full name, email (disabled), phone, CPF/CNPJ, SALVAR
 * Right: SEGURANÇA card — change password link, MFA (disabled placeholder), ENCERRAR SESSÕES
 *
 * Copy: exact PT-BR from UI-SPEC § Minha Conta
 */
import React, { useEffect, useRef, useState } from 'react'
import Toggle from '@/components/ui/Toggle'
import Modal from '@/components/ui/Modal'
import { getProfile, updateProfile, uploadAvatar, revokeAllSessions } from '@/lib/api'
import type { UserProfile } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

// ── helpers ───────────────────────────────────────────────────────────────────

function initials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

// ── component ─────────────────────────────────────────────────────────────────

export default function PerfilTab() {
  const session = useAuthStore((s) => s.session)
  const signOut = useAuthStore((s) => s.signOut)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [form, setForm] = useState({ full_name: '', phone: '', cpf_cnpj: '' })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [showEncerrar, setShowEncerrar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getProfile()
      .then((p) => {
        setProfile(p)
        setForm({
          full_name: p.full_name ?? '',
          phone: p.phone ?? '',
          cpf_cnpj: p.cpf_cnpj ?? '',
        })
      })
      .catch(() => {})
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    try {
      const updated = await updateProfile(form)
      setProfile(updated)
      setSaveMsg('Dados salvos com sucesso.')
    } catch {
      setSaveMsg('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const updated = await uploadAvatar(file)
      setProfile(updated)
    } catch {
      /* ignore upload error in Phase 1 */
    }
  }

  async function handleEncerrar() {
    await revokeAllSessions().catch(() => {})
    setShowEncerrar(false)
    signOut()
  }

  const email = session?.user?.email ?? ''
  const avatarUrl = profile?.avatar_url

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

  const disabledInputStyle: React.CSSProperties = {
    ...inputStyle,
    background: 'var(--surface3)',
    color: 'var(--muted)',
    cursor: 'not-allowed',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11.5px',
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: '5px',
    display: 'block',
    fontFamily: 'Inter, sans-serif',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px', marginTop: '18px' }}>

      {/* ── DADOS PESSOAIS card ───────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '22px',
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: 'var(--muted2)',
          fontFamily: 'Inter, sans-serif',
          marginBottom: '18px',
        }}>
          DADOS PESSOAIS
        </div>

        {/* Avatar row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              style={{ width: '54px', height: '54px', borderRadius: '99px', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '54px', height: '54px', borderRadius: '99px',
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', fontWeight: 700, color: 'var(--color-on-primary)',
              fontFamily: 'Inter, sans-serif', flexShrink: 0,
            }}>
              {initials(profile?.full_name ?? email)}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              border: '1px solid var(--border2)',
              borderRadius: '10px',
              padding: '7px 13px',
              fontSize: '10.5px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--muted)',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            ALTERAR FOTO
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>

        {/* Form grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* Nome completo — spans full row */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Nome completo</label>
            <input
              style={inputStyle}
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              placeholder="Nome completo"
            />
          </div>

          {/* E-mail — disabled (Supabase-managed) */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>E-mail (verificado)</label>
            <input style={disabledInputStyle} value={email} disabled />
          </div>

          {/* Telefone */}
          <div>
            <label style={labelStyle}>Telefone</label>
            <input
              style={inputStyle}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+55 (11) 99999-0000"
            />
          </div>

          {/* CPF/CNPJ */}
          <div>
            <label style={labelStyle}>CPF/CNPJ</label>
            <input
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
              value={form.cpf_cnpj}
              onChange={(e) => setForm((f) => ({ ...f, cpf_cnpj: e.target.value }))}
              placeholder="000.000.000-00"
            />
          </div>
        </div>

        {/* Save row */}
        <div style={{ marginTop: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              borderRadius: '10px',
              padding: '9px 20px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              opacity: saving ? 0.65 : 1,
            }}
          >
            SALVAR
          </button>
          {saveMsg && (
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
              {saveMsg}
            </span>
          )}
        </div>
      </div>

      {/* ── SEGURANÇA card ────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '22px',
        height: 'fit-content',
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: 'var(--muted2)',
          fontFamily: 'Inter, sans-serif',
          marginBottom: '4px',
        }}>
          SEGURANÇA
        </div>

        {/* Change password */}
        <div style={{
          padding: '12px 0',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontSize: '13px', fontWeight: 500, color: 'var(--text)',
              fontFamily: 'Inter, sans-serif',
            }}>
              Alterar senha
            </div>
            <div style={{
              fontSize: '11px', color: 'var(--muted2)', marginTop: '2px',
              fontFamily: 'Inter, sans-serif',
            }}>
              Última alteração há alguns meses
            </div>
          </div>
          <a
            href="/auth/forgot"
            style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em',
              color: 'var(--color-primary)', textDecoration: 'none',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            ALTERAR
          </a>
        </div>

        {/* MFA — disabled placeholder (Phase 2) */}
        <div style={{
          padding: '12px 0',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontSize: '13px', fontWeight: 500, color: 'var(--text)',
              fontFamily: 'Inter, sans-serif',
            }}>
              Autenticação em 2 fatores (TOTP)
            </div>
            <div style={{
              fontSize: '11px', color: 'var(--muted2)', marginTop: '2px',
              fontFamily: 'Inter, sans-serif',
            }}>
              Obrigatória para habilitar o Modo Real
            </div>
          </div>
          {/* MFA toggle DISABLED — Phase 2 */}
          <Toggle value={false} onChange={() => {}} disabled />
        </div>

        {/* Encerrar sessões */}
        <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            fontSize: '13px', fontWeight: 500, color: 'var(--text)',
            fontFamily: 'Inter, sans-serif',
          }}>
            Sair de todos os dispositivos
          </div>
          <button
            onClick={() => setShowEncerrar(true)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.07em',
              color: 'var(--color-loss)',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              padding: 0,
            }}
          >
            ENCERRAR SESSÕES
          </button>
        </div>
      </div>

      {/* ── Encerrar sessões modal ─────────────────────────────────────────── */}
      <Modal open={showEncerrar} onClose={() => setShowEncerrar(false)}>
        <div style={{ padding: '28px' }}>
          <div style={{
            fontSize: '16px', fontWeight: 700, color: 'var(--text)',
            fontFamily: "'Sora', sans-serif", marginBottom: '10px',
          }}>
            Encerrar sessões?
          </div>
          <div style={{
            fontSize: '13px', color: 'var(--muted)', lineHeight: 1.55,
            fontFamily: 'Inter, sans-serif', marginBottom: '24px',
          }}>
            Você será desconectado de todos os dispositivos, incluindo o atual.
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowEncerrar(false)}
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
              onClick={handleEncerrar}
              style={{
                background: 'var(--color-loss)', color: '#FFFFFF',
                borderRadius: '10px', border: 'none',
                padding: '9px 18px', fontSize: '12px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              Encerrar sessões
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
