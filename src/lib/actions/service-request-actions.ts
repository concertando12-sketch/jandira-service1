"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { APP_CITY, APP_STATE } from "@/lib/constants";
import type { ActionResult } from "./account-actions";

export interface CreateServiceRequestResult extends ActionResult {
  requestId?: string;
}

const PATHS_TO_REFRESH = [
  "/cliente/solicitacoes",
  "/prestador/solicitacoes",
  "/prestador/dashboard",
  "/cliente/dashboard",
];

function revalidateRequestPaths(requestId?: string) {
  for (const path of PATHS_TO_REFRESH) revalidatePath(path);
  if (requestId) revalidatePath(`/cliente/solicitacoes/${requestId}`);
}

// Cria a solicitação (item 4/5/6/7 da Fase 5). O endereço vai
// "congelado" na linha — se o cliente mudar o endereço principal
// depois, esse pedido continua com o endereço de quando foi feito
// (item 6: a edição aqui NUNCA toca em user_addresses).
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
  const requestedDate = String(formData.get("requested_date") ?? "").trim();
  const requestedTime = String(formData.get("requested_time") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!providerId || !serviceId) return { ok: false, message: "Prestador ou serviço inválido." };
  if (!regionId) return { ok: false, message: "Selecione o bairro onde o serviço será feito." };
  if (!street || !number) {
    return { ok: false, message: "Informe rua e número — o prestador precisa saber onde ir." };
  }
  if (!requestedDate || Number.isNaN(Date.parse(requestedDate))) {
    return { ok: false, message: "Informe uma data válida." };
  }
  if (!requestedTime || !/^\d{2}:\d{2}/.test(requestedTime)) {
    return { ok: false, message: "Informe um horário válido." };
  }
  if (!description) return { ok: false, message: "Descreva o que você precisa." };

  const supabase = await createClient();

  // Confere que esse prestador realmente oferece esse serviço e atende
  // esse bairro — defesa a mais além do que a tela já restringe.
  const [{ data: providerService }, { data: providerRegion }, { data: providerProfile }] =
    await Promise.all([
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
      supabase
        .from("provider_profiles")
        .select("user_id, professional_name, is_active, status")
        .eq("id", providerId)
        .maybeSingle(),
    ]);

  if (!providerService) return { ok: false, message: "Esse prestador não oferece esse serviço." };
  if (!providerRegion) return { ok: false, message: "Esse prestador não atende esse bairro." };
  if (!providerProfile?.is_active || providerProfile.status !== "APPROVED") {
    return { ok: false, message: "Esse prestador não está disponível no momento." };
  }

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
      requested_date: requestedDate || null,
      requested_time: requestedTime || null,
      description,
      status: "PENDING",
    })
    .select("id")
    .single();

  if (error || !request) {
    return { ok: false, message: error?.message ?? "Não foi possível criar a solicitação." };
  }

  if (providerProfile?.user_id) {
    await supabase.rpc("notify", {
      p_user_id: providerProfile.user_id,
      p_title: "Nova solicitação",
      p_message: `${user.name} pediu um orçamento pelo Jandira Service.`,
      p_type: "NEW_REQUEST",
      p_service_request_id: request.id,
    });
  }

  revalidateRequestPaths(request.id);
  return { ok: true, message: "Solicitação enviada!", requestId: request.id };
}

interface LoadedRequest {
  id: string;
  client_id: string;
  provider_id: string;
  status: string;
  provider_profiles: { user_id: string; professional_name: string } | null;
  users: { name: string } | null;
}

async function loadRequestForActor(requestId: string) {
  const user = await getCurrentUser();
  if (!user) return { user: null, request: null as LoadedRequest | null, supabase: null };

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("service_requests")
    .select("id, client_id, provider_id, status, provider_profiles(user_id, professional_name), users(name)")
    .eq("id", requestId)
    .maybeSingle();

  return { user, request: request as LoadedRequest | null, supabase };
}

