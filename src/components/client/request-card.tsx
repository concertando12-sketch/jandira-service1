import Link from "next/link";
import { Card, Badge } from "@/components/ui/card";
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

const STATUS_DOT: Record<RequestStatus, string> = {
  PENDING: "🟡",
  ACCEPTED: "🟢",
  DECLINED: "🔴",
  SCHEDULED: "🟢",
  IN_PROGRESS: "🟢",
  COMPLETED: "✅",
  CANCELLED: "⚪",
};

export interface RequestCardData {
  id: string;
  status: RequestStatus;
  serviceName: string;
  providerName: string;
  regionName: string | null;
  requestedDate: string | null;
  requestedTime: string | null;
}

// Card resumido da lista (item 10) — a ação de verdade fica na página
// de detalhe (item 11: /cliente/solicitacoes/[id]).
export function RequestCard({ data }: { data: RequestCardData }) {
  return (
    <Link href={`/cliente/solicitacoes/${data.id}`}>
      <Card className="flex flex-col gap-2 transition-colors hover:border-brand/50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">{data.serviceName}</p>
            <p className="text-sm text-muted">{data.providerName}</p>
          </div>
          <Badge variant={STATUS_VARIANT[data.status]}>
            {STATUS_DOT[data.status]} {REQUEST_STATUS_LABELS[data.status]}
          </Badge>
        </div>
        <p className="text-xs text-muted">
          📍 {data.regionName ?? "—"}
          {data.requestedDate &&
            ` · 📅 ${new Date(`${data.requestedDate}T00:00:00`).toLocaleDateString("pt-BR")}`}
          {data.requestedTime && ` · 🕐 ${data.requestedTime.slice(0, 5)}`}
        </p>
      </Card>
    </Link>
  );
}
