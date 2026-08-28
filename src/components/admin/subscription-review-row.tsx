"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { approveSubscriptionAction, rejectSubscriptionAction } from "@/lib/actions/admin-actions";

export function SubscriptionReviewRow({
  id,
  userName,
  userEmail,
  userCpf,
  amount,
  submittedAt,
  receiptSignedUrl,
}: {
  id: string;
  userName: string;
  userEmail: string;
  userCpf: string | null;
  amount: number;
  submittedAt: string;
  receiptSignedUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function approve() {
    startTransition(async () => {
      const result = await approveSubscriptionAction(id);
      if (!result.ok) setError(result.message);
      else router.refresh();
    });
  }

  function reject() {
    if (!reason.trim()) {
      setError("Informe o motivo da rejeição.");
      return;
    }
    startTransition(async () => {
      const result = await rejectSubscriptionAction(id, reason);
      if (!result.ok) setError(result.message);
      else router.refresh();
    });
  }

  const amountLabel = amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{userName}</p>
          <p className="text-xs text-muted">{userEmail}</p>
          <p className="text-xs text-muted">
            CPF cadastrado: <span className="font-medium text-foreground">{userCpf || "não informado"}</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            Enviado em {new Date(submittedAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <Badge variant="brand">{amountLabel}</Badge>
      </div>

      {receiptSignedUrl ? (
        <a
          href={receiptSignedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-fit items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:border-brand/50"
        >
          <FileText className="h-3.5 w-3.5" />
          Ver comprovante
        </a>
      ) : (
        <p className="text-xs text-danger">Não foi possível carregar o comprovante.</p>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      {!rejecting ? (
        <div className="flex gap-2">
          <Button type="button" size="sm" disabled={pending} onClick={approve}>
            Aprovar — nome/CPF conferem
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => setRejecting(true)}>
            Rejeitar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Ex: nome do comprovante não bate com o cadastro"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-brand"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="danger" disabled={pending} onClick={reject}>
              Confirmar rejeição
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setRejecting(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
