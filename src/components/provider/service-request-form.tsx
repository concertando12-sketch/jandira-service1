"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createServiceRequestAction } from "@/lib/actions/service-request-actions";
import { cn } from "@/lib/utils";

type ServiceOption = { id: string; name: string };
type RegionOption = { id: string; name: string };

export function ServiceRequestForm({
  providerId,
  services,
  regions,
  defaultRegionId,
  defaultStreet,
  defaultNumber,
  defaultComplement,
}: {
  providerId: string;
  services: ServiceOption[];
  regions: RegionOption[];
  defaultRegionId: string | null;
  defaultStreet: string | null;
  defaultNumber: string | null;
  defaultComplement: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    formData.set("provider_id", providerId);
    startTransition(async () => {
      const result = await createServiceRequestAction(formData);
      setFeedback(result);
      if (result.ok) {
        router.push("/cliente/solicitacoes");
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="service_id">Serviço</Label>
        <select
          id="service_id"
          name="service_id"
          required
          defaultValue={services.length === 1 ? services[0].id : ""}
          className={cn(
            "h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none focus:border-brand",
          )}
        >
          <option value="" disabled>
            Selecione…
          </option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="region_id">Região</Label>
        <select
          id="region_id"
          name="region_id"
          required
          defaultValue={defaultRegionId ?? ""}
          className={cn(
            "h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none focus:border-brand",
          )}
        >
          <option value="" disabled>
            Selecione…
          </option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="street">Endereço (rua/avenida)</Label>
        <Input id="street" name="street" defaultValue={defaultStreet ?? ""} required placeholder="Rua das Flores" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="number">Número</Label>
          <Input id="number" name="number" defaultValue={defaultNumber ?? ""} required placeholder="123" />
        </div>
        <div>
          <Label htmlFor="complement">Complemento</Label>
          <Input id="complement" name="complement" defaultValue={defaultComplement ?? ""} placeholder="Opcional" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="preferred_date">Data (opcional)</Label>
          <Input id="preferred_date" name="preferred_date" type="date" />
        </div>
        <div>
          <Label htmlFor="preferred_time">Horário (opcional)</Label>
          <Input id="preferred_time" name="preferred_time" type="time" />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descreva o que você precisa</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Ex: preciso de uma babá das 8h às 18h, um bebê de 1 ano..."
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-brand"
        />
      </div>

      {feedback && !feedback.ok && <p className="text-sm text-danger">{feedback.message}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando…" : "Enviar solicitação"}
      </Button>
    </form>
  );
}
