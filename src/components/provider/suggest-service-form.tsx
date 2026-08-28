"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { suggestServiceAction } from "@/lib/actions/provider-profile-actions";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "h-10 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none focus:border-brand",
);

// "Não achou seu serviço? Sugerir" — espelha SuggestRegionForm, mas
// aqui precisa de uma categoria (serviço sempre pertence a uma). Se
// nenhuma categoria servir, o prestador também pode sugerir uma nova
// — fica pendente igual o serviço, o admin aprova os dois juntos.
export function SuggestServiceForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [newCategory, setNewCategory] = useState(false);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await suggestServiceAction(formData);
      setFeedback(result);
      if (result.ok) {
        formRef.current?.reset();
        setNewCategory(false);
      }
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
        Não achou o seu serviço? Sugerir profissão
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-surface-2 p-3"
    >
      <p className="text-xs font-medium text-foreground">Qual é a profissão/serviço?</p>
      <Input name="name" placeholder="Ex: Jardineiro" required className="h-10" />

      {!newCategory ? (
        <>
          <select name="category_id" required defaultValue="" className={selectClass}>
            <option value="" disabled>
              Categoria mais próxima…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setNewCategory(true)}
            className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            Nenhuma categoria serve — sugerir uma nova
          </button>
        </>
      ) : (
        <>
          <Input name="new_category_name" placeholder="Nome da nova categoria" required className="h-10" />
          <button
            type="button"
            onClick={() => setNewCategory(false)}
            className="text-left text-xs text-muted hover:text-foreground"
          >
            Voltar a escolher uma categoria existente
          </button>
        </>
      )}

      <Button type="submit" size="sm" disabled={pending} className="h-10 shrink-0">
        {pending ? "Enviando…" : "Enviar sugestão"}
      </Button>
      {feedback && !feedback.ok && <p className="text-xs text-danger">{feedback.message}</p>}
    </form>
  );
}
