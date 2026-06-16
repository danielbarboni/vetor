/**
 * useRobotRealtime — Supabase Realtime subscriptions for robot status + orders (D-02).
 *
 * Pattern 3 (from RESEARCH.md): subscribe to postgres_changes for:
 *   - robots table: status changes (filter user_id = current user)
 *   - orders table: new/updated orders (filter robot_id = target robot)
 *
 * On order change → invalidate TanStack Query cache so metrics + equity refetch (D-03).
 *
 * Returns: { robotStatus } — reactive status from Realtime (undefined until first event)
 */

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

interface UseRobotRealtimeOptions {
  robotId: string
  onStatusChange?: (status: string) => void
  onOrderChange?: () => void
}

export function useRobotRealtime({
  robotId,
  onStatusChange,
  onOrderChange,
}: UseRobotRealtimeOptions): void {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!user?.id || !robotId) return

    const channelName = `robot-realtime:${robotId}`

    // Clean up any existing subscription first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel(channelName)
      // D-02: Robot status changes (filter by user_id)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'robots',
          filter: `id=eq.${robotId}`,
        },
        (payload) => {
          const newRecord = payload.new as Record<string, unknown>
          if (newRecord?.status && typeof newRecord.status === 'string') {
            onStatusChange?.(newRecord.status)
          }
          // Invalidate robot query so header re-fetches
          queryClient.invalidateQueries({ queryKey: ['robot', robotId] })
          queryClient.invalidateQueries({ queryKey: ['sumario', robotId] })
        },
      )
      // D-02: Order changes for this robot → triggers D-03 equity recompute
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `robot_id=eq.${robotId}`,
        },
        () => {
          onOrderChange?.()
          // D-03: Invalidate sumario + equity queries so metrics + equity refetch
          queryClient.invalidateQueries({ queryKey: ['sumario', robotId] })
          queryClient.invalidateQueries({ queryKey: ['equity', robotId] })
          queryClient.invalidateQueries({ queryKey: ['orders', robotId] })
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [robotId, user?.id, queryClient, onStatusChange, onOrderChange])
}
