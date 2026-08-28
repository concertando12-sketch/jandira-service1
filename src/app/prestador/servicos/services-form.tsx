"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { saveProviderServicesAction } from "@/lib/actions/provider-profile-actions";
import { ServiceCheckboxList, type CategoryWithServices } from "@/components/provider/service-checkbox-list";

export function ServicesForm({
  categories,
  defaultSelectedIds,
  allCategories,
}: {
  categories: CategoryWithServices[];
  defaultSelectedIds: string[];
  allCategories: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveProviderServicesAction(formData);
      setFeedback(result);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-6">
      <ServiceCheckboxList categories={categories} defaultSelectedIds={defaultSelectedIds} allCategories={allCategories} />

      {feedback && (
        <p className={`text-sm ${feedback.ok ? "text-success" : "text-danger"}`}>{feedback.message}</p>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando…" : "Salvar serviços"}
      </Button>
    </form>
  );
}
