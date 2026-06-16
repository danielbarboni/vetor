-- =============================================================================
-- 0002_rls_policies.sql
-- Phase 1 — Vetor Trading Platform — Row Level Security Policies
--
-- Pattern: ENABLE RLS + SELECT/INSERT/UPDATE/DELETE policies using
--   USING (user_id = auth.uid())
-- on every user-scoped table.
--
-- T-01-01 mitigation: prevents user A from reading user B's data.
-- T-01-06 mitigation: b3_contracts is SELECT-only for authenticated users.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles — keyed on id = auth.uid()
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_owner_select" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_owner_insert" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_owner_update" ON profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_owner_delete" ON profiles
  FOR DELETE USING (id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. robots
-- ---------------------------------------------------------------------------
ALTER TABLE robots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "robots_owner_select" ON robots
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "robots_owner_insert" ON robots
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "robots_owner_update" ON robots
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "robots_owner_delete" ON robots
  FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. b3_contracts — shared reference data, SELECT-only for authenticated users
--    No client insert/update (T-01-06).
-- ---------------------------------------------------------------------------
ALTER TABLE b3_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "b3_contracts_authenticated_select" ON b3_contracts
  FOR SELECT USING (auth.role() = 'authenticated');

-- INSERT/UPDATE/DELETE only via service role (backend migrations/seed).

-- ---------------------------------------------------------------------------
-- 4. orders
-- ---------------------------------------------------------------------------
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_owner_select" ON orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "orders_owner_insert" ON orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_owner_update" ON orders
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_owner_delete" ON orders
  FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. order_events — access via parent orders membership
--    A user may read/write events for orders they own.
-- ---------------------------------------------------------------------------
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_events_owner_select" ON order_events
  FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

CREATE POLICY "order_events_owner_insert" ON order_events
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- UPDATE/DELETE not needed from clients; service role handles it.

-- ---------------------------------------------------------------------------
-- 6. equity_snapshots
-- ---------------------------------------------------------------------------
ALTER TABLE equity_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "equity_snapshots_owner_select" ON equity_snapshots
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "equity_snapshots_owner_insert" ON equity_snapshots
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE/DELETE not needed from clients.

-- ---------------------------------------------------------------------------
-- 7. backtests
-- ---------------------------------------------------------------------------
ALTER TABLE backtests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backtests_owner_select" ON backtests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "backtests_owner_insert" ON backtests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "backtests_owner_update" ON backtests
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "backtests_owner_delete" ON backtests
  FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 8. backtest_orders
-- ---------------------------------------------------------------------------
ALTER TABLE backtest_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backtest_orders_owner_select" ON backtest_orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "backtest_orders_owner_insert" ON backtest_orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE/DELETE managed by backend service role only.

-- ---------------------------------------------------------------------------
-- 9. broker_connections
-- ---------------------------------------------------------------------------
ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broker_connections_owner_select" ON broker_connections
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "broker_connections_owner_insert" ON broker_connections
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "broker_connections_owner_update" ON broker_connections
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "broker_connections_owner_delete" ON broker_connections
  FOR DELETE USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 10. user_preferences — keyed on user_id = auth.uid()
-- ---------------------------------------------------------------------------
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_preferences_owner_select" ON user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_preferences_owner_insert" ON user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_preferences_owner_update" ON user_preferences
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 11. user_credits — keyed on user_id = auth.uid()
-- ---------------------------------------------------------------------------
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_credits_owner_select" ON user_credits
  FOR SELECT USING (user_id = auth.uid());

-- INSERT/UPDATE only via service role (backend awards credits).
