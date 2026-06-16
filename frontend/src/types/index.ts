/**
 * Shared TypeScript types — contracts for the Vetor trading platform.
 * Derived from RESEARCH.md Data Model and PRD.
 * All later plans implement against these interfaces.
 */

// ============================================================
// Core domain types
// ============================================================

export type RobotMode = 'simulado' | 'real'
export type RobotStatus = 'rascunho' | 'parado' | 'executando' | 'arquivado'
export type Asset = 'WIN%' | 'WDO%' | 'BIT%'
export type FillPolicy = 'pessimista' | 'moderado' | 'otimista'
export type StrategyType = 'indicadores_tecnicos'

export interface Robot {
  id: string
  user_id: string
  name: string
  strategy_type: StrategyType
  mode: RobotMode
  status: RobotStatus
  asset: Asset
  simulation_capital: number | null // null for real mode
  fill_policy: FillPolicy
  params: Record<string, unknown> | null // full IT [Tangram 3.0] parameter schema
  params_saved_at: string | null // ISO timestamp
  created_at: string
  updated_at: string
}

// ============================================================
// Orders
// ============================================================

export type OrderSide = 'buy' | 'sell'
export type OrderType = 'market' | 'limit' | 'stop'
export type OrderStatus =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'confirmed'
  | 'filled'
  | 'cancelled'
  | 'rejected'
  | 'expired'
export type OrderClass = 'entry' | 'exit'
export type TradeType = 'day_trade' | 'swing_trade'

export interface Order {
  id: string
  user_id: string
  robot_id: string
  client_order_id: string | null
  broker_order_id: string | null
  effective_contract: string // e.g. 'WINF26'
  side: OrderSide
  qty: number
  type: OrderType
  status: OrderStatus
  order_class: OrderClass | null
  entry_price: number | null
  fill_price: number | null
  fill_qty: number | null
  result_pts: number | null // P&L in points
  result_brl: number | null // P&L in BRL
  trade_type: TradeType | null
  ordered_at: string // ISO timestamp
  filled_at: string | null
  created_at: string
}

export interface OrderEvent {
  id: string
  order_id: string
  event_type: string // 'submitted' | 'acknowledged' | 'filled' | 'cancelled' | etc.
  event_data: Record<string, unknown> // raw MetaAPI event payload
  occurred_at: string
}

// ============================================================
// Equity
// ============================================================

export interface EquitySnapshot {
  id: string
  user_id: string
  robot_id: string
  equity: number
  snapshot_at: string
}

// ============================================================
// Backtests
// ============================================================

export type BacktestStatus = 'queued' | 'processing' | 'completed' | 'error'

export interface Backtest {
  id: string
  user_id: string
  robot_id: string
  status: BacktestStatus
  fill_policy: FillPolicy
  capital: number
  start_date: string // ISO date string
  end_date: string
  result_metrics: BacktestMetrics | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface BacktestMetrics {
  net_return: number
  net_return_pct: number
  max_drawdown: number
  total_trades: number
  profitable_trades: number
  profit_factor: number
  daily_balance: number
}

// ============================================================
// Broker connections
// ============================================================

export type BrokerConnectionStatus =
  | 'pending'
  | 'provisioning'
  | 'active'
  | 'error'
  | 'unlinked'

export interface BrokerConnection {
  id: string
  user_id: string
  broker: string // e.g. 'btg_metaapi'
  metaapi_account_id: string | null
  status: BrokerConnectionStatus
  connected_at: string | null
  created_at: string
}

// ============================================================
// User data
// ============================================================

export interface UserPreferences {
  user_id: string
  default_fill_policy: FillPolicy
  decimal_separator_view: 'comma' | 'period'
  decimal_separator_export: 'comma' | 'period'
  currency: string
  notifications_email: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  cpf_cnpj: string | null
  avatar_url: string | null
  created_at: string
}

// ============================================================
// Tick data (ephemeral — never persisted)
// ============================================================

export interface Tick {
  robot_id: string
  symbol: string // e.g. 'WINF26'
  price: number
  change: number // absolute change
  change_pct: number
  timestamp: string
}

// ============================================================
// UI helpers
// ============================================================

/** Status badge variants mapped to UI-SPEC Status Badge Color Map */
export type BadgeStatus =
  | 'executando'
  | 'parado'
  | 'arquivado'
  | 'pessimista'
  | 'moderado'
  | 'otimista'
  | 'assinada'
  | 'em_breve'
  | 'ativa'
  | 'sessao_atual'
  | 'recomendado'
