import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Registro de ações administrativas (Fase 6, item 40) — "isso permite
// saber quem fez cada alteração". Chamado de dentro das próprias
// server actions de admin, depois que a mudança já foi salva.
export async function logAdminAction(
  supabase: SupabaseClient<Database>,
  adminId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  description?: string,
) {
  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    description: description ?? null,
  });
}
