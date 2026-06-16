/**
 * ticks.ts — Zustand store for live tick data from the FastAPI WS (D-01/D-04).
 *
 * Ticks are keyed by robot_id. Each tick carries price, change, and timestamp.
 * Updated by useTickStream when a WS message is demultiplexed.
 */

import { create } from 'zustand'

export interface Tick {
  robot_id: string
  price: number
  change: number
  timestamp: number
}

interface TickState {
  ticks: Record<string, Tick>
  setTick: (tick: Tick) => void
  clearTicks: () => void
}

export const useTickStore = create<TickState>((set) => ({
  ticks: {},

  setTick: (tick: Tick) =>
    set((state) => ({
      ticks: { ...state.ticks, [tick.robot_id]: tick },
    })),

  clearTicks: () => set({ ticks: {} }),
}))
