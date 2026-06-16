-- =============================================================================
-- 0003_realtime_publication.sql
-- Phase 1 — Vetor Trading Platform — Supabase Realtime Publication
--
-- Adds robots, orders, and backtests to the supabase_realtime publication so
-- that postgres_changes events are fanned out to subscribed browser clients.
--
-- D-02: Robot state changes and persisted order events flow via Supabase
--        Realtime (PostgreSQL → WebSocket). Two-channel model:
--          FastAPI WS  = ephemeral high-frequency tick data
--          Supabase RT = persisted low-frequency state changes
--
-- RLS continues to enforce per-user isolation on the Postgres side;
-- the Realtime layer honours RLS filtering automatically.
-- =============================================================================

-- Supabase creates the `supabase_realtime` publication by default.
-- We add our tables; running this again is idempotent because Postgres
-- silently ignores ADD TABLE if the table is already a member.

ALTER PUBLICATION supabase_realtime ADD TABLE robots;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE backtests;
