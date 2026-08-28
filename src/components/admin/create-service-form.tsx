"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createServiceAction } from "@/lib/actions/admin-actions";
import { cn } from "@/lib/utils";

export function CreateServiceForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createServiceAction(formData);
      setFeedback(result);
      if (result.ok) formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="svc-name">Novo serviço / profissão</Label>
          <Input id="svc-name" name="name" placeholder="Ex: Jardineiro" required />
        </div>
        <div>
          <Label htmlFor="svc-category">Categoria</Label>
          <select
            id="svc-category"
            name="category_id"
            required
            className={cn(
              "h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none focus:border-brand",
            )}
          >
            <option value="">Selecione…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="svc-description">Descrição (opcional)</Label>
          <Input id="svc-description" name="description" placeholder="Ex: Poda e jardinagem" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="h-11 w-fit">
          {pending ? "Criando…" : "Adicionar"}
        </Button>
        {feedback && (
          <p className={`text-sm ${feedback.ok ? "text-success" : "text-danger"}`}>{feedback.message}</p>
        )}
      </div>
    </form>
  );
}