// Prestador aceita e informa o valor (item 14).
export async function acceptServiceRequestAction(
  requestId: string,
  price: number,
): Promise<ActionResult> {
  const { user, request, supabase } = await loadRequestForActor(requestId);
  if (!user || !supabase) return { ok: false, message: "Você precisa estar logado." };
  if (!request) return { ok: false, message: "Solicitação não encontrada." };
  if (request.provider_profiles?.user_id !== user.id) {
    return { ok: false, message: "Essa solicitação não é sua." };
  }
  if (request.status !== "PENDING") return { ok: false, message: "Essa solicitação já foi respondida." };
  if (!price || price <= 0) return { ok: false, message: "Informe um valor válido." };

  const { error } = await supabase
    .from("service_requests")
    .update({ status: "ACCEPTED", provider_price: price })
    .eq("id", requestId);
  if (error) return { ok: false, message: error.message };

  await supabase.rpc("notify", {
    p_user_id: request.client_id,
    p_title: "Solicitação aceita!",
    p_message: `${request.provider_profiles?.professional_name ?? "O prestador"} aceitou sua solicitação por R$ ${price.toLocaleString("pt-BR")}.`,
    p_type: "ACCEPTED",
    p_service_request_id: requestId,
  });

  revalidateRequestPaths(requestId);
  return { ok: true, message: "Solicitação aceita." };
}

// Prestador recusa com motivo (item 15).
export async function declineServiceRequestAction(
  requestId: string,
  reason: string,
): Promise<ActionResult> {
  const { user, request, supabase } = await loadRequestForActor(requestId);
  if (!user || !supabase) return { ok: false, message: "Você precisa estar logado." };
  if (!request) return { ok: false, message: "Solicitação não encontrada." };
  if (request.provider_profiles?.user_id !== user.id) {
    return { ok: false, message: "Essa solicitação não é sua." };
  }
  if (request.status !== "PENDING") return { ok: false, message: "Essa solicitação já foi respondida." };
  if (!reason.trim()) return { ok: false, message: "Escolha um motivo." };

  const { error } = await supabase
    .from("service_requests")
    .update({ status: "DECLINED", provider_response: reason })
    .eq("id", requestId);
  if (error) return { ok: false, message: error.message };

  await supabase.rpc("notify", {
    p_user_id: request.client_id,
    p_title: "Solicitação recusada",
    p_message: `${request.provider_profiles?.professional_name ?? "O prestador"} não pôde aceitar: ${reason}`,
    p_type: "DECLINED",
    p_service_request_id: requestId,
  });

  revalidateRequestPaths(requestId);
  return { ok: true, message: "Solicitação recusada." };
}

// Cliente confirma o serviço depois de ver o valor (item 18).
export async function confirmServiceRequestAction(requestId: string): Promise<ActionResult> {
  const { user, request, supabase } = await loadRequestForActor(requestId);
  if (!user || !supabase) return { ok: false, message: "Você precisa estar logado." };
  if (!request) return { ok: false, message: "Solicitação não encontrada." };
  if (request.client_id !== user.id) return { ok: false, message: "Essa solicitação não é sua." };
  if (request.status !== "ACCEPTED") return { ok: false, message: "Essa solicitação ainda não foi aceita." };

  const { error } = await supabase
    .from("service_requests")
    .update({ status: "SCHEDULED" })
    .eq("id", requestId);
  if (error) return { ok: false, message: error.message };

  if (request.provider_profiles?.user_id) {
    await supabase.rpc("notify", {
      p_user_id: request.provider_profiles.user_id,
      p_title: "Serviço confirmado",
      p_message: `${request.users?.name ?? "O cliente"} confirmou o serviço.`,
      p_type: "SCHEDULED",
      p_service_request_id: requestId,
    });
  }

  revalidateRequestPaths(requestId);
  return { ok: true, message: "Serviço confirmado e agendado." };
}

// Prestador inicia o serviço no dia combinado (item 23).
export async function startServiceRequestAction(requestId: string): Promise<ActionResult> {
  const { user, request, supabase } = await loadRequestForActor(requestId);
  if (!user || !supabase) return { ok: false, message: "Você precisa estar logado." };
  if (!request) return { ok: false, message: "Solicitação não encontrada." };
  if (request.provider_profiles?.user_id !== user.id) {
    return { ok: false, message: "Essa solicitação não é sua." };
  }
  if (request.status !== "SCHEDULED") return { ok: false, message: "Esse serviço ainda não está agendado." };

  const { error } = await supabase
    .from("service_requests")
    .update({ status: "IN_PROGRESS" })
    .eq("id", requestId);
  if (error) return { ok: false, message: error.message };

  revalidateRequestPaths(requestId);
  return { ok: true, message: "Serviço iniciado." };
}

