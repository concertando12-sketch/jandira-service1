"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PhotoUploadField } from "./photo-upload-field";
import { updateAccountAction } from "@/lib/actions/account-actions";

export function AccountForm({
  path,
  email,
  initialName,
  initialPhone,
  initialPhoto,
  showPhoto = false,
}: {
  path: string;
  email: string;
  initialName: string;
  initialPhone: string | null;
  initialPhoto?: string | null;
  // Prestador já tem foto própria em /prestador/perfil
  // (provider_profiles.profile_photo, pública) — não duplica aqui.
  // Cliente não tem outro lugar pra isso, então mostra.
  showPhoto?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateAccountAction(path, formData);
      setFeedback(result);
    });
  }

  return (
    <form action={handleSubmit} className="flex max-w-md flex-col gap-4">
      {showPhoto && (
        <PhotoUploadField initialPhoto={initialPhoto ?? null} fallbackLetter={initialName.charAt(0)} />
      )}

      <div>
        <Label htmlFor="name">Nome completo</Label>
        <Input id="name" name="name" defaultValue={initialName} required />
      </div>

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" value={email} disabled className="opacity-60" />
      </div>

      <div>
        <Label htmlFor="phone">Telefone / WhatsApp</Label>
        <Input id="phone" name="phone" defaultValue={initialPhone ?? ""} placeholder="(11) 90000-0000" />
      </div>

      {feedback && (
        <p className={`text-sm ${feedback.ok ? "text-success" : "text-danger"}`}>
          {feedback.message}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando…" : "Salvar alterações"}
      </Button>
    </form>
  );
}
