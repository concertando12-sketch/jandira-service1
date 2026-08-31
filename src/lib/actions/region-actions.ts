"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { APP_CITY, APP_STATE } from "@/lib/constants";
import type { ActionResult } from "./account-actions";

// Sugestão de bairro (item 11/12 da Parte 2) — qualquer usuário logado
// pode sugerir. Nunca vira bairro oficial sozinho: fica PENDING até um
// admin aprovar (ver approveRegionSuggestionAction).
export async function suggestRegionAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Você precisa estar logado." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, message: "Informe o nome do bairro." };

  const supabase = await createClient();
  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("name", APP_CITY)
    .eq("state", APP_STATE)
    .maybeSingle();

  // Sem cidade, a sugestão nunca vai conseguir ser aprovada depois
  // (regions.city_id é NOT NULL) — melhor avisar na hora do que deixar
  // a sugestão PENDING pra sempre sem explicação.
  if (!city) {
    return { ok: false, message: `Cidade ${APP_CITY}/${APP_STATE} não encontrada. Rode supabase/seed.sql.` };
  }

  const { error } = await supabase
    .from("region_suggestions")
    .insert({ name, city_id: city.id, submitted_by: user.id });

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Obrigado! Esse bairro foi enviado para análise." };
}

// Salva a lista de bairros que o prestador ATENDE (provider_regions,
// N:N — item 6/7/22/26). Onde ele MORA é outra coisa, fica em
// user_addresses (ver saveAddressAction, Fase 3.1). Cria o
// provider_profiles na hora se ele ainda não existir, já que isso pode
// ser a primeira coisa que o prestador preenche.
export async function saveProviderRegionsAction(formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Você precisa estar logado." };
  if (user.role !== "PROVIDER") {
    return { ok: false, message: "Apenas prestadores podem definir região de atendimento." };
  }

  const attendingIds = formData.getAll("region_ids").map(String).filter(Boolean);

  if (attendingIds.length === 0) {
    return { ok: false, message: "Selecione pelo menos um bairro que você atende." };
  }

  const supabase = await createClient();

  // Não mexe em professional_name/descrição/preço aqui — isso é do
  // perfil profissional (Fase 2). Essa ação só garante que a linha
  // exista (pra poder anexar região) e marca is_active=true: no MVP o
  // próprio prestador "publica" ao definir onde atende (item 39), a
  // verificação (selo ✓) continua sendo manual do admin (item 41).
  const { data: profile, error: upsertError } = await supabase
    .from("provider_profiles")
    .upsert(
      { user_id: user.id, is_active: true },
      { onConflict: "user_id", ignoreDuplicates: false },
    )
    .select("id")
    .single();

  if (upsertError || !profile) {
    return { ok: false, message: upsertError?.message ?? "Não foi possível salvar seu perfil." };
  }

  const { error: deleteError } = await supabase
    .from("provider_regions")
    .delete()
    .eq("provider_id", profile.id);
  if (deleteError) return { ok: false, message: deleteError.message };

  const { error: insertError } = await supabase
    .from("provider_regions")
    .insert(attendingIds.map((regionId) => ({ provider_id: profile.id, region_id: regionId })));
  if (insertError) return { ok: false, message: insertError.message };

  revalidatePath("/prestador/regiao");
  revalidatePath("/prestador/dashboard");
  return { ok: true, message: "Região de atendimento salva com sucesso." };
}
