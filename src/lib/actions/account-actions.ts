"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  ok: boolean;
  message: string;
}

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

  if (!name) return { ok: false, message: "Informe seu nome." };

  const { error } = await supabase
    .from("users")
    .update({ name, phone: phone || null })
    .eq("id", user.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath(path);
  return { ok: true, message: "Dados atualizados com sucesso." };
}
