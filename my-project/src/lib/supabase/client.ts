import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use non-null assertion or fallback since env vars are required
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
