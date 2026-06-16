/**
 * useTickStream — ONE shared FastAPI WebSocket connection per user (D-01/D-04).
 *
 * Design decisions:
 * - A single WS connection is opened at /ws/{user_id}?token=<jwt> and shared
 *   across all robot views in the session. The server demultiplexes by robot_id.
 * - Reconnects with exponential backoff (1s → 2s → 4s → max 30s).
 * - Inbound message envelope: { robot_id: string, price: number, change: number, timestamp: number }
 * - On each tick, useTickStore.setTick(tick) is called.
 *
 * Usage: call once at the app root or within the authenticated AppShell.
 */

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useTickStore } from '@/stores/ticks'

const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? ''
const MAX_BACKOFF_MS = 30_000

// Module-level singleton so multiple hook invocations share one socket.
let _ws: WebSocket | null = null
let _userId: string | null = null
let _refCount = 0
let _backoffMs = 1_000
let _reconnectTimer: ReturnType<typeof setTimeout> | null = null

function _buildUrl(userId: string, token: string): string {
  const base = WS_BASE || (typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
    : '')
  return `${base}/ws/${userId}?token=${encodeURIComponent(token)}`
}

function _connect(userId: string, token: string): void {
  if (_ws && (_ws.readyState === WebSocket.CONNECTING || _ws.readyState === WebSocket.OPEN)) {
    return // Already connected
  }

  const url = _buildUrl(userId, token)
  const ws = new WebSocket(url)
  _ws = ws

  ws.onopen = () => {
    _backoffMs = 1_000 // Reset backoff on successful connect
  }

  ws.onmessage = (event) => {
    try {
      const tick = JSON.parse(event.data as string)
      // Validate envelope: must have robot_id and price
      if (tick && typeof tick.robot_id === 'string' && typeof tick.price === 'number') {
        useTickStore.getState().setTick({
          robot_id: tick.robot_id,
          price: tick.price,
          change: typeof tick.change === 'number' ? tick.change : 0,
          timestamp: typeof tick.timestamp === 'number' ? tick.timestamp : Date.now(),
        })
      }
    } catch {
      // Ignore malformed messages
    }
  }

  ws.onerror = () => {
    // Error always precedes close; let onclose handle reconnect
  }

  ws.onclose = (event) => {
    _ws = null
    if (event.code === 4001) {
      // Auth failure — do not reconnect
      return
    }
    // Reconnect with backoff if there are still active consumers
    if (_refCount > 0 && _userId === userId) {
      _reconnectTimer = setTimeout(() => {
        const session = useAuthStore.getState().session
        if (session?.access_token && _userId === userId) {
          _connect(userId, session.access_token)
        }
        _backoffMs = Math.min(_backoffMs * 2, MAX_BACKOFF_MS)
      }, _backoffMs)
    }
  }
}

function _disconnect(): void {
  if (_reconnectTimer) {
    clearTimeout(_reconnectTimer)
    _reconnectTimer = null
  }
  if (_ws) {
    _ws.onclose = null // Prevent reconnect on intentional close
    _ws.close()
    _ws = null
  }
  _userId = null
}

export function useTickStream(): void {
  const session = useAuthStore((s) => s.session)
  const hasSession = useRef(false)

  useEffect(() => {
    const userId = session?.user?.id
    const token = session?.access_token

    if (!userId || !token) return

    _refCount++

    // If different user, disconnect previous
    if (_userId && _userId !== userId) {
      _disconnect()
    }

    _userId = userId
    hasSession.current = true
    _connect(userId, token)

    return () => {
      _refCount--
      if (_refCount <= 0) {
        _disconnect()
        hasSession.current = false
      }
    }
  }, [session])
}
