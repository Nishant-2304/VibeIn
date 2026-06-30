/**
 * Supabase barrel
 *
 * Server- and client-side helpers for Supabase Auth live under
 * `./supabase/server` and `./supabase/client`. This module re-exports the
 * server helper so existing call sites that imported `supabase` from
 * `@/lib/supabase` continue to work without modification.
 */

export { createClient } from "./supabase/server";
