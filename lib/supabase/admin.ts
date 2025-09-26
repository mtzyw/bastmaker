import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { Database } from "./types";

let cachedClient: SupabaseClient<Database> | undefined;

export function getServiceRoleClient() {
  if (!cachedClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new Error("Missing Supabase service role credentials");
    }

    cachedClient = createClient<Database>(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedClient;
}
