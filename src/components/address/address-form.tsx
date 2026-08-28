"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { RegionSearchSelect } from "@/components/regions/region-search-select";
import type { RegionOption } from "@/components/regions/region-checkbox-list";
import { saveAddressAction } from "@/lib/actions/address-actions";
import { APP_CITY, APP_STATE } from "@/lib/constants";

export function AddressForm({
  path,
  regions,
  defaultRegionId,
  defaultStreet,
  defaultNumber,
  defaultComplement,
}: {
  path: string;
  regions: RegionOption[];
  defaultRegionId: string | null;
  defaultStreet: string | null;
  defaultNumber: string | null;
  defaultComplement: string | null;
}) {
  const [regionId, setRegionId] = useState<string | null>(defaultRegionId);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    if (!regionId) {
      setFeedback({ ok: false, message: "Selecione seu bairro." });
      return;
    }
    formData.set("region_id", regionId);
    startTransition(async () => {
      const result = await saveAddressAction(path, formData);
      setFeedback(result);
    });
  }

  return (
    <form action={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <div>
        <Label>Cidade</Label>
        <Input value={`${APP_CITY} - ${APP_STATE}`} disabled className="opacity-60" />
      </div>

      <div>
        <Label>Bairro</Label>
        <RegionSearchSelect
          regions={regions}
          value={regionId}
          onChange={(id) => setRegionId(id)}
        />
      </div>

      <div>
        <Label htmlFor="street">Endereço (rua/avenida)</Label>
        <Input id="street" name="street" defaultValue={defaultStreet ?? ""} placeholder="Ex: Rua das Flores" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="number">Número</Label>
          <Input id="number" name="number" defaultValue={defaultNumber ?? ""} placeholder="123" />
        </div>
        <div>
          <Label htmlFor="complement">Complemento (opcional)</Label>
          <Input
            id="complement"
            name="complement"
            defaultValue={defaultComplement ?? ""}
            placeholder="Apto, bloco…"
          />
        </div>
      </div>

      {feedback && (
        <p className={`text-sm ${feedback.ok ? "text-success" : "text-danger"}`}>{feedback.message}</p>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando…" : "Salvar endereço"}
      </Button>
    </form>
  );
}
