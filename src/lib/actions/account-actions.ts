"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  ok: boolean;
  message: string;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Compartilhado entre cliente e prestador (AccountForm) — cada um vê a
// foto do outro (cliente no perfil do prestador, prestador na
// solicitação recebida), então fica em public.users.avatar_url, não
// só em provider_profiles.
export async function updateAccountAction(
  path: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Você precisa estar logado." };

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const photo = formData.get("photo");

  if (!name) return { ok: false, message: "Informe seu nome." };

  let photoUrl: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) {
      return { ok: false, message: "A foto precisa ter até 5MB." };
    }
    if (!ALLOWED_PHOTO_TYPES.includes(photo.type)) {
      return { ok: false, message: "Envie uma foto em JPG, PNG ou WebP." };
    }
    const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;
    // Mesmo bucket público das fotos de prestador (provider-photos) —
    // a policy de escrita já é por pasta = auth.uid(), não por role,
    // então serve pra cliente também sem precisar de bucket novo.
    const { error: uploadError } = await supabase.storage
      .from("provider-photos")
      .upload(filePath, photo, { contentType: photo.type, upsert: true });
    if (uploadError) return { ok: false, message: `Erro ao enviar foto: ${uploadError.message}` };

    photoUrl = supabase.storage.from("provider-photos").getPublicUrl(filePath).data.publicUrl;
  }

  const { error } = await supabase
    .from("users")
    .update({
      name,
      phone: phone || null,
      ...(photoUrl ? { avatar_url: photoUrl } : {}),
    })
    .eq("id", user.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath(path);
  revalidatePath("/prestador/solicitacoes");
  revalidatePath("/cliente/solicitacoes");
  return { ok: true, message: "Dados atualizados com sucesso." };
}
