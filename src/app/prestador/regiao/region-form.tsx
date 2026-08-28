"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { RegionCheckboxList, type RegionOption } from "@/components/regions/region-checkbox-list";
import { saveProviderRegionsAction } from "@/lib/actions/region-actions";

export function ProviderRegionForm({
  regions,
  defaultAttendingIds,
}: {
  regions: RegionOption[];
  defaultAttendingIds: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveProviderRegionsAction(formData);
      setFeedback(result);
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-6">
      <div>
        <Label>Bairros que você atende</Label>
        <p className="mb-3 text-xs text-muted">
          Selecione quantos quiser — não precisa ser só onde você mora (isso fica em Meu
          endereço).
        </p>
        <RegionCheckboxList regions={regions} defaultSelectedIds={defaultAttendingIds} />
      </div>

      {feedback && (
        <p className={`text-sm ${feedback.ok ? "text-success" : "text-danger"}`}>{feedback.message}</p>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando…" : "Salvar região de atendimento"}
      </Button>
    </form>
  );
}
