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
