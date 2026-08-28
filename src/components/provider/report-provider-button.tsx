"use client";

import { useState, useTransition } from "react";
import { Flag, MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createReportAction } from "@/lib/actions/report-actions";

const REASONS = ["Perfil falso", "Comportamento inadequado", "Serviço ruim", "Fraude", "Outro"];

export function ReportProviderButton({ reportedUserId }: { reportedUserId: string }) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setFeedback({ ok: false, message: "Escolha um motivo." });
      return;
    }
    const formData = new FormData();
    formData.set("reported_user_id", reportedUserId);
    formData.set("reason", reason);
    formData.set("description", description);
    startTransition(async () => {
      const result = await createReportAction(formData);
      setFeedback(result);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mais opções"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted hover:border-brand/50 hover:text-foreground"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    );
  }

  if (!showForm) {
    return (
      <Card className="flex items-center gap-2 py-2">
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm text-danger"
        >
          <Flag className="h-3.5 w-3.5" />
          Denunciar
        </button>
        <button type="button" onClick={() => setOpen(false)} className="ml-auto text-xs text-muted">
          Fechar
        </button>
      </Card>
    );
  }

  if (feedback?.ok) {
    return (
      <Card className="py-3 text-center text-sm text-success">{feedback.message}</Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-foreground">Por que você está denunciando?</p>
        {REASONS.map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              name="report_reason"
              checked={reason === r}
              onChange={() => setReason(r)}
              className="h-4 w-4 accent-[var(--brand)]"
            />
            {r}
          </label>
        ))}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o ocorrido (opcional)"
          rows={2}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-brand"
        />
        {feedback && !feedback.ok && <p className="text-xs text-danger">{feedback.message}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" variant="danger" disabled={pending}>
            Enviar denúncia
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
