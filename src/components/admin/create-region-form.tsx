"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createRegionAction } from "@/lib/actions/admin-actions";

export function CreateRegionForm({ cityId }: { cityId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [showCoords, setShowCoords] = useState(false);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createRegionAction(formData);
      setFeedback(result);
      if (result.ok) {
        formRef.current?.reset();
        setShowCoords(false);
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="city_id" value={cityId} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="nb-name">Novo bairro</Label>
          <Input id="nb-name" name="name" placeholder="Ex: Jardim Europa" required />
        </div>
        <Button type="submit" disabled={pending} className="h-11 w-fit">
          {pending ? "Cadastrando…" : "+ Novo bairro"}
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setShowCoords((v) => !v)}
        className="w-fit text-xs font-medium text-muted hover:text-foreground"
      >
        {showCoords ? "Ocultar" : "Avançado: latitude/longitude (opcional, reservado p/ Google Maps futuro)"}
      </button>

      {showCoords && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="nb-lat">Latitude (opcional)</Label>
            <Input id="nb-lat" name="latitude" type="number" step="0.000001" placeholder="-23.527200" />
          </div>
          <div>
            <Label htmlFor="nb-lng">Longitude (opcional)</Label>
            <Input id="nb-lng" name="longitude" type="number" step="0.000001" placeholder="-46.904200" />
          </div>
        </div>
      )}

      {feedback && (
        <p className={`text-sm ${feedback.ok ? "text-success" : "text-danger"}`}>{feedback.message}</p>
      )}
    </form>
  );
}
