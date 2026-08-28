"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PREVIEW_ROLE_COOKIE, type UserRole } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const ROLE_HOME: Record<UserRole, string> = {
  CLIENT: "/cliente/dashboard",
  PROVIDER: "/prestador/dashboard",
  ADMIN: "/admin/dashboard",
};

// Só existe enquanto não há projeto Supabase conectado — ver
// src/lib/preview.ts. Guarda contra chamada direta depois que as
// credenciais forem configuradas (defesa a mais, o /preview já
// redireciona sozinho pro /login nesse caso).
export async function enterPreviewAction(role: UserRole) {
  if (isSupabaseConfigured) redirect("/login");

  const store = await cookies();
  store.set(PREVIEW_ROLE_COOKIE, role, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
  });
  redirect(ROLE_HOME[role]);
}

export async function exitPreviewAction() {
  const store = await cookies();
  store.delete(PREVIEW_ROLE_COOKIE);
  redirect(isSupabaseConfigured ? "/login" : "/preview");
}
