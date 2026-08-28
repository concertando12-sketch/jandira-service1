"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { ReviewForm } from "@/components/provider/review-form";
import { cancelServiceRequestAction } from "@/lib/actions/service-request-actions";
import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/lib/constants";

const STATUS_VARIANT: Record<RequestStatus, "default" | "brand" | "success" | "danger" | "muted"> = {
  PENDING: "brand",
  ACCEPTED: "success",
  DECLINED: "danger",
  IN_PROGRESS: "success",
  COMPLETED: "success",
  CANCELLED: "muted",
};

const STATUS_DOT: Record<RequestStatus, string> = {
  PENDING: "🟡",
  ACCEPTED: "🟢",
  DECLINED: "🔴",
  IN_PROGRESS: "🟢",
  COMPLETED: "✅",
  CANCELLED: "⚪",
};

export interface RequestCardData {
  id: string;
  status: RequestStatus;
  serviceName: string;
  providerId: string;
  providerName: string;
  providerWhatsapp: string | null;
  regionName: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  description: string | null;
  createdAt: string;
  existingReview: { rating: number; comment: string | null } | null;
}

export function RequestCard({ data }: { data: RequestCardData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelServiceRequestAction(data.id);
      if (!result.ok) setError(result.message ?? null);
      else router.refresh();
    });
  }

  const whatsappHref = data.providerWhatsapp
    ? `https://wa.me/55${data.providerWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Olá, ${data.providerName}! Encontrei seu perfil no Jandira Service e minha solicitação foi aceita. Gostaria de combinar os detalhes do serviço.`,
      )}`
    : null;

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{data.serviceName}</p>
          <Link
            href={`/cliente/prestador/${data.providerId}`}
            className="text-sm text-muted hover:text-brand"
          >
            {data.providerName}
          </Link>
        </div>
        <Badge variant={STATUS_VARIANT[data.status]}>
          {STATUS_DOT[data.status]} {REQUEST_STATUS_LABELS[data.status]}
        </Badge>
      </div>

      <p className="text-xs text-muted">
        📍 {data.regionName ?? "—"}
        {data.preferredDate && ` · 📅 ${new Date(`${data.preferredDate}T00:00:00`).toLocaleDateString("pt-BR")}`}
        {data.preferredTime && ` · 🕐 ${data.preferredTime.slice(0, 5)}`}
      </p>

      {data.description && <p className="text-sm text-foreground">{data.description}</p>}

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="mt-1 flex flex-wrap items-center gap-2">
        {(data.status === "PENDING" || data.status === "ACCEPTED") && (
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={handleCancel}>
            Cancelar
          </Button>
        )}
        {data.status === "ACCEPTED" && whatsappHref && (
          <Link
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Falar no WhatsApp
          </Link>
        )}
        {data.status === "COMPLETED" &&
          (data.existingReview ? (
            <div className="flex items-center gap-2 text-xs text-muted">
              Sua avaliação: <StarRating value={data.existingReview.rating} />
            </div>
          ) : showReviewForm ? null : (
            <Button type="button" size="sm" onClick={() => setShowReviewForm(true)}>
              Avaliar
            </Button>
          ))}
      </div>

      {data.status === "COMPLETED" && !data.existingReview && showReviewForm && (
        <ReviewForm
          serviceRequestId={data.id}
          providerId={data.providerId}
          onDone={() => {
            setShowReviewForm(false);
            router.refresh();
          }}
        />
      )}
    </Card>
  );
}
