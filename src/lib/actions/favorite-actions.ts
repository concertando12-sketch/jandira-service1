"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export interface ToggleFavoriteResult {
  ok: boolean;
  favorited: boolean;
  message?: string;
}

// Favoritar/desfavoritar (item 26/27). Só cliente — o RLS também
// garante que cada um só mexe nos próprios favoritos.
export async function toggleFavoriteAction(providerId: string): Promise<ToggleFavoriteResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") {
    return { ok: false, favorited: false, message: "Apenas clientes podem favoritar." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("client_id", user.id)
    .eq("provider_id", providerId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
    if (error) return { ok: false, favorited: true, message: error.message };
    revalidatePath("/cliente/favoritos");
    revalidatePath(`/cliente/prestador/${providerId}`);
    return { ok: true, favorited: false };
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ client_id: user.id, provider_id: providerId });
  if (error) return { ok: false, favorited: false, message: error.message };

  revalidatePath("/cliente/favoritos");
  revalidatePath(`/cliente/prestador/${providerId}`);
  return { ok: true, favorited: true };
}
