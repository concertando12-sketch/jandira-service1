"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createCategoryAction } from "@/lib/actions/admin-actions";

export function CreateCategoryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createCategoryAction(formData);
      setFeedback(result);
      if (result.ok) formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="cat-name">Nova categoria</Label>
        <Input id="cat-name" name="name" placeholder="Ex: Pets" required />
      </div>
      <div className="flex-1">
        <Label htmlFor="cat-description">Descrição (opcional)</Label>
        <Input id="cat-description" name="description" placeholder="Ex: Serviços para animais" />
      </div>
      <Button type="submit" disabled={pending} className="h-11">
        {pending ? "Criando…" : "Adicionar"}
      </Button>
      {feedback && (
        <p className={`text-sm sm:ml-2 ${feedback.ok ? "text-success" : "text-danger"}`}>
          {feedback.message}
        </p>
      )}
    </form>
  );
}
