"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { RegionCheckboxList, type RegionOption } from "@/components/regions/region-checkbox-list";
import { saveProviderRegionsAction } from "@/lib/actions/region-actions";
import { cn } from "@/lib/utils";

export function ProviderRegionForm({
  regions,
  defaultHomeRegionId,
  defaultAttendingIds,
}: {
  regions: RegionOption[];
  defaultHomeRegionId: string | null;
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
        <Label htmlFor="home_region_id">Onde você mora? (opcional, só informativo)</Label>
        <select
          id="home_region_id"
          name="home_region_id"
          defaultValue={defaultHomeRegionId ?? ""}
          className={cn(
            "h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none focus:border-brand",
          )}
        >
          <option value="">Não informar</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>Também atendo</Label>
        <p className="mb-3 text-xs text-muted">
          Selecione todos os bairros onde você atende — não precisa ser só onde você mora.
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
