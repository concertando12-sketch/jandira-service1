"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

// "Ao abrir: is_read = true" (item 37). RLS já garante que só dá pra
// marcar como lida notificação do próprio usuário.
export async function markAllNotificationsReadAction(path: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  revalidatePath(path);
}
