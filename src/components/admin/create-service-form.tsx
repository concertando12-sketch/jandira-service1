"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createServiceAction, createCategoryAction } from "@/lib/actions/admin-actions";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none focus:border-brand",
);

export function CreateServiceForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  // Categorias criadas na hora (via "+ Nova categoria" abaixo) entram
  // aqui pra já aparecer no dropdown sem precisar recarregar a página.
  const [localCategories, setLocalCategories] = useState(categories);
  const [categoryId, setCategoryId] = useState("");

  const [showNewCategory, setShowNewCategory] = useState(false);
  const newCategoryFormRef = useRef<HTMLFormElement>(null);
  const [newCategoryPending, startNewCategoryTransition] = useTransition();
  const [newCategoryFeedback, setNewCategoryFeedback] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createServiceAction(formData);
      setFeedback(result);
      if (result.ok) {
        formRef.current?.reset();
        setCategoryId("");
      }
    });
  }

  function handleCreateCategory(formData: FormData) {
    startNewCategoryTransition(async () => {
      const result = await createCategoryAction(formData);
      setNewCategoryFeedback(result);
      if (result.ok && result.categoryId) {
        const name = String(formData.get("name") ?? "").trim();
        setLocalCategories((prev) => [...prev, { id: result.categoryId!, name }]);
        setCategoryId(result.categoryId);
        newCategoryFormRef.current?.reset();
        setShowNewCategory(false);
        setNewCategoryFeedback(null);
      }
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
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={selectClass}
          >
            <option value="">Selecione…</option>
            {localCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {!showNewCategory ? (
            <button
              type="button"
              onClick={() => setShowNewCategory(true)}
              className="mt-1.5 flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova categoria
            </button>
          ) : (
            <div className="mt-2 flex flex-col gap-2 rounded-xl border border-border bg-surface-2 p-3">
              <form ref={newCategoryFormRef} action={handleCreateCategory} className="flex flex-col gap-2">
                <Input name="name" placeholder="Nome da categoria" required className="h-9" />
                <Input name="description" placeholder="Descrição (opcional)" className="h-9" />
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm" disabled={newCategoryPending} className="h-9">
                    {newCategoryPending ? "Criando…" : "Criar categoria"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(false)}
                    className="text-xs text-muted hover:text-foreground"
                  >
                    Cancelar
                  </button>
                </div>
                {newCategoryFeedback && !newCategoryFeedback.ok && (
                  <p className="text-xs text-danger">{newCategoryFeedback.message}</p>
                )}
              </form>
            </div>
          )}
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
