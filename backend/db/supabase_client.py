"""
Single Supabase client (server-side service role).

Import `supabase` from this module wherever DB access is needed.
The client is created once at startup using the service role key,
which bypasses RLS — use only in trusted server-side code.
"""
from __future__ import annotations

from supabase import Client, create_client

from config import settings

# Singleton: one client per FastAPI process.
# Service role key grants full DB access — never expose to the browser.
supabase: Client = create_client(
    settings.SUPABASE_URL or "https://placeholder.supabase.co",
    settings.SUPABASE_SERVICE_KEY or "placeholder-service-key",
)
