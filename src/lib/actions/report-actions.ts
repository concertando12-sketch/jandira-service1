"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { ActionResult } from "./account-actions";

// Denunciar um prestador (Fase 6, item 34) — qualquer usuário logado
// pode denunciar; quem foi denunciado nunca vê a denúncia (RLS).
export async function createReportAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Você precisa estar logado." };

  const reportedUserId = String(formData.get("reported_user_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!reportedUserId) return { ok: false, message: "Usuário inválido." };
  if (!reason) return { ok: false, message: "Escolha um motivo." };
  if (reportedUserId === user.id) {
    return { ok: false, message: "Você não pode denunciar a si mesmo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId,
    reason,
    description: description || null,
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Denúncia enviada. Nossa equipe vai analisar." };
}
