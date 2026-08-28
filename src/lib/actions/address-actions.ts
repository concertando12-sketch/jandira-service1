"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { APP_CITY, APP_STATE } from "@/lib/constants";
import type { ActionResult } from "./account-actions";

// Salva "onde você está" (Fase 3.1, item 2/5) — cidade fixa (só
// Jandira ativa por ora), bairro obrigatório, rua/número/complemento
// opcionais. Vale tanto pro CLIENTE quanto pro PRESTADOR: mesma tabela
// (user_addresses), um endereço principal por usuário no MVP.
export async function saveAddressAction(path: string, formData: FormData): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Você precisa estar logado." };

  const regionId = String(formData.get("region_id") ?? "");
  const street = String(formData.get("street") ?? "").trim();
  const number = String(formData.get("number") ?? "").trim();
  const complement = String(formData.get("complement") ?? "").trim();

  if (!regionId) return { ok: false, message: "Selecione seu bairro." };

  const supabase = await createClient();
  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("name", APP_CITY)
    .eq("state", APP_STATE)
    .maybeSingle();

  const { error } = await supabase.from("user_addresses").upsert(
    {
      user_id: user.id,
      city_id: city?.id ?? null,
      region_id: regionId,
      street: street || null,
      number: number || null,
      complement: complement || null,
      is_primary: true,
    },
    { onConflict: "user_id" },
  );

  if (error) return { ok: false, message: error.message };

  revalidatePath(path);
  revalidatePath("/cliente/dashboard");
  revalidatePath("/cliente/buscar");
  revalidatePath("/prestador/dashboard");
  return { ok: true, message: "Endereço salvo com sucesso." };
}
