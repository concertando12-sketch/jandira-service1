"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { logAdminAction } from "./admin-log";
import type { ActionResult } from "./account-actions";

async function requireAdminClient() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Apenas administradores podem fazer isso.");
  }
  return createClient();
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Apenas administradores podem fazer isso.");
  }
  const supabase = await createClient();
  return { supabase, adminId: user.id };
}

// ---------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------
// categoryId vem preenchido quando cria com sucesso — usado pelo "+
// nova categoria" embutido no formulário de criar serviço, pra já
// selecionar a categoria recém-criada sem precisar recarregar a tela.
export interface CreateCategoryResult extends ActionResult {
  categoryId?: string;
}

export async function createCategoryAction(formData: FormData): Promise<CreateCategoryResult> {
  try {
    const supabase = await requireAdminClient();
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    if (!name) return { ok: false, message: "Informe o nome da categoria." };

    const { data, error } = await supabase
      .from("categories")
      .insert({ name, slug: slugify(name), description: description || null })
      .select("id")
      .single();

    if (error) return { ok: false, message: error.message };
    revalidatePath("/admin/categorias");
    revalidatePath("/admin/servicos");
    revalidatePath("/cliente/categorias");
    return { ok: true, message: `Categoria "${name}" criada.`, categoryId: data.id };
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
// Sugestões de serviço — prestador sugere, admin aprova (espelha
// sugestões de bairro logo abaixo).
// ---------------------------------------------------------------------
export async function approveServiceSuggestionAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdminClient();
    const { error } = await supabase.rpc("approve_service_suggestion", { p_suggestion_id: id });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/admin/servicos");
    revalidatePath("/prestador/servicos");
    revalidatePath("/cliente/categorias");
    revalidatePath("/cliente/buscar");
    return { ok: true, message: "Serviço aprovado e já disponível no app." };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function rejectServiceSuggestionAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdminClient();
    const { error } = await supabase.rpc("reject_service_suggestion", { p_suggestion_id: id });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/admin/servicos");
    return { ok: true, message: "Sugestão rejeitada." };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
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
// Homologação de prestadores (Fase 6, item 10/14/15/17/42) — só o
// trigger prevent_provider_status_escalation já bloqueia o próprio
// prestador de mudar isso; aqui é só a ação "oficial" do admin, com
// log e notificação.
// ---------------------------------------------------------------------
function revalidateProviderPaths() {
  revalidatePath("/admin/prestadores");
  revalidatePath("/admin/homologacao");
  revalidatePath("/admin/dashboard");
}

export async function approveProviderAction(
  providerId: string,
  providerName: string,
): Promise<ActionResult> {
  try {
    const { supabase, adminId } = await requireAdmin();
    const { data: profile, error } = await supabase
      .from("provider_profiles")
      .update({ status: "APPROVED", is_verified: true, status_reason: null })
      .eq("id", providerId)
      .select("user_id")
      .single();
    if (error) return { ok: false, message: error.message };

    if (profile?.user_id) {
      await supabase.rpc("notify", {
        p_user_id: profile.user_id,
        p_title: "Cadastro aprovado! 🎉",
        p_message: "Seu perfil foi homologado e já pode aparecer nas buscas dos clientes.",
        p_type: "PROVIDER_APPROVED",
      });
    }
    await logAdminAction(
      supabase,
      adminId,
      "PROVIDER_APPROVED",
      "provider_profiles",
      providerId,
      `Homologou ${providerName}`,
    );

    revalidateProviderPaths();
    return { ok: true, message: `${providerName} foi homologado(a).` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function rejectProviderAction(
  providerId: string,
  providerName: string,
  reason: string,
): Promise<ActionResult> {
  try {
    if (!reason.trim()) return { ok: false, message: "Informe o motivo da recusa." };
    const { supabase, adminId } = await requireAdmin();
    const { data: profile, error } = await supabase
      .from("provider_profiles")
      .update({ status: "REJECTED", status_reason: reason })
      .eq("id", providerId)
      .select("user_id")
      .single();
    if (error) return { ok: false, message: error.message };

    if (profile?.user_id) {
      await supabase.rpc("notify", {
        p_user_id: profile.user_id,
        p_title: "Cadastro não aprovado",
        p_message: reason,
        p_type: "PROVIDER_REJECTED",
      });
    }
    await logAdminAction(
      supabase,
      adminId,
      "PROVIDER_REJECTED",
      "provider_profiles",
      providerId,
      `Recusou ${providerName}: ${reason}`,
    );

    revalidateProviderPaths();
    return { ok: true, message: `${providerName} foi recusado(a).` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function suspendProviderAction(
  providerId: string,
  providerName: string,
  reason: string,
): Promise<ActionResult> {
  try {
    if (!reason.trim()) return { ok: false, message: "Informe o motivo da suspensão." };
    const { supabase, adminId } = await requireAdmin();
    // Bloqueio automático (item 45): suspender já tira da busca.
    const { data: profile, error } = await supabase
      .from("provider_profiles")
      .update({ status: "SUSPENDED", status_reason: reason, is_active: false })
      .eq("id", providerId)
      .select("user_id")
      .single();
    if (error) return { ok: false, message: error.message };

    if (profile?.user_id) {
      await supabase.rpc("notify", {
        p_user_id: profile.user_id,
        p_title: "Perfil suspenso",
        p_message: reason,
        p_type: "PROVIDER_SUSPENDED",
      });
    }
    await logAdminAction(
      supabase,
      adminId,
      "PROVIDER_SUSPENDED",
      "provider_profiles",
      providerId,
      `Suspendeu ${providerName}: ${reason}`,
    );

    revalidateProviderPaths();
    return { ok: true, message: `${providerName} foi suspenso(a).` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function reactivateProviderAction(
  providerId: string,
  providerName: string,
): Promise<ActionResult> {
  try {
    const { supabase, adminId } = await requireAdmin();
    const { error } = await supabase
      .from("provider_profiles")
      .update({ status: "APPROVED", status_reason: null })
      .eq("id", providerId);
    if (error) return { ok: false, message: error.message };

    await logAdminAction(
      supabase,
      adminId,
      "PROVIDER_REACTIVATED",
      "provider_profiles",
      providerId,
      `Reativou ${providerName}`,
    );

    revalidateProviderPaths();
    return { ok: true, message: `${providerName} foi reativado(a).` };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function toggleProviderVerifiedAction(id: string, isVerified: boolean) {
  const supabase = await requireAdminClient();
  await supabase.from("provider_profiles").update({ is_verified: isVerified }).eq("id", id);
  revalidatePath("/admin/prestadores");
}

// ---------------------------------------------------------------------
// Bloqueio de usuários (Fase 6, item 8) — vale pra CLIENT e PROVIDER.
// O trigger prevent_role_escalation impede o próprio usuário de se
// desbloquear.
// ---------------------------------------------------------------------
export async function toggleUserActiveAction(
  userId: string,
  userName: string,
  isActive: boolean,
): Promise<ActionResult> {
  try {
    const { supabase, adminId } = await requireAdmin();
    const { error } = await supabase.from("users").update({ is_active: isActive }).eq("id", userId);
    if (error) return { ok: false, message: error.message };

    await logAdminAction(
      supabase,
      adminId,
      isActive ? "USER_UNBLOCKED" : "USER_BLOCKED",
      "users",
      userId,
      `${isActive ? "Desbloqueou" : "Bloqueou"} ${userName}`,
    );

    revalidatePath("/admin/clientes");
    revalidatePath("/admin/prestadores");
    return { ok: true, message: isActive ? "Usuário desbloqueado." : "Usuário bloqueado." };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

// ---------------------------------------------------------------------
// Moderação de avaliações (Fase 6, item 32) — nunca deleta, só esconde.
// ---------------------------------------------------------------------
export async function toggleReviewVisibleAction(
  reviewId: string,
  isVisible: boolean,
): Promise<ActionResult> {
  try {
    const { supabase, adminId } = await requireAdmin();
    const { error } = await supabase.from("reviews").update({ is_visible: isVisible }).eq("id", reviewId);
    if (error) return { ok: false, message: error.message };

    await logAdminAction(
      supabase,
      adminId,
      isVisible ? "REVIEW_SHOWN" : "REVIEW_HIDDEN",
      "reviews",
      reviewId,
    );

    revalidatePath("/admin/avaliacoes");
    return { ok: true, message: isVisible ? "Avaliação reexibida." : "Avaliação ocultada." };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

// ---------------------------------------------------------------------
// Denúncias (Fase 6, item 33/34/35).
// ---------------------------------------------------------------------
export async function updateReportStatusAction(
  reportId: string,
  status: "IN_REVIEW" | "RESOLVED" | "DISMISSED",
): Promise<ActionResult> {
  try {
    const { supabase, adminId } = await requireAdmin();
    const { error } = await supabase.from("reports").update({ status }).eq("id", reportId);
    if (error) return { ok: false, message: error.message };

    await logAdminAction(supabase, adminId, `REPORT_${status}`, "reports", reportId);

    revalidatePath("/admin/denuncias");
    revalidatePath("/admin/dashboard");
    return { ok: true, message: "Denúncia atualizada." };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}
