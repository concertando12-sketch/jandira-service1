import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { UserRole } from "./constants";
import { isSupabaseConfigured } from "./supabase/env";
import { getPreviewUser } from "./preview";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  // Conta bloqueada pelo admin (Fase 6, item 8) — ver requireRole.
  is_active: boolean;
}

// Busca o usuário logado (auth + perfil em public.users) num Server
// Component/Action. Sem Supabase conectado ainda, cai no usuário do
// modo prévia (se a pessoa escolheu um papel em /preview) — ver
// src/lib/preview.ts. Isso some sozinho assim que .env.local tiver as
// chaves reais.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured) return getPreviewUser();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, email, phone, role, avatar_url, is_active")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return profile as CurrentUser;
}

// Usa em Server Components de página quando a rota exige um role
// específico (a defesa "de verdade" é o middleware + RLS; isto é só
// uma segunda checagem antes de renderizar).
//
// ADMIN sempre passa, mesmo pedindo CLIENT/PROVIDER — ele pode navegar
// pelas telas de cliente/prestador com a própria conta pra ver a
// experiência de cada papel (item pedido pelo dono da plataforma). Não
// é uma brecha de segurança: quem já é admin já tem acesso amplo via
// RLS; isso só libera as ROTAS. Ações que exigem role=CLIENT/PROVIDER
// de verdade (ex: criar solicitação, criar provider_profile) continuam
// bloqueadas pelas policies do banco, que checam o role real.
export async function requireRole(role: UserRole): Promise<CurrentUser> {
  const fallback = isSupabaseConfigured ? "/login" : "/preview";
  const user = await getCurrentUser();
  if (!user) redirect(fallback);
  if (!user.is_active) redirect("/bloqueado");
  if (user.role !== role && user.role !== "ADMIN") redirect(fallback);
  return user;
}
