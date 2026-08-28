"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { ActionResult } from "./account-actions";

// Faixa unicode das marcas diacríticas combinantes (acentos), depois de
// normalizar a string em NFD — usado para tirar acento na hora de gerar slug.
const DIACRITICS_REGEX = /[̀-ͯ]/g;

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function requireAdminClient() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Apenas administradores podem fazer isso.");
  }
  return createClient();
}

// ---------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------
export async function createCategoryAction(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await requireAdminClient();
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    if (!name) return { ok: false, message: "Informe o nome da categoria." };

    const { error } = await supabase
      .from("categories")
      .insert({ name, slug: slugify(name), description: description || null });

    if (error) return { ok: false, message: error.message };
    revalidatePath("/admin/categorias");
    revalidatePath("/cliente/categorias");
    return { ok: true, message: `Categoria "${name}" criada.` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function toggleCategoryActiveAction(id: string, isActive: boolean) {
  const supabase = await requireAdminClient();
  await supabase.from("categories").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/categorias");
  revalidatePath("/cliente/categorias");
}

// ---------------------------------------------------------------------
// Serviços (profissões) — item 20 da spec: cadastrável sem mexer em código.
// ---------------------------------------------------------------------
export async function createServiceAction(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await requireAdminClient();
    const name = String(formData.get("name") ?? "").trim();
    const categoryId = String(formData.get("category_id") ?? "");
    const description = String(formData.get("description") ?? "").trim();
    if (!name) return { ok: false, message: "Informe o nome do serviço." };
    if (!categoryId) return { ok: false, message: "Escolha uma categoria." };

    const { error } = await supabase.from("services").insert({
      name,
      slug: slugify(name),
      category_id: categoryId,
      description: description || null,
    });

    if (error) return { ok: false, message: error.message };
    revalidatePath("/admin/servicos");
    revalidatePath("/cliente/categorias");
    return { ok: true, message: `Serviço "${name}" criado.` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function toggleServiceActiveAction(id: string, isActive: boolean) {
  const supabase = await requireAdminClient();
  await supabase.from("services").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/servicos");
  revalidatePath("/cliente/categorias");
}

// ---------------------------------------------------------------------
// Regiões (bairros) — sem Google Maps: lat/lng cadastrados manualmente.
// ---------------------------------------------------------------------
export async function createNeighborhoodAction(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await requireAdminClient();
    const name = String(formData.get("name") ?? "").trim();
    const cityId = String(formData.get("city_id") ?? "");
    const latitude = Number(formData.get("latitude"));
    const longitude = Number(formData.get("longitude"));

    if (!name) return { ok: false, message: "Informe o nome do bairro." };
    if (!cityId) return { ok: false, message: "Cidade inválida." };
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return { ok: false, message: "Latitude/longitude inválidas." };
    }

    const { error } = await supabase
      .from("neighborhoods")
      .insert({ name, city_id: cityId, latitude, longitude });

    if (error) return { ok: false, message: error.message };
    revalidatePath("/admin/regioes");
    return { ok: true, message: `Bairro "${name}" cadastrado.` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function toggleNeighborhoodActiveAction(id: string, isActive: boolean) {
  const supabase = await requireAdminClient();
  await supabase.from("neighborhoods").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/regioes");
}

// ---------------------------------------------------------------------
// Prestadores — verificar / bloquear (item 19)
// ---------------------------------------------------------------------
export async function toggleProviderVerifiedAction(id: string, isVerified: boolean) {
  const supabase = await requireAdminClient();
  await supabase.from("provider_profiles").update({ is_verified: isVerified }).eq("id", id);
  revalidatePath("/admin/prestadores");
}

export async function toggleProviderActiveAction(id: string, isActive: boolean) {
  const supabase = await requireAdminClient();
  await supabase.from("provider_profiles").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/prestadores");
}
