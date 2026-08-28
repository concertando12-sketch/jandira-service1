"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { APP_CITY, APP_STATE } from "@/lib/constants";
import type { ActionResult } from "./account-actions";

export interface CreateServiceRequestResult extends ActionResult {
  requestId?: string;
}

// Cria a solicitação (item 28/29 da Fase 4). O endereço vai "congelado"
// na linha — se o cliente mudar o endereço principal depois, esse
// pedido continua com o endereço de quando foi feito.
export async function createServiceRequestAction(
  formData: FormData,
): Promise<CreateServiceRequestResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Você precisa estar logado." };
  if (user.role !== "CLIENT") {
    return { ok: false, message: "Apenas clientes podem solicitar serviços." };
  }

  const providerId = String(formData.get("provider_id") ?? "");
  const serviceId = String(formData.get("service_id") ?? "");
  const regionId = String(formData.get("region_id") ?? "");
  const street = String(formData.get("street") ?? "").trim();
  const number = String(formData.get("number") ?? "").trim();
  const complement = String(formData.get("complement") ?? "").trim();
  const preferredDate = String(formData.get("preferred_date") ?? "").trim();
  const preferredTime = String(formData.get("preferred_time") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!providerId || !serviceId) return { ok: false, message: "Prestador ou serviço inválido." };
  if (!regionId) return { ok: false, message: "Selecione o bairro onde o serviço será feito." };
  if (!street || !number) {
    return { ok: false, message: "Informe rua e número — o prestador precisa saber onde ir." };
  }

  const supabase = await createClient();

  // Confere que esse prestador realmente oferece esse serviço e atende
  // esse bairro — defesa a mais além do que a tela já restringe.
  const [{ data: providerService }, { data: providerRegion }] = await Promise.all([
    supabase
      .from("provider_services")
      .select("id")
      .eq("provider_id", providerId)
      .eq("service_id", serviceId)
      .maybeSingle(),
    supabase
      .from("provider_regions")
      .select("id")
      .eq("provider_id", providerId)
      .eq("region_id", regionId)
      .maybeSingle(),
  ]);

  if (!providerService) return { ok: false, message: "Esse prestador não oferece esse serviço." };
  if (!providerRegion) return { ok: false, message: "Esse prestador não atende esse bairro." };

  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("name", APP_CITY)
    .eq("state", APP_STATE)
    .maybeSingle();

  const { data: request, error } = await supabase
    .from("service_requests")
    .insert({
      client_id: user.id,
      provider_id: providerId,
      service_id: serviceId,
      city_id: city?.id ?? null,
      region_id: regionId,
      street,
      number,
      complement: complement || null,
      preferred_date: preferredDate || null,
      preferred_time: preferredTime || null,
      description: description || null,
      status: "PENDING",
    })
    .select("id")
    .single();

  if (error || !request) {
    return { ok: false, message: error?.message ?? "Não foi possível criar a solicitação." };
  }

  revalidatePath("/cliente/solicitacoes");
  revalidatePath("/prestador/solicitacoes");
  revalidatePath("/prestador/dashboard");
  revalidatePath("/cliente/dashboard");
  return { ok: true, message: "Solicitação enviada!", requestId: request.id };
}

async function loadRequestForActor(requestId: string) {
  const user = await getCurrentUser();
  if (!user) return { user: null, request: null, supabase: null };

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("service_requests")
    .select("id, client_id, provider_id, status, provider_profiles(user_id)")
    .eq("id", requestId)
    .maybeSingle();

  return { user, request, supabase };
}

// Prestador aceita ou recusa uma solicitação pendente (item 31).
export async function respondServiceRequestAction(
  requestId: string,
  decision: "ACCEPTED" | "DECLINED",
): Promise<ActionResult> {
  const { user, request, supabase } = await loadRequestForActor(requestId);
  if (!user || !supabase) return { ok: false, message: "Você precisa estar logado." };
  if (!request) return { ok: false, message: "Solicitação não encontrada." };
  if (request.provider_profiles?.user_id !== user.id) {
    return { ok: false, message: "Essa solicitação não é sua." };
  }
  if (request.status !== "PENDING") {
    return { ok: false, message: "Essa solicitação já foi respondida." };
  }

  const { error } = await supabase
    .from("service_requests")
    .update({ status: decision })
    .eq("id", requestId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/prestador/solicitacoes");
  revalidatePath("/prestador/dashboard");
  revalidatePath("/cliente/solicitacoes");
  return {
    ok: true,
    message: decision === "ACCEPTED" ? "Solicitação aceita." : "Solicitação recusada.",
  };
}

// Prestador marca o serviço como concluído (item 30) — libera a
// avaliação do cliente (item 34/36, garantido também pelo RLS).
export async function completeServiceRequestAction(requestId: string): Promise<ActionResult> {
  const { user, request, supabase } = await loadRequestForActor(requestId);
  if (!user || !supabase) return { ok: false, message: "Você precisa estar logado." };
  if (!request) return { ok: false, message: "Solicitação não encontrada." };
  if (request.provider_profiles?.user_id !== user.id) {
    return { ok: false, message: "Essa solicitação não é sua." };
  }
  if (request.status !== "ACCEPTED" && request.status !== "IN_PROGRESS") {
    return { ok: false, message: "Só dá pra concluir uma solicitação aceita." };
  }

  const { error } = await supabase
    .from("service_requests")
    .update({ status: "COMPLETED" })
    .eq("id", requestId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/prestador/solicitacoes");
  revalidatePath("/prestador/dashboard");
  revalidatePath("/cliente/solicitacoes");
  return { ok: true, message: "Serviço marcado como concluído." };
}

// Cliente cancela um pedido que ainda não terminou.
export async function cancelServiceRequestAction(requestId: string): Promise<ActionResult> {
  const { user, request, supabase } = await loadRequestForActor(requestId);
  if (!user || !supabase) return { ok: false, message: "Você precisa estar logado." };
  if (!request) return { ok: false, message: "Solicitação não encontrada." };
  if (request.client_id !== user.id) return { ok: false, message: "Essa solicitação não é sua." };
  if (request.status === "COMPLETED" || request.status === "CANCELLED") {
    return { ok: false, message: "Essa solicitação já foi encerrada." };
  }

  const { error } = await supabase
    .from("service_requests")
    .update({ status: "CANCELLED" })
    .eq("id", requestId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/cliente/solicitacoes");
  revalidatePath("/prestador/solicitacoes");
  revalidatePath("/prestador/dashboard");
  revalidatePath("/cliente/dashboard");
  return { ok: true, message: "Solicitação cancelada." };
}
