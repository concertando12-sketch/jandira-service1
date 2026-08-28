"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { supabaseAnonKey, supabaseUrl } from "./env";

// Cliente do lado do navegador. Usa placeholders quando as env vars
// ainda não existem, só para o app conseguir renderizar sem crashar —
// qualquer chamada real vai falhar até as credenciais serem definidas.
export function createClient() {
  return createBrowserClient<Database>(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder-anon-key",
  );
}
