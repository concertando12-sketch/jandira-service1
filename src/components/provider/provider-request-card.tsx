"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  completeServiceRequestAction,
  respondServiceRequestAction,
} from "@/lib/actions/service-request-actions";
import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/lib/constants";

const STATUS_VARIANT: Record<RequestStatus, "default" | "brand" | "success" | "danger" | "muted"> = {
  PENDING: "brand",
  ACCEPTED: "success",
  DECLINED: "danger",
  IN_PROGRESS: "success",
  COMPLETED: "success",
  CANCELLED: "muted",
};

export interface ProviderRequestCardData {
  id: string;
  status: RequestStatus;
  serviceName: string;
  clientName: string;
  regionName: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  description: string | null;
}

export function ProviderRequestCard({ data }: { data: ProviderRequestCardData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function respond(decision: "ACCEPTED" | "DECLINED") {
    startTransition(async () => {
      const result = await respondServiceRequestAction(data.id, decision);
      if (!result.ok) setError(result.message ?? null);
      else router.refresh();
    });
  }

  function complete() {
    startTransition(async () => {
      const result = await completeServiceRequestAction(data.id);
      if (!result.ok) setError(result.message ?? null);
      else router.refresh();
    });
  }

  const addressLine = [data.street, data.number].filter(Boolean).join(", ");
  const address = data.complement ? `${addressLine} — ${data.complement}` : addressLine;

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{data.serviceName}</p>
          <p className="text-sm text-muted">👤 {data.clientName}</p>
        </div>
        <Badge variant={STATUS_VARIANT[data.status]}>{REQUEST_STATUS_LABELS[data.status]}</Badge>
      </div>

      <p className="text-xs text-muted">
        📍 {data.regionName ?? "—"}
        {address && ` · ${address}`}
        {data.preferredDate && ` · 📅 ${new Date(`${data.preferredDate}T00:00:00`).toLocaleDateString("pt-BR")}`}
        {data.preferredTime && ` · 🕐 ${data.preferredTime.slice(0, 5)}`}
      </p>

      {data.description && <p className="text-sm text-foreground">{data.description}</p>}

      {error && <p className="text-xs text-danger">{error}</p>}

      {data.status === "PENDING" && (
        <div className="mt-1 flex gap-2">
          <Button type="button" size="sm" disabled={pending} onClick={() => respond("ACCEPTED")}>
            Aceitar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => respond("DECLINED")}
          >
            Recusar
          </Button>
        </div>
      )}

      {(data.status === "ACCEPTED" || data.status === "IN_PROGRESS") && (
        <div className="mt-1">
          <Button type="button" size="sm" disabled={pending} onClick={complete}>
            Marcar como concluído
          </Button>
        </div>
      )}
    </Card>
  );
}
