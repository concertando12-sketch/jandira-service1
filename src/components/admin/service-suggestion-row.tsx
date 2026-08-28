"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { approveServiceSuggestionAction, rejectServiceSuggestionAction } from "@/lib/actions/admin-actions";

export function ServiceSuggestionRow({
  id,
  name,
  categoryName,
  submittedByName,
}: {
  id: string;
  name: string;
  categoryName: string | null;
  submittedByName: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [resolved, setResolved] = useState<"APPROVED" | "REJECTED" | null>(null);

  function approve() {
    startTransition(async () => {
      const result = await approveServiceSuggestionAction(id);
      if (result.ok) setResolved("APPROVED");
      setFeedback(result.message);
    });
  }

  function reject() {
    startTransition(async () => {
      const result = await rejectServiceSuggestionAction(id);
      if (result.ok) setResolved("REJECTED");
      setFeedback(result.message);
    });
  }

  if (resolved) {
    return (
      <Card className="flex items-center justify-between gap-3 opacity-60">
        <p className="text-sm text-foreground">{name}</p>
        <p className="text-xs text-muted">
          {resolved === "APPROVED" ? "Aprovado" : "Rejeitado"}
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted">
          {categoryName ? `Categoria sugerida: ${categoryName}` : "Sem categoria"}
          {submittedByName ? ` — sugerido por ${submittedByName}` : ""}
        </p>
        {feedback && <p className="text-xs text-danger">{feedback}</p>}
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={approve}>
          Aprovar
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={reject}>
          Rejeitar
        </Button>
      </div>
    </Card>
  );
}
