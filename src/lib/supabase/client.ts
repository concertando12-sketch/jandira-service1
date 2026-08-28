"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";
import { createMockSupabaseClient } from "./mock-client";

// Cliente do lado do navegador. Sem credenciais ainda, devolve o mock
// (nunca bate na rede) — dá pra clicar em qualquer tela sem crashar.
export function createClient(): SupabaseClient<Database> {
  if (!isSupabaseConfigured) {
    return createMockSupabaseClient() as SupabaseClient<Database>;
  }
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
