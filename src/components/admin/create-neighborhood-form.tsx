"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createNeighborhoodAction } from "@/lib/actions/admin-actions";

export function CreateNeighborhoodForm({ cityId }: { cityId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createNeighborhoodAction(formData);
      setFeedback(result);
      if (result.ok) formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="city_id" value={cityId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="nb-name">Novo bairro</Label>
          <Input id="nb-name" name="name" placeholder="Ex: Jardim Europa" required />
        </div>
        <div>
          <Label htmlFor="nb-lat">Latitude</Label>
          <Input id="nb-lat" name="latitude" type="number" step="0.000001" placeholder="-23.527200" required />
        </div>
        <div>
          <Label htmlFor="nb-lng">Longitude</Label>
          <Input id="nb-lng" name="longitude" type="number" step="0.000001" placeholder="-46.904200" required />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="h-11 w-fit">
          {pending ? "Cadastrando…" : "Adicionar bairro"}
        </Button>
        {feedback && (
          <p className={`text-sm ${feedback.ok ? "text-success" : "text-danger"}`}>{feedback.message}</p>
        )}
      </div>
      <p className="text-xs text-muted">
        Sem Google Maps: pegue a latitude/longitude aproximada em qualquer serviço gratuito
        de coordenadas (ex: buscar &quot;lat long&quot; do bairro no navegador) e cole aqui.
      </p>
    </form>
  );
}
