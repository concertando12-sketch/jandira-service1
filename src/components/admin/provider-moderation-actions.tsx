"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  approveProviderAction,
  rejectProviderAction,
  reactivateProviderAction,
  suspendProviderAction,
} from "@/lib/actions/admin-actions";
import type { ProviderStatus } from "@/lib/supabase/types";

type Mode = "idle" | "rejecting" | "suspending";

export function ProviderModerationActions({
  providerId,
  providerName,
  status,
}: {
  providerId: string;
  providerName: string;
  status: ProviderStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>("idle");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.message ?? null);
      else {
        setMode("idle");
        setReason("");
        router.refresh();
      }
    });
  }

  function handleReject() {
    if (!reason.trim()) {
      setError("Informe o motivo da recusa.");
      return;
    }
    run(() => rejectProviderAction(providerId, providerName, reason));
  }

  function handleSuspend() {
    if (!reason.trim()) {
      setError("Informe o motivo da suspensão.");
      return;
    }
    run(() => suspendProviderAction(providerId, providerName, reason));
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-danger">{error}</p>}

      {mode === "idle" && (
        <div className="flex flex-wrap gap-2">
          {status === "PENDING" && (
            <>
              <Button type="button" disabled={pending} onClick={() => run(() => approveProviderAction(providerId, providerName))}>
                ✓ Aprovar prestador
              </Button>
              <Button type="button" variant="outline" onClick={() => setMode("rejecting")}>
                Recusar
              </Button>
            </>
          )}
          {status === "APPROVED" && (
            <Button type="button" variant="danger" onClick={() => setMode("suspending")}>
              Suspender prestador
            </Button>
          )}
          {(status === "SUSPENDED" || status === "REJECTED") && (
            <Button
              type="button"
              disabled={pending}
              onClick={() => run(() => reactivateProviderAction(providerId, providerName))}
            >
              Reativar (aprovar)
            </Button>
          )}
        </div>
      )}

      {mode === "rejecting" && (
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Motivo da recusa</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="As informações enviadas precisam ser complementadas..."
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-brand"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="danger" disabled={pending} onClick={handleReject}>
              Confirmar recusa
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setMode("idle")}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {mode === "suspending" && (
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">Motivo da suspensão</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Descreva o motivo..."
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-brand"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="danger" disabled={pending} onClick={handleSuspend}>
              Confirmar suspensão
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setMode("idle")}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
