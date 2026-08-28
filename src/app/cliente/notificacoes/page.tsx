import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { NotificationList } from "@/components/notifications/notification-list";
import { MarkReadOnMount } from "@/components/notifications/mark-read-on-mount";

export default async function ClienteNotificacoesPage() {
  const user = await requireRole("CLIENT");
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, message, is_read, created_at, service_request_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const hasUnread = (notifications ?? []).some((n) => !n.is_read);

  return (
    <div>
      <PageHeader title="Notificações" description="Atualizações das suas solicitações" />
      <MarkReadOnMount path="/cliente/notificacoes" hasUnread={hasUnread} />
      <NotificationList notifications={notifications ?? []} detailHrefBase="/cliente/solicitacoes" />
    </div>
  );
}
