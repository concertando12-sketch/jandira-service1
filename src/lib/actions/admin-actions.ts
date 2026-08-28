"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import type { ActionResult } from "./account-actions";

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
// Regiões (bairros) — Parte 2 da spec: são dados, não código.
// Sem Google Maps: lat/lng são opcionais (reservados pro futuro).
// ---------------------------------------------------------------------
export async function createRegionAction(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await requireAdminClient();
    const name = String(formData.get("name") ?? "").trim();
    const cityId = String(formData.get("city_id") ?? "");
    const latitudeRaw = String(formData.get("latitude") ?? "").trim();
    const longitudeRaw = String(formData.get("longitude") ?? "").trim();

    if (!name) return { ok: false, message: "Informe o nome do bairro." };
    if (!cityId) return { ok: false, message: "Cidade inválida." };

    const latitude = latitudeRaw ? Number(latitudeRaw) : null;
    const longitude = longitudeRaw ? Number(longitudeRaw) : null;
    if ((latitudeRaw && Number.isNaN(latitude)) || (longitudeRaw && Number.isNaN(longitude))) {
      return { ok: false, message: "Latitude/longitude inválidas." };
    }

    const { error } = await supabase
      .from("regions")
      .insert({ name, slug: slugify(name), city_id: cityId, latitude, longitude });

    if (error) {
      if (error.code === "23505") {
        return { ok: false, message: `Já existe um bairro chamado "${name}" nesta cidade.` };
      }
      return { ok: false, message: error.message };
    }
    revalidatePath("/admin/regioes");
    revalidatePath("/prestador/regiao");
    revalidatePath("/cliente/buscar");
    return { ok: true, message: `Bairro "${name}" cadastrado.` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function updateRegionAction(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await requireAdminClient();
    const id = String(formData.get("id") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    if (!id) return { ok: false, message: "Bairro inválido." };
    if (!name) return { ok: false, message: "Informe o nome do bairro." };

    const { error } = await supabase
      .from("regions")
      .update({ name, slug: slugify(name) })
      .eq("id", id);

    if (error) {
      if (error.code === "23505") {
        return { ok: false, message: `Já existe um bairro chamado "${name}" nesta cidade.` };
      }
      return { ok: false, message: error.message };
    }
    revalidatePath("/admin/regioes");
    revalidatePath("/prestador/regiao");
    revalidatePath("/cliente/buscar");
    return { ok: true, message: "Bairro atualizado." };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function toggleRegionActiveAction(id: string, isActive: boolean) {
  const supabase = await requireAdminClient();
  // Nunca excluímos bairro do banco (item 16) — só desativa. Cadastros
  // antigos que já referenciam esse bairro continuam intactos.
  await supabase.from("regions").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/regioes");
  revalidatePath("/prestador/regiao");
  revalidatePath("/cliente/buscar");
}

// ---------------------------------------------------------------------
// Sugestões de bairro (item 12/13) — cliente/prestador sugere, admin aprova.
// ---------------------------------------------------------------------
export async function approveRegionSuggestionAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdminClient();
    const { error } = await supabase.rpc("approve_region_suggestion", { p_suggestion_id: id });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/admin/regioes");
    revalidatePath("/prestador/regiao");
    revalidatePath("/cliente/buscar");
    return { ok: true, message: "Bairro aprovado e já disponível no app." };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function rejectRegionSuggestionAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdminClient();
    const { error } = await supabase.rpc("reject_region_suggestion", { p_suggestion_id: id });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/admin/regioes");
    return { ok: true, message: "Sugestão rejeitada." };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
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
