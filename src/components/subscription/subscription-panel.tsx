"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { uploadSubscriptionReceiptAction } from "@/lib/actions/subscription-actions";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

// Painel de assinatura mensal via PIX (Fase 9) — usado tanto por
// cliente quanto por prestador (é a mesma regra pros dois). Pagamento
// manual: mostra a chave PIX configurada pelo admin, a pessoa paga por
// fora e sobe o comprovante; fica pendente até o admin aprovar.
export function SubscriptionPanel({
  isActive,
  activeUntil,
  latestStatus,
  latestRejectionReason,
  pixKey,
  pixReceiverName,
  amount,
}: {
  isActive: boolean;
  activeUntil: string | null;
  latestStatus: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | null;
  latestRejectionReason: string | null;
  pixKey: string | null;
  pixReceiverName: string | null;
  amount: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await uploadSubscriptionReceiptAction(formData);
      setFeedback(result);
      if (result.ok) formRef.current?.reset();
    });
  }

  const amountLabel = amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div>
      {isActive && (
        <Card className="mb-4 border-success/30 bg-success/10">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            <div>
              <p className="text-sm font-semibold text-foreground">Assinatura ativa</p>
              <p className="text-xs text-muted">
                {activeUntil ? `Válida até ${formatDate(activeUntil)}.` : "Conta administrativa — sem cobrança."}
              </p>
            </div>
          </div>
        </Card>
      )}

      {!isActive && latestStatus === "PENDING_REVIEW" && !feedback?.ok && (
        <Card className="mb-4 border-brand/30 bg-brand/10">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 shrink-0 text-brand" />
            <div>
              <p className="text-sm font-semibold text-foreground">Comprovante em análise</p>
              <p className="text-xs text-muted">
                Assim que um admin confirmar o pagamento, sua assinatura fica ativa.
              </p>
            </div>
          </div>
        </Card>
      )}

      {!isActive && latestStatus === "REJECTED" && !feedback?.ok && (
        <Card className="mb-4 border-danger/30 bg-danger/10">
          <div className="flex items-start gap-2">
            <XCircle className="h-5 w-5 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-semibold text-foreground">Comprovante rejeitado</p>
              <p className="text-xs text-muted">
                {latestRejectionReason || "Motivo não informado."} Envie um novo comprovante abaixo.
              </p>
            </div>
          </div>
        </Card>
      )}

      {!isActive && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Pagar assinatura mensal</p>
            <Badge variant="brand">{amountLabel}/mês</Badge>
          </div>

          {pixKey ? (
            <div className="mb-4 rounded-xl border border-border bg-surface-2 p-3">
              <p className="text-xs uppercase tracking-wide text-muted">Chave PIX</p>
              <p className="mt-1 break-all text-sm font-semibold text-foreground">{pixKey}</p>
              {pixReceiverName && <p className="mt-1 text-xs text-muted">Recebedor: {pixReceiverName}</p>}
            </div>
          ) : (
            <p className="mb-4 text-sm text-muted">
              A chave PIX ainda não foi configurada pelo administrador. Tente novamente mais tarde.
            </p>
          )}

          <p className="mb-2 text-sm text-foreground">
            Depois de pagar, envie o comprovante abaixo (nome e CPF precisam bater com o seu cadastro).
          </p>

          <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
            <input
              type="file"
              name="receipt"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              required
              className="text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-foreground"
            />
            {feedback && (
              <p className={`text-sm ${feedback.ok ? "text-success" : "text-danger"}`}>{feedback.message}</p>
            )}
            <Button type="submit" disabled={pending} className="w-fit">
              {pending ? "Enviando…" : "Enviar comprovante"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
