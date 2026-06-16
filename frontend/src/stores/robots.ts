/**
 * robots.ts — Zustand store for robot listing UI filter state.
 *
 * Robot data itself is fetched via TanStack Query in the page.
 * This store holds only the persistent UI state: active tab, filters, view mode.
 */

import { create } from 'zustand'
import type { RobotStatus } from '@/types'

export type RobotTab = 'executando' | 'parados' | 'arquivados'
export type ViewMode = 'grid' | 'list'

// Map tab names to API status values (PARADOS tab includes rascunho + parado)
export const TAB_STATUSES: Record<RobotTab, RobotStatus[]> = {
  executando: ['executando'],
  parados: ['parado', 'rascunho'],
  arquivados: ['arquivado'],
}

interface RobotsFilterState {
  activeTab: RobotTab
  /** Selected strategy names (empty = all strategies) */
  strategyFilter: string[]
  /** Show only robots with an open position */
  posicionadosOnly: boolean
  viewMode: ViewMode
  searchQuery: string
}

interface RobotsFilterActions {
  setActiveTab: (tab: RobotTab) => void
  setStrategyFilter: (strategies: string[]) => void
  togglePosicionados: () => void
  setViewMode: (mode: ViewMode) => void
  setSearchQuery: (q: string) => void
  resetFilters: () => void
}

const DEFAULT_STATE: RobotsFilterState = {
  activeTab: 'executando',
  strategyFilter: [],
  posicionadosOnly: false,
  viewMode: 'grid',
  searchQuery: '',
}

export const useRobotsStore = create<RobotsFilterState & RobotsFilterActions>((set) => ({
  ...DEFAULT_STATE,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setStrategyFilter: (strategies) => set({ strategyFilter: strategies }),
  togglePosicionados: () => set((s) => ({ posicionadosOnly: !s.posicionadosOnly })),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  resetFilters: () =>
    set({
      strategyFilter: [],
      posicionadosOnly: false,
      searchQuery: '',
    }),
}))
