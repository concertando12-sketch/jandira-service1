import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";
import { PREVIEW_ROLE_COOKIE, type UserRole } from "../constants";

const ROLE_HOME: Record<UserRole, string> = {
  CLIENT: "/cliente/dashboard",
  PROVIDER: "/prestador/dashboard",
  ADMIN: "/admin/dashboard",
};

const PROTECTED_PREFIXES: { prefix: string; role: UserRole }[] = [
  { prefix: "/cliente", role: "CLIENT" },
  { prefix: "/prestador", role: "PROVIDER" },
  { prefix: "/admin", role: "ADMIN" },
];

// /admin/login é a entrada — não pode exigir já estar logado como
// admin, senão ninguém nunca chegaria nela (item 1 da Fase 6).
const PUBLIC_EXCEPTIONS = ["/admin/login"];

// Roda em toda navegação (src/middleware.ts). Garante duas coisas:
//  1. a sessão do Supabase é renovada (SSR precisa disso);
//  2. rotas de /cliente, /prestador e /admin só respondem para quem
//     tem o role certo — a validação de verdade continua no RLS do
//     banco, mas isso evita expor telas erradas no navegador.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const isPublicException = PUBLIC_EXCEPTIONS.some((path) => request.nextUrl.pathname === path);
  const isProtected =
    !isPublicException &&
    PROTECTED_PREFIXES.some(({ prefix }) => request.nextUrl.pathname.startsWith(prefix));

  if (!isSupabaseConfigured) {
    // Sem credenciais ainda: deixa navegar livremente pelas telas
    // públicas/estruturais. Rotas protegidas só respondem se tiver o
    // cookie do modo prévia (escolhido em /preview) batendo com o role
    // da área — senão manda escolher lá. Isso tudo some sozinho assim
    // que .env.local tiver as chaves reais.
    if (isProtected) {
      const match = PROTECTED_PREFIXES.find(({ prefix }) =>
        request.nextUrl.pathname.startsWith(prefix),
      );
      const previewRole = request.cookies.get(PREVIEW_ROLE_COOKIE)?.value as UserRole | undefined;

      if (previewRole && match && previewRole === match.role) {
        return response;
      }

      const url = request.nextUrl.clone();
      url.pathname = "/preview";
      return NextResponse.redirect(url);
    }
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isProtected) {
    return response;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as UserRole | undefined;
  const match = PROTECTED_PREFIXES.find(({ prefix }) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  // ADMIN pode navegar em /cliente e /prestador com a própria conta
  // (ver requireRole, em src/lib/auth.ts, pro racional completo).
  if (!role || (match && role !== match.role && role !== "ADMIN")) {
    const url = request.nextUrl.clone();
    url.pathname = role ? ROLE_HOME[role] : "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
