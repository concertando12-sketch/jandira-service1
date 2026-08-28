import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";
import { supabaseAnonKey, supabaseUrl } from "./env";

// Cliente para Server Components / Server Actions / Route Handlers.
// Lê e escreve a sessão via cookies do Next.js.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder-anon-key",
    {
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
    },
  );
}
