"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCircle2, Clock, Copy, XCircle } from "lucide-react";
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
  pixQrDataUrl,
  pixCopyPaste,
  amount,
  isFreeTrial,
  freeTrialEndDate,
}: {
  isActive: boolean;
  activeUntil: string | null;
  latestStatus: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | null;
  latestRejectionReason: string | null;
  pixKey: string | null;
  pixReceiverName: string | null;
  pixQrDataUrl: string | null;
  pixCopyPaste: string | null;
  amount: number;
  isFreeTrial: boolean;
  freeTrialEndDate: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await uploadSubscriptionReceiptAction(formData);
      setFeedback(result);
      if (result.ok) formRef.current?.reset();
    });
  }

  async function copyText(text: string, mark: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text);
      mark(true);
      setTimeout(() => mark(false), 2500);
    } catch {
      // clipboard indisponível (ex: contexto não-seguro) — sem feedback
    }
  }

  const amountLabel = amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div>
      {isActive && (
        <Card className="mb-4 border-success/30 bg-success/10">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {activeUntil || !isFreeTrial ? "Assinatura ativa" : "Período de teste grátis"}
              </p>
              <p className="text-xs text-muted">
                {activeUntil
                  ? `Válida até ${formatDate(activeUntil)}.`
                  : isFreeTrial
                    ? `Grátis pra testar até ${formatDate(freeTrialEndDate)}. Depois disso, a assinatura de ${amountLabel}/mês passa a valer normalmente.`
                    : "Conta administrativa — sem cobrança."}
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
            <div className="mb-4 flex flex-col items-center gap-3 rounded-xl border border-border bg-surface-2 p-3 sm:flex-row sm:items-start">
              {pixQrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- data: URL, não vem de storage nenhum
                <img
                  src={pixQrDataUrl}
                  alt="QR Code PIX"
                  className="h-40 w-40 shrink-0 rounded-lg bg-white p-1.5"
                />
              )}
              <div className="min-w-0 text-center sm:text-left">
                <p className="text-xs uppercase tracking-wide text-muted">Chave PIX</p>
                <div className="mt-1 flex items-center justify-center gap-2 sm:justify-start">
                  <p className="break-all text-sm font-semibold text-foreground">{pixKey}</p>
                  <button
                    type="button"
                    onClick={() => pixKey && copyText(pixKey, setCopiedKey)}
                    aria-label="Copiar chave PIX"
                    className="shrink-0 rounded-lg border border-border p-1.5 text-muted transition-colors hover:border-brand/50 hover:text-brand"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                {copiedKey && <p className="mt-1 text-xs text-success">Chave copiada!</p>}
                {pixReceiverName && <p className="mt-1 text-xs text-muted">Recebedor: {pixReceiverName}</p>}
                {pixCopyPaste && (
                  <button
                    type="button"
                    onClick={() => copyText(pixCopyPaste, setCopiedFull)}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-brand/40 px-3 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/10 sm:w-auto"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedFull ? "Copiado!" : "Copiar código completo (Pix Copia e Cola)"}
                  </button>
                )}
                {pixQrDataUrl && (
                  <p className="mt-2 text-xs text-muted">
                    Escaneie o QR Code, ou cole o código completo no &quot;Pix Copia e Cola&quot; do seu banco.
                  </p>
                )}
              </div>
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
