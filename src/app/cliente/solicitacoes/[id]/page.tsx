import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge } from "@/components/ui/card";
import { RequestDetailActions } from "@/components/client/request-detail-actions";
import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/lib/constants";

const STATUS_VARIANT: Record<RequestStatus, "default" | "brand" | "success" | "danger" | "muted"> = {
  PENDING: "brand",
  ACCEPTED: "success",
  DECLINED: "danger",
  SCHEDULED: "success",
  IN_PROGRESS: "success",
  COMPLETED: "success",
  CANCELLED: "muted",
};

export default async function SolicitacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("CLIENT");
  const { id } = await params;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("service_requests")
    .select(
      `id, status, description, street, number, complement, requested_date, requested_time,
       provider_price, provider_response, cancel_reason, created_at,
       services(name),
       provider_profiles(id, professional_name, whatsapp),
       regions(name),
       reviews(rating, comment)`,
    )
    .eq("id", id)
    .eq("client_id", user.id)
    .maybeSingle();

  if (!request) {
    return (
      <div>
        <Card className="py-14 text-center text-sm text-muted">
          Essa solicitação não existe ou não é sua.
        </Card>
      </div>
    );
  }

  const status = request.status as RequestStatus;
  const dateLabel = request.requested_date
    ? new Date(`${request.requested_date}T00:00:00`).toLocaleDateString("pt-BR")
    : null;

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/cliente/solicitacoes" className="mb-4 inline-block text-sm text-muted hover:text-brand">
        ← Meus pedidos
      </Link>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted">Solicitação #{request.id.slice(0, 8).toUpperCase()}</p>
            <p className="mt-1 text-lg font-bold text-foreground">{request.services?.name}</p>
            <p className="text-sm text-muted">{request.provider_profiles?.professional_name}</p>
          </div>
          <Badge variant={STATUS_VARIANT[status]}>{REQUEST_STATUS_LABELS[status]}</Badge>
        </div>

        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Região</dt>
            <dd className="text-foreground">{request.regions?.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Endereço</dt>
            <dd className="text-right text-foreground">
              {[request.street, request.number].filter(Boolean).join(", ")}
              {request.complement ? ` — ${request.complement}` : ""}
            </dd>
          </div>
          {dateLabel && (
            <div className="flex justify-between">
              <dt className="text-muted">Data</dt>
              <dd className="text-foreground">{dateLabel}</dd>
            </div>
          )}
          {request.requested_time && (
            <div className="flex justify-between">
              <dt className="text-muted">Horário</dt>
              <dd className="text-foreground">{request.requested_time.slice(0, 5)}</dd>
            </div>
          )}
          {request.provider_price && (
            <div className="flex justify-between">
              <dt className="text-muted">Valor combinado</dt>
              <dd className="font-semibold text-brand">
                R$ {Number(request.provider_price).toLocaleString("pt-BR")}
              </dd>
            </div>
          )}
        </dl>

        {request.description && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Descrição</p>
            <p className="mt-1 text-sm text-foreground">{request.description}</p>
          </div>
        )}

        {status === "DECLINED" && request.provider_response && (
          <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            Motivo da recusa: {request.provider_response}
          </p>
        )}

        {status === "CANCELLED" && request.cancel_reason && (
          <p className="mt-4 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-muted">
            Motivo do cancelamento: {request.cancel_reason}
          </p>
        )}
      </Card>

      {request.provider_profiles && (
        <RequestDetailActions
          requestId={request.id}
          status={status}
          providerId={request.provider_profiles.id}
          providerName={request.provider_profiles.professional_name}
          providerWhatsapp={request.provider_profiles.whatsapp}
          requestedDate={request.requested_date}
          requestedTime={request.requested_time}
          existingReview={request.reviews}
        />
      )}
    </div>
  );
}
