"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { updatePlatformSettingsAction } from "@/lib/actions/admin-actions";

export function PlatformSettingsForm({
  pixKey,
  pixReceiverName,
  subscriptionAmount,
}: {
  pixKey: string | null;
  pixReceiverName: string | null;
  subscriptionAmount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updatePlatformSettingsAction(formData);
      setFeedback(result);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="pix-key">Chave PIX</Label>
          <Input id="pix-key" name="pix_key" defaultValue={pixKey ?? ""} placeholder="CPF, e-mail, telefone…" />
        </div>
        <div>
          <Label htmlFor="pix-receiver">Nome do recebedor</Label>
          <Input
            id="pix-receiver"
            name="pix_receiver_name"
            defaultValue={pixReceiverName ?? ""}
            placeholder="Ex: Jandira Service"
          />
        </div>
        <div>
          <Label htmlFor="pix-amount">Valor da assinatura (R$)</Label>
          <Input
            id="pix-amount"
            name="subscription_amount"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={subscriptionAmount}
            required
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="h-11 w-fit">
          {pending ? "Salvando…" : "Salvar configuração de PIX"}
        </Button>
        {feedback && (
          <p className={`text-sm ${feedback.ok ? "text-success" : "text-danger"}`}>{feedback.message}</p>
        )}
      </div>
    </form>
  );
}
