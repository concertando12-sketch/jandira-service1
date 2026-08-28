"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { exitPreviewAction } from "./preview-actions";

export async function signOutAction() {
  if (!isSupabaseConfigured) {
    // Sem projeto conectado, "sair" é só limpar o cookie do modo
    // prévia — não existe sessão real pra encerrar.
    await exitPreviewAction();
    return;
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
