"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { ActionResult } from "./account-actions";

// Avaliação (item 34/35/36 da Fase 4). O RLS já garante que só o
// cliente dono de um pedido COMPLETED pode avaliar aquele pedido, e a
// trigger update_provider_rating recalcula a média sozinha.
export async function createReviewAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Você precisa estar logado." };

  const serviceRequestId = String(formData.get("service_request_id") ?? "");
  const providerId = String(formData.get("provider_id") ?? "");
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim();

  if (!serviceRequestId || !providerId) return { ok: false, message: "Solicitação inválida." };
  if (!rating || rating < 1 || rating > 5) return { ok: false, message: "Escolha de 1 a 5 estrelas." };

  const supabase = await createClient();
  const { error } = await supabase.from("reviews").insert({
    client_id: user.id,
    provider_id: providerId,
    service_request_id: serviceRequestId,
    rating,
    comment: comment || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Você já avaliou essa solicitação." };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/cliente/solicitacoes");
  revalidatePath(`/cliente/prestador/${providerId}`);
  return { ok: true, message: "Avaliação enviada. Obrigado!" };
}
