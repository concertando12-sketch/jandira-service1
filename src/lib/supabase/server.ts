import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./types";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";
import { createMockSupabaseClient } from "./mock-client";

// Cliente para Server Components / Server Actions / Route Handlers.
// Lê e escreve a sessão via cookies do Next.js.
export async function createClient(): Promise<SupabaseClient<Database>> {
  if (!isSupabaseConfigured) {
    // Sem projeto conectado ainda: devolve o mock (nunca bate na rede)
    // pra dar pra abrir as telas no modo prévia (src/app/preview).
    return createMockSupabaseClient() as SupabaseClient<Database>;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Chamado a partir de um Server Component (sem permissão de
          // escrever cookie) — o middleware já cuida do refresh de
          // sessão nesses casos, então é seguro ignorar aqui.
        }
      },
    },
  });
}
