import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client (service role).
 *
 * Every request is sent with `cache: 'no-store'`: Next.js on Vercel otherwise caches
 * supabase-js GET requests in its Data Cache, so admin stats, visitor lists and
 * settings kept showing OLD numbers on the live site.
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: 'no-store' }),
      },
    },
  );
}
