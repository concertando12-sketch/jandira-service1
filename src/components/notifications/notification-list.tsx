import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  service_request_id: string | null;
}

export function NotificationList({
  notifications,
  detailHrefBase,
  appendRequestId = true,
}: {
  notifications: NotificationItem[];
  detailHrefBase: string;
  /** Cliente tem página de detalhe por id; prestador ainda não — nesse
   * caso todas as notificações levam pro mesmo lugar (a lista). */
  appendRequestId?: boolean;
}) {
  if (notifications.length === 0) {
    return (
      <Card className="py-14 text-center text-sm text-muted">Nenhuma notificação ainda.</Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {notifications.map((n) => {
        const content = (
          <Card
            className={cn(
              "flex items-start gap-3 transition-colors",
              !n.is_read && "border-brand/40 bg-brand/5",
            )}
          >
            <span className="mt-1 text-lg">🔔</span>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{n.title}</p>
              <p className="mt-0.5 text-sm text-muted">{n.message}</p>
              <p className="mt-1.5 text-xs text-muted">
                {new Date(n.created_at).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
          </Card>
        );

        const href = n.service_request_id
          ? appendRequestId
            ? `${detailHrefBase}/${n.service_request_id}`
            : detailHrefBase
          : null;

        return href ? (
          <Link key={n.id} href={href}>
            {content}
          </Link>
        ) : (
          <div key={n.id}>{content}</div>
        );
      })}
    </div>
  );
}
