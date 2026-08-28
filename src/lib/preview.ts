import { cookies } from "next/headers";
import { PREVIEW_ROLE_COOKIE, type UserRole } from "./constants";
import type { CurrentUser } from "./auth";

// Modo prévia: só existe enquanto o Supabase não está conectado
// (ver isSupabaseConfigured). Deixa abrir os três painéis com um
// usuário de mentira, sem precisar de login real — pensado só pra
// você conseguir olhar o sistema andando antes de plugar o banco.
// Nada disso roda mais assim que .env.local tiver as chaves reais.
export const PREVIEW_USERS: Record<UserRole, CurrentUser> = {
  CLIENT: {
    id: "preview-client",
    name: "Cliente Prévia",
    email: "previa.cliente@exemplo.com",
    phone: "(11) 90000-0000",
    role: "CLIENT",
    avatar_url: null,
    is_active: true,
  },
  PROVIDER: {
    id: "preview-provider",
    name: "Prestador Prévia",
    email: "previa.prestador@exemplo.com",
    phone: "(11) 90000-0001",
    role: "PROVIDER",
    avatar_url: null,
    is_active: true,
  },
  ADMIN: {
    id: "preview-admin",
    name: "Admin Prévia",
    email: "previa.admin@exemplo.com",
    phone: null,
    role: "ADMIN",
    avatar_url: null,
    is_active: true,
  },
};

export async function getPreviewUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const role = store.get(PREVIEW_ROLE_COOKIE)?.value as UserRole | undefined;
  if (!role || !(role in PREVIEW_USERS)) return null;
  return PREVIEW_USERS[role];
}
