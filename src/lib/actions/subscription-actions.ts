"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { ActionResult } from "./account-actions";

const MAX_RECEIPT_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

// Assinatura mensal via PIX (Fase 9) — pagamento manual: a pessoa paga
// por fora e sobe o comprovante aqui. Fica PENDING_REVIEW até o admin
// conferir nome/CPF e aprovar (approveSubscriptionAction). Serve tanto
// pra cliente quanto pra prestador — a regra é a mesma pros dois.
export async function uploadSubscriptionReceiptAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Você precisa estar logado." };

  const receipt = formData.get("receipt");
  if (!(receipt instanceof File) || receipt.size === 0) {
    return { ok: false, message: "Selecione o comprovante do PIX." };
  }
  if (receipt.size > MAX_RECEIPT_BYTES) {
    return { ok: false, message: "O arquivo precisa ter até 8MB." };
  }
  if (!ALLOWED_RECEIPT_TYPES.includes(receipt.type)) {
    return { ok: false, message: "Envie o comprovante em JPG, PNG, WebP ou PDF." };
  }

  const supabase = await createClient();

  const ext =
    receipt.type === "application/pdf"
      ? "pdf"
      : receipt.type === "image/png"
        ? "png"
        : receipt.type === "image/webp"
          ? "webp"
          : "jpg";
  // Bucket privado (payment-receipts) — guarda só o caminho, não uma
  // URL pública. Quem exibe (o próprio usuário ou o admin) gera uma
  // URL assinada na hora, respeitando a RLS de storage.objects.
  const path = `${user.id}/comprovante-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("payment-receipts")
    .upload(path, receipt, { contentType: receipt.type, upsert: true });
  if (uploadError) return { ok: false, message: `Erro ao enviar comprovante: ${uploadError.message}` };

  const { error: insertError } = await supabase
    .from("subscriptions")
    .insert({ user_id: user.id, receipt_url: path });
  if (insertError) return { ok: false, message: insertError.message };

  revalidatePath("/cliente/assinatura");
  revalidatePath("/prestador/assinatura");
  revalidatePath("/admin/assinaturas");
  return {
    ok: true,
    message: "Comprovante enviado! Assim que for aprovado, sua assinatura fica ativa.",
  };
}
