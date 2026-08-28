"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { ActionResult } from "./account-actions";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function ensureProviderProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("provider_profiles")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: false })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Não foi possível preparar seu perfil.");
  return data.id;
}

// "Perfil X% completo" (item 39/40 da Fase 1) — calculado de verdade a
// partir do que já foi preenchido, não é um número fixo.
async function recomputeProfileCompletion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  providerId: string,
) {
  const { data: profile } = await supabase
    .from("provider_profiles")
    .select("professional_name, description, profile_photo, price_from, availability, whatsapp")
    .eq("id", providerId)
    .single();
  if (!profile) return;

  const [{ count: servicesCount }, { count: regionsCount }] = await Promise.all([
    supabase.from("provider_services").select("id", { count: "exact", head: true }).eq("provider_id", providerId),
    supabase.from("provider_regions").select("id", { count: "exact", head: true }).eq("provider_id", providerId),
  ]);

  const signals = [
    Boolean(profile.professional_name?.trim()),
    Boolean(profile.description?.trim()),
    Boolean(profile.profile_photo),
    Boolean(profile.price_from),
    Boolean(profile.availability?.trim()),
    Boolean(profile.whatsapp?.trim()),
    (servicesCount ?? 0) > 0,
    (regionsCount ?? 0) > 0,
  ];
  const completion = Math.round((signals.filter(Boolean).length / signals.length) * 100);

  await supabase.from("provider_profiles").update({ profile_completion: completion }).eq("id", providerId);
}

export async function updateProviderProfileAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "PROVIDER") {
    return { ok: false, message: "Apenas prestadores podem editar o perfil profissional." };
  }

  const professionalName = String(formData.get("professional_name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceFromRaw = String(formData.get("price_from") ?? "").trim();
  const priceToRaw = String(formData.get("price_to") ?? "").trim();
  const availability = String(formData.get("availability") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const photo = formData.get("photo");

  if (!professionalName) return { ok: false, message: "Informe seu nome profissional." };

  const priceFrom = priceFromRaw ? Number(priceFromRaw) : null;
  const priceTo = priceToRaw ? Number(priceToRaw) : null;
  if (priceFromRaw && Number.isNaN(priceFrom)) return { ok: false, message: "Valor inicial inválido." };
  if (priceToRaw && Number.isNaN(priceTo)) return { ok: false, message: "Valor final inválido." };

  const supabase = await createClient();
  const providerId = await ensureProviderProfile(supabase, user.id);

  let photoUrl: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) {
      return { ok: false, message: "A foto precisa ter até 5MB." };
    }
    if (!ALLOWED_PHOTO_TYPES.includes(photo.type)) {
      return { ok: false, message: "Envie uma foto em JPG, PNG ou WebP." };
    }
    const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("provider-photos")
      .upload(path, photo, { contentType: photo.type, upsert: true });
    if (uploadError) return { ok: false, message: `Erro ao enviar foto: ${uploadError.message}` };

    photoUrl = supabase.storage.from("provider-photos").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase
    .from("provider_profiles")
    .update({
      professional_name: professionalName,
      description: description || null,
      price_from: priceFrom,
      price_to: priceTo,
      availability: availability || null,
      whatsapp: whatsapp || null,
      ...(photoUrl ? { profile_photo: photoUrl } : {}),
    })
    .eq("id", providerId);

  if (error) return { ok: false, message: error.message };

  await recomputeProfileCompletion(supabase, providerId);

  revalidatePath("/prestador/perfil");
  revalidatePath("/prestador/dashboard");
  revalidatePath(`/cliente/prestador/${providerId}`);
  return { ok: true, message: "Perfil atualizado." };
}

// Serviços que o prestador oferece (item 18-21 da Fase 1) — sem isso
// ele não aparece em nenhuma busca, mesmo homologado e com região
// marcada (search_providers cruza service_id de verdade).
export async function saveProviderServicesAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "PROVIDER") {
    return { ok: false, message: "Apenas prestadores podem escolher serviços." };
  }

  const serviceIds = formData.getAll("service_ids").map(String).filter(Boolean);
  if (serviceIds.length === 0) {
    return { ok: false, message: "Selecione pelo menos um serviço que você oferece." };
  }

  const supabase = await createClient();
  const providerId = await ensureProviderProfile(supabase, user.id);

  const { error: deleteError } = await supabase
    .from("provider_services")
    .delete()
    .eq("provider_id", providerId);
  if (deleteError) return { ok: false, message: deleteError.message };

  const { error: insertError } = await supabase
    .from("provider_services")
    .insert(serviceIds.map((serviceId) => ({ provider_id: providerId, service_id: serviceId })));
  if (insertError) return { ok: false, message: insertError.message };

  await recomputeProfileCompletion(supabase, providerId);

  revalidatePath("/prestador/servicos");
  revalidatePath("/prestador/dashboard");
  revalidatePath("/cliente/buscar");
  return { ok: true, message: "Serviços salvos." };
}
