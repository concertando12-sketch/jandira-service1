"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { suggestRegionAction } from "@/lib/actions/region-actions";

// "Não encontrou seu bairro?" — item 11 da Parte 2. Sempre disponível
// junto de qualquer seletor de região.
export function SuggestRegionForm() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await suggestRegionAction(formData);
      setFeedback(result);
      if (result.ok) formRef.current?.reset();
    });
  }

  if (feedback?.ok) {
    return (
      <p className="mt-3 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
        {feedback.message}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
      >
        <Plus className="h-3.5 w-3.5" />
        Não encontrou seu bairro? Adicionar outro
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-surface-2 p-3"
    >
      <p className="text-xs font-medium text-foreground">Qual é o nome do seu bairro?</p>
      <div className="flex gap-2">
        <Input name="name" placeholder="Ex: Jardim Europa" required className="h-10" />
        <Button type="submit" size="sm" disabled={pending} className="h-10 shrink-0">
          {pending ? "Enviando…" : "Enviar"}
        </Button>
      </div>
      {feedback && !feedback.ok && <p className="text-xs text-danger">{feedback.message}</p>}
    </form>
  );
}
