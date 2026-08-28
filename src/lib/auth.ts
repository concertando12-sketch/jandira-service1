import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { UserRole } from "./constants";
import { isSupabaseConfigured } from "./supabase/env";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
}

// Busca o usuário logado (auth + perfil em public.users) num Server
// Component/Action. Retorna null se não estiver logado ou se o
// Supabase ainda não estiver configurado.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, email, phone, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return profile as CurrentUser;
}

// Usa em Server Components de página quando a rota exige um role
// específico (a defesa "de verdade" é o middleware + RLS; isto é só
// uma segunda checagem antes de renderizar).
export async function requireRole(role: UserRole): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect("/login");
  return user;
}