// Prestador marca o serviço como concluído (item 24) — libera a
// avaliação do cliente (item 25/27, garantido também pelo RLS).
export async function completeServiceRequestAction(requestId: string): Promise<ActionResult> {
  const { user, request, supabase } = await loadRequestForActor(requestId);
  if (!user || !supabase) return { ok: false, message: "Você precisa estar logado." };
  if (!request) return { ok: false, message: "Solicitação não encontrada." };
  if (request.provider_profiles?.user_id !== user.id) {
    return { ok: false, message: "Essa solicitação não é sua." };
  }
  if (request.status !== "IN_PROGRESS") {
    return { ok: false, message: "Só dá pra concluir um serviço em andamento." };
  }

  const { error } = await supabase
    .from("service_requests")
    .update({ status: "COMPLETED" })
    .eq("id", requestId);
  if (error) return { ok: false, message: error.message };

  await supabase.rpc("notify", {
    p_user_id: request.client_id,
    p_title: "Serviço concluído",
    p_message: "Seu serviço foi marcado como concluído. Que tal avaliar o profissional?",
    p_type: "COMPLETED",
    p_service_request_id: requestId,
  });

  revalidateRequestPaths(requestId);
  return { ok: true, message: "Serviço marcado como concluído." };
}

// Cliente cancela um pedido que ainda não começou (item 30).
export async function cancelServiceRequestAction(
  requestId: string,
  reason: string,
): Promise<ActionResult> {
  const { user, request, supabase } = await loadRequestForActor(requestId);
  if (!user || !supabase) return { ok: false, message: "Você precisa estar logado." };
  if (!request) return { ok: false, message: "Solicitação não encontrada." };
  if (request.client_id !== user.id) return { ok: false, message: "Essa solicitação não é sua." };
  if (!["PENDING", "ACCEPTED", "SCHEDULED"].includes(request.status)) {
    return { ok: false, message: "Essa solicitação não pode mais ser cancelada." };
  }
  if (!reason.trim()) return { ok: false, message: "Escolha um motivo." };

  const { error } = await supabase
    .from("service_requests")
    .update({ status: "CANCELLED", cancel_reason: reason })
    .eq("id", requestId);
  if (error) return { ok: false, message: error.message };

  if (request.provider_profiles?.user_id) {
    await supabase.rpc("notify", {
      p_user_id: request.provider_profiles.user_id,
      p_title: "Solicitação cancelada",
      p_message: `${request.users?.name ?? "O cliente"} cancelou: ${reason}`,
      p_type: "CANCELLED",
      p_service_request_id: requestId,
    });
  }

  revalidateRequestPaths(requestId);
  return { ok: true, message: "Solicitação cancelada." };
}

// Prestador cancela um serviço já agendado, com justificativa (item 31).
export async function providerCancelServiceRequestAction(
  requestId: string,
  reason: string,
): Promise<ActionResult> {
  const { user, request, supabase } = await loadRequestForActor(requestId);
  if (!user || !supabase) return { ok: false, message: "Você precisa estar logado." };
  if (!request) return { ok: false, message: "Solicitação não encontrada." };
  if (request.provider_profiles?.user_id !== user.id) {
    return { ok: false, message: "Essa solicitação não é sua." };
  }
  if (request.status !== "SCHEDULED") {
    return { ok: false, message: "Só dá pra cancelar um serviço já agendado por aqui." };
  }
  if (!reason.trim()) return { ok: false, message: "Escolha um motivo." };

  const { error } = await supabase
    .from("service_requests")
    .update({ status: "CANCELLED", cancel_reason: reason })
    .eq("id", requestId);
  if (error) return { ok: false, message: error.message };

  await supabase.rpc("notify", {
    p_user_id: request.client_id,
    p_title: "Serviço cancelado pelo prestador",
    p_message: `${request.provider_profiles?.professional_name ?? "O prestador"} cancelou: ${reason}`,
    p_type: "CANCELLED",
    p_service_request_id: requestId,
  });

  revalidateRequestPaths(requestId);
  return { ok: true, message: "Serviço cancelado." };
}
