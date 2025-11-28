import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Singleton instance - cached at module level to prevent multiple GoTrueClient instances
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  // Return cached instance if it exists, otherwise create and cache new instance
  if (!clientInstance) {
    clientInstance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return clientInstance;
}
