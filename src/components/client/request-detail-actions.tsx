"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/components/provider/review-form";
import { StarRating } from "@/components/ui/star-rating";
import {
  cancelServiceRequestAction,
  confirmServiceRequestAction,
} from "@/lib/actions/service-request-actions";
import type { RequestStatus } from "@/lib/constants";

const CANCEL_REASONS = [
  "Não preciso mais",
  "Encontrei outro profissional",
  "Mudança de data",
  "Outro",
];

export function RequestDetailActions({
  requestId,
  status,
  providerId,
  providerName,
  providerWhatsapp,
  requestedDate,
  requestedTime,
  existingReview,
}: {
  requestId: string;
  status: RequestStatus;
  providerId: string;
  providerName: string;
  providerWhatsapp: string | null;
  requestedDate: string | null;
  requestedTime: string | null;
  existingReview: { rating: number; comment: string | null } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  function handleConfirm() {
    startTransition(async () => {
      const result = await confirmServiceRequestAction(requestId);
      if (!result.ok) setError(result.message ?? null);
      else router.refresh();
    });
  }

  function handleCancel() {
    if (!cancelReason) {
      setError("Escolha um motivo.");
      return;
    }
    startTransition(async () => {
      const result = await cancelServiceRequestAction(requestId, cancelReason);
      if (!result.ok) setError(result.message ?? null);
      else router.refresh();
    });
  }

  const dateLabel = requestedDate
    ? new Date(`${requestedDate}T00:00:00`).toLocaleDateString("pt-BR")
    : null;
  const whatsappHref = providerWhatsapp
    ? `https://wa.me/55${providerWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá, ${providerName}! Sou cliente do Jandira Service e fiz uma solicitação${
          dateLabel ? ` para o dia ${dateLabel}` : ""
        }${requestedTime ? ` às ${requestedTime.slice(0, 5)}` : ""}. Gostaria de combinar os detalhes do serviço.`,
      )}`
    : null;

  const canCancel = status === "PENDING" || status === "ACCEPTED" || status === "SCHEDULED";
  const showWhatsapp = status === "SCHEDULED" || status === "IN_PROGRESS" || status === "COMPLETED";

  return (
    <div className="mt-4 flex flex-col gap-3">
      {error && <p className="text-sm text-danger">{error}</p>}

      {status === "ACCEPTED" && (
        <Button type="button" disabled={pending} onClick={handleConfirm} className="w-full">
          Confirmar serviço
        </Button>
      )}

      {showWhatsapp && whatsappHref && (
        <Link
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          Falar com {providerName} no WhatsApp
        </Link>
      )}

      {status === "DECLINED" && (
        <Link
          href={`/cliente/buscar`}
          className="flex items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:border-brand/50"
        >
          Buscar outro prestador
        </Link>
      )}

      {status === "COMPLETED" &&
        (existingReview ? (
          <Card className="flex items-center gap-2">
            <span className="text-sm text-muted">Sua avaliação:</span>
            <StarRating value={existingReview.rating} />
          </Card>
        ) : (
          <ReviewForm serviceRequestId={requestId} providerId={providerId} onDone={() => router.refresh()} />
        ))}

      {canCancel && !showCancel && (
        <Button type="button" variant="outline" onClick={() => setShowCancel(true)}>
          Cancelar serviço
        </Button>
      )}

      {canCancel && showCancel && (
        <Card className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">Por que deseja cancelar?</p>
          <div className="flex flex-col gap-2">
            {CANCEL_REASONS.map((reason) => (
              <label key={reason} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="cancel_reason"
                  value={reason}
                  checked={cancelReason === reason}
                  onChange={() => setCancelReason(reason)}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
                {reason}
              </label>
            ))}
          </div>
          <Button type="button" variant="danger" size="sm" disabled={pending} onClick={handleCancel}>
            Confirmar cancelamento
          </Button>
        </Card>
      )}
    </div>
  );
}
