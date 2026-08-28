"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createReviewAction } from "@/lib/actions/review-actions";
import { cn } from "@/lib/utils";

export function ReviewForm({
  serviceRequestId,
  providerId,
  onDone,
}: {
  serviceRequestId: string;
  providerId: string;
  onDone?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setFeedback({ ok: false, message: "Escolha de 1 a 5 estrelas." });
      return;
    }
    const formData = new FormData();
    formData.set("service_request_id", serviceRequestId);
    formData.set("provider_id", providerId);
    formData.set("rating", String(rating));
    formData.set("comment", comment);

    startTransition(async () => {
      const result = await createReviewAction(formData);
      setFeedback(result);
      if (result.ok) onDone?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-3">
      <p className="text-sm font-medium text-foreground">Como foi o serviço?</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${n} estrela(s)`}
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                n <= (hovered || rating) ? "fill-brand text-brand" : "text-muted",
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Conte como foi (opcional)"
        rows={2}
        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-brand"
      />
      {feedback && (
        <p className={`text-xs ${feedback.ok ? "text-success" : "text-danger"}`}>{feedback.message}</p>
      )}
      <Button type="submit" size="sm" disabled={pending} className="w-fit">
        {pending ? "Enviando…" : "Enviar avaliação"}
      </Button>
    </form>
  );
}
