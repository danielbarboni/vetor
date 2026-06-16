-- =============================================================================
-- 0001_init_schema.sql
-- Phase 1 — Vetor Trading Platform — Full Schema
-- All 11 tables for Phase 1 MVP.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 1. profiles — extends auth.users (one row per Supabase auth user)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  cpf_cnpj    TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. robots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS robots (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  strategy_type     TEXT        NOT NULL DEFAULT 'indicadores_tecnicos',
  mode              TEXT        NOT NULL CHECK (mode IN ('simulado', 'real')),
  status            TEXT        NOT NULL DEFAULT 'rascunho'
                                CHECK (status IN ('rascunho', 'parado', 'executando', 'arquivado')),
  asset             TEXT        NOT NULL CHECK (asset IN ('WIN%', 'WDO%', 'BIT%')),
  simulation_capital NUMERIC(12,2),          -- NULL for real mode
  fill_policy       TEXT        NOT NULL DEFAULT 'pessimista'
                                CHECK (fill_policy IN ('pessimista', 'moderado', 'otimista')),
  params            JSONB,                   -- full IT [Tangram 3.0] parameter schema
  params_saved_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE TRIGGER robots_updated_at
  BEFORE UPDATE ON robots
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. b3_contracts — B3 expiry calendar (shared reference data)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS b3_contracts (
  id             SERIAL      PRIMARY KEY,
  asset          TEXT        NOT NULL,           -- 'WIN%', 'WDO%', 'BIT%'
  symbol         TEXT        NOT NULL,           -- e.g. 'WINM26'
  expiry_date    DATE        NOT NULL,
  is_front_month BOOLEAN     NOT NULL DEFAULT false,
  rollover_date  DATE,                           -- date liquidity typically migrates
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 4. orders — live trading orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id),
  robot_id          UUID        NOT NULL REFERENCES robots(id),
  client_order_id   TEXT        UNIQUE,          -- deterministic: hash(user_id, robot_id, signal_ts)
  broker_order_id   TEXT,                        -- MetaAPI order ID
  effective_contract TEXT       NOT NULL,        -- e.g. 'WINM26'
  side              TEXT        NOT NULL CHECK (side IN ('buy', 'sell')),
  qty               INTEGER     NOT NULL,
  type              TEXT        NOT NULL CHECK (type IN ('market', 'limit', 'stop')),
  status            TEXT        NOT NULL
                    CHECK (status IN ('queued', 'sending', 'sent', 'confirmed', 'filled',
                                      'cancelled', 'rejected', 'expired')),
  order_class       TEXT        CHECK (order_class IN ('entry', 'exit')),
  entry_price       NUMERIC(12,5),
  fill_price        NUMERIC(12,5),
  fill_qty          INTEGER,
  result_pts        NUMERIC(10,2),               -- P&L in points
  result_brl        NUMERIC(12,2),               -- P&L in BRL
  trade_type        TEXT        CHECK (trade_type IN ('day_trade', 'swing_trade')),
  ordered_at        TIMESTAMPTZ NOT NULL,
  filled_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite indexes for RLS performance (PITFALL-12)
CREATE INDEX IF NOT EXISTS orders_user_created_idx  ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_robot_created_idx ON orders (robot_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 5. order_events — full event log per order (SUM-05)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type   TEXT        NOT NULL,     -- 'submitted', 'acknowledged', 'filled', 'cancelled', etc.
  event_data   JSONB,                    -- raw MetaAPI event payload
  occurred_at  TIMESTAMPTZ NOT NULL
);

-- ---------------------------------------------------------------------------
-- 6. equity_snapshots — equity curve data (appended per fill)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equity_snapshots (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id),
  robot_id     UUID        NOT NULL REFERENCES robots(id),
  equity       NUMERIC(14,2) NOT NULL,
  snapshot_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS equity_snapshots_robot_idx
  ON equity_snapshots (robot_id, snapshot_at DESC);

-- ---------------------------------------------------------------------------
-- 7. backtests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS backtests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id),
  robot_id        UUID        NOT NULL REFERENCES robots(id),
  status          TEXT        NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued', 'processing', 'completed', 'error')),
  fill_policy     TEXT        NOT NULL
                  CHECK (fill_policy IN ('pessimista', 'moderado', 'otimista')),
  capital         NUMERIC(12,2) NOT NULL,
  start_date      DATE        NOT NULL,
  end_date        DATE        NOT NULL,
  result_metrics  JSONB,                 -- computed metrics (net return, drawdown, etc.)
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- 8. backtest_orders — mirrors orders schema but tied to a backtest
--    Never mixed with live orders.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS backtest_orders (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id),
  backtest_id       UUID        NOT NULL REFERENCES backtests(id) ON DELETE CASCADE,
  client_order_id   TEXT        UNIQUE,
  effective_contract TEXT       NOT NULL,
  side              TEXT        NOT NULL CHECK (side IN ('buy', 'sell')),
  qty               INTEGER     NOT NULL,
  type              TEXT        NOT NULL CHECK (type IN ('market', 'limit', 'stop')),
  status            TEXT        NOT NULL
                    CHECK (status IN ('queued', 'sending', 'sent', 'confirmed', 'filled',
                                      'cancelled', 'rejected', 'expired')),
  order_class       TEXT        CHECK (order_class IN ('entry', 'exit')),
  entry_price       NUMERIC(12,5),
  fill_price        NUMERIC(12,5),
  fill_qty          INTEGER,
  result_pts        NUMERIC(10,2),
  result_brl        NUMERIC(12,2),
  trade_type        TEXT        CHECK (trade_type IN ('day_trade', 'swing_trade')),
  ordered_at        TIMESTAMPTZ NOT NULL,
  filled_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backtest_orders_user_idx
  ON backtest_orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS backtest_orders_backtest_idx
  ON backtest_orders (backtest_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 9. broker_connections
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS broker_connections (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id),
  broker                TEXT        NOT NULL DEFAULT 'btg_metaapi',
  metaapi_account_id    TEXT,               -- MetaAPI account ID (not raw MT5 creds)
  status                TEXT        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'provisioning', 'active', 'error', 'unlinked')),
  connected_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 10. user_preferences
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_fill_policy    TEXT        NOT NULL DEFAULT 'pessimista',
  decimal_separator_view TEXT        NOT NULL DEFAULT 'comma',
  decimal_separator_export TEXT      NOT NULL DEFAULT 'comma',
  currency               TEXT        NOT NULL DEFAULT 'BRL',
  notifications_email    BOOLEAN     NOT NULL DEFAULT true,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 11. user_credits — backtest credit balance (BCK-02)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_credits (
  user_id    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance    INTEGER     NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
