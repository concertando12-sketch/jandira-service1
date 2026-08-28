"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProviderAvatar } from "@/components/provider/provider-avatar";
import {
  acceptServiceRequestAction,
  completeServiceRequestAction,
  declineServiceRequestAction,
  providerCancelServiceRequestAction,
  startServiceRequestAction,
} from "@/lib/actions/service-request-actions";
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

const DECLINE_REASONS = ["Não estou disponível", "Valor", "Distância/região", "Outro"];
const CANCEL_REASONS = ["Imprevisto", "Cliente não responde", "Conflito de agenda", "Outro"];

export interface ProviderRequestCardData {
  id: string;
  status: RequestStatus;
  serviceName: string;
  clientName: string;
  clientPhoto: string | null;
  regionName: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  requestedDate: string | null;
  requestedTime: string | null;
  description: string | null;
  providerPrice: number | null;
}

type Mode = "idle" | "accepting" | "declining" | "cancelling";

export function ProviderRequestCard({ data }: { data: ProviderRequestCardData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [price, setPrice] = useState("");
  const [reason, setReason] = useState("");

  function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.message ?? null);
      else {
        setMode("idle");
        router.refresh();
      }
    });
  }

  function handleAccept() {
    const value = Number(price.replace(",", "."));
    if (!value || value <= 0) {
      setError("Informe um valor válido.");
      return;
    }
    run(() => acceptServiceRequestAction(data.id, value));
  }

  function handleDecline() {
    if (!reason) {
      setError("Escolha um motivo.");
      return;
    }
    run(() => declineServiceRequestAction(data.id, reason));
  }

  function handleCancel() {
    if (!reason) {
      setError("Escolha um motivo.");
      return;
    }
    run(() => providerCancelServiceRequestAction(data.id, reason));
  }

  const addressLine = [data.street, data.number].filter(Boolean).join(", ");
  const address = data.complement ? `${addressLine} — ${data.complement}` : addressLine;

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ProviderAvatar photoUrl={data.clientPhoto} name={data.clientName} size="md" />
          <div>
            <p className="font-semibold text-foreground">{data.serviceName}</p>
            <p className="text-sm text-muted">👤 {data.clientName}</p>
          </div>
        </div>
        <Badge variant={STATUS_VARIANT[data.status]}>{REQUEST_STATUS_LABELS[data.status]}</Badge>
      </div>

      <p className="text-xs text-muted">
        📍 {data.regionName ?? "—"}
        {address && ` · ${address}`}
        {data.requestedDate &&
          ` · 📅 ${new Date(`${data.requestedDate}T00:00:00`).toLocaleDateString("pt-BR")}`}
        {data.requestedTime && ` · 🕐 ${data.requestedTime.slice(0, 5)}`}
      </p>

      {data.description && <p className="text-sm text-foreground">{data.description}</p>}

      {data.providerPrice && (
        <p className="text-sm font-semibold text-brand">
          R$ {Number(data.providerPrice).toLocaleString("pt-BR")}
        </p>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      {data.status === "PENDING" && mode === "idle" && (
        <div className="mt-1 flex gap-2">
          <Button type="button" size="sm" onClick={() => setMode("accepting")}>
            Aceitar
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setMode("declining")}>
            Recusar
          </Button>
        </div>
      )}

      {data.status === "PENDING" && mode === "accepting" && (
        <div className="mt-1 flex flex-col gap-2 rounded-xl border border-border bg-surface-2 p-3">
          <p className="text-sm font-medium text-foreground">Qual o valor do serviço?</p>
          <div className="flex gap-2">
            <Input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="R$ 150"
              inputMode="decimal"
              className="h-9"
            />
            <Button type="button" size="sm" disabled={pending} onClick={handleAccept}>
              Confirmar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setMode("idle")}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {data.status === "PENDING" && mode === "declining" && (
        <div className="mt-1 flex flex-col gap-2 rounded-xl border border-border bg-surface-2 p-3">
          <p className="text-sm font-medium text-foreground">Por que você vai recusar?</p>
          {DECLINE_REASONS.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name={`decline-${data.id}`}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="h-4 w-4 accent-[var(--brand)]"
              />
              {r}
            </label>
          ))}
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="danger" disabled={pending} onClick={handleDecline}>
              Confirmar recusa
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setMode("idle")}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      {data.status === "ACCEPTED" && (
        <p className="text-xs text-muted">Aguardando o cliente confirmar o serviço.</p>
      )}

      {data.status === "SCHEDULED" && mode === "idle" && (
        <div className="mt-1 flex gap-2">
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => run(() => startServiceRequestAction(data.id))}
          >
            Iniciar serviço
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setMode("cancelling")}>
            Cancelar
          </Button>
        </div>
      )}

      {data.status === "SCHEDULED" && mode === "cancelling" && (
        <div className="mt-1 flex flex-col gap-2 rounded-xl border border-border bg-surface-2 p-3">
          <p className="text-sm font-medium text-foreground">Por que precisa cancelar?</p>
          {CANCEL_REASONS.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name={`cancel-${data.id}`}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="h-4 w-4 accent-[var(--brand)]"
              />
              {r}
            </label>
          ))}
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="danger" disabled={pending} onClick={handleCancel}>
              Confirmar cancelamento
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setMode("idle")}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      {data.status === "IN_PROGRESS" && (
        <div className="mt-1">
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => run(() => completeServiceRequestAction(data.id))}
          >
            Finalizar serviço
          </Button>
        </div>
      )}
    </Card>
  );
}
