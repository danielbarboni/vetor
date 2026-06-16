/**
 * api.ts — Typed REST client for the Vetor backend.
 *
 * All requests attach `Authorization: Bearer <session.access_token>` read from
 * the auth store. Throws ApiError on non-2xx responses.
 *
 * Base URL read from VITE_API_BASE_URL env var.
 */

import { useAuthStore } from '@/stores/auth'
import type { Robot, RobotStatus } from '@/types'

// ─── Error type ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Robot metrics returned by the API (extends Robot) ───────────────────────

export interface RobotMetrics {
  net_return: number | null
  daily_balance: number | null
  sparkline_data: number[]
  total_trades: number | null
  profitable_pct: number | null
  profit_factor: number | null
  max_drawdown: number | null
  position: 'COMPRADO' | 'VENDIDO' | null // null = sem posição
}

export type RobotWithMetrics = Robot & RobotMetrics

// ─── Internal fetch helper ────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = useAuthStore.getState().session
  const token = session?.access_token

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json()
      message = body?.message ?? body?.error ?? message
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, message)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ─── Robots ──────────────────────────────────────────────────────────────────

export function getRobots(status?: RobotStatus): Promise<RobotWithMetrics[]> {
  const qs = status ? `?status=${status}` : ''
  return apiFetch<RobotWithMetrics[]>(`/robots${qs}`)
}

export function getRobot(id: string): Promise<RobotWithMetrics> {
  return apiFetch<RobotWithMetrics>(`/robots/${id}`)
}

export function createRobot(
  payload: Partial<Robot>,
): Promise<Robot> {
  return apiFetch<Robot>('/robots', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateRobot(id: string, payload: Partial<Robot>): Promise<Robot> {
  return apiFetch<Robot>(`/robots/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function archiveRobot(id: string): Promise<void> {
  return apiFetch<void>(`/robots/${id}/archive`, { method: 'POST' })
}

export function unarchiveRobot(id: string): Promise<void> {
  return apiFetch<void>(`/robots/${id}/unarchive`, { method: 'POST' })
}

export function duplicateRobot(id: string): Promise<Robot> {
  return apiFetch<Robot>(`/robots/${id}/duplicate`, { method: 'POST' })
}

export function deleteRobot(id: string): Promise<void> {
  return apiFetch<void>(`/robots/${id}`, { method: 'DELETE' })
}

// ─── Start / Stop (plan 01-10 endpoints — wired here so handlers work now) ───

export function startRobot(id: string): Promise<void> {
  return apiFetch<void>(`/robots/${id}/start`, { method: 'POST' })
}

export function stopRobot(id: string): Promise<void> {
  return apiFetch<void>(`/robots/${id}/stop`, { method: 'POST' })
}

// ─── Account / Minha Conta (CTR-01..04) ──────────────────────────────────────

export interface UserProfile {
  id: string
  full_name?: string | null
  phone?: string | null
  cpf_cnpj?: string | null
  avatar_url?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface UserPreferences {
  email_notifications_executions: boolean
  email_notifications_stops: boolean
  email_notifications_margin: boolean
  default_simulator_type: string
  decimal_separator: string
  thousands_separator: string
  currency_display: string
}

export interface BrokerConnection {
  id: string
  broker_name: string
  metaapi_account_id?: string | null
  status: string
  created_at?: string | null
}

export interface SessionEntry {
  session_id: string
  created_at: string
  device: string
  ip: string
  is_current: boolean
}

export interface UserCredits {
  balance: number
  updated_at?: string | null
}

export function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/account/profile')
}

export function updateProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
  return apiFetch<UserProfile>('/account/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function uploadAvatar(file: File): Promise<UserProfile> {
  // Avatar upload: POST the file as multipart, then PATCH profile with returned url.
  // For Phase 1, we skip the Supabase Storage step and send the data URL directly.
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      updateProfile({ avatar_url: reader.result as string }).then(resolve).catch(reject)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function getPreferences(): Promise<UserPreferences> {
  return apiFetch<UserPreferences>('/account/preferences')
}

export function updatePreferences(payload: Partial<UserPreferences>): Promise<UserPreferences> {
  return apiFetch<UserPreferences>('/account/preferences', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getBrokers(): Promise<BrokerConnection[]> {
  return apiFetch<BrokerConnection[]>('/account/brokers')
}

export function linkBroker(payload: {
  login: string
  password: string
  server: string
  broker_name?: string
}): Promise<{ metaapi_account_id: string; broker_name: string; status: string }> {
  return apiFetch('/account/brokers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function unlinkBroker(connectionId: string): Promise<{ id: string; status: string }> {
  return apiFetch(`/account/brokers/${connectionId}`, { method: 'DELETE' })
}

export function getSessions(): Promise<{ sessions: SessionEntry[] }> {
  return apiFetch<{ sessions: SessionEntry[] }>('/account/sessions')
}

export function revokeAllSessions(): Promise<{ message: string }> {
  return apiFetch('/account/sessions/revoke-all', { method: 'POST' })
}

export function getCredits(): Promise<UserCredits> {
  return apiFetch<UserCredits>('/account/credits')
}
