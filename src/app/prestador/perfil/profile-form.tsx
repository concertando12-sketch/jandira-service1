"use client";

import { useRef, useState, useTransition } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { updateProviderProfileAction } from "@/lib/actions/provider-profile-actions";

export function ProfileForm({
  initialPhoto,
  initialProfessionalName,
  initialDescription,
  initialPriceFrom,
  initialPriceTo,
  initialAvailability,
  initialWhatsapp,
}: {
  initialPhoto: string | null;
  initialProfessionalName: string;
  initialDescription: string | null;
  initialPriceFrom: number | null;
  initialPriceTo: number | null;
  initialAvailability: string | null;
  initialWhatsapp: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialPhoto);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProviderProfileAction(formData);
      setFeedback(result);
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-2 text-2xl font-bold text-brand"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Foto de perfil" className="h-full w-full object-cover" />
          ) : (
            initialProfessionalName?.charAt(0)?.toUpperCase() || "?"
          )}
          <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <Camera className="h-3.5 w-3.5" />
          </span>
        </button>
        <div>
          <p className="text-sm font-medium text-foreground">Foto de perfil</p>
          <p className="text-xs text-muted">JPG, PNG ou WebP, até 5MB.</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
          className="hidden"
        />
      </div>

      <div>
        <Label htmlFor="professional_name">Nome profissional</Label>
        <Input
          id="professional_name"
          name="professional_name"
          defaultValue={initialProfessionalName}
          required
          placeholder="Como os clientes vão te ver"
        />
      </div>

      <div>
        <Label htmlFor="description">Sobre você</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={initialDescription ?? ""}
          rows={4}
          placeholder="Conte sua experiência, especialidades..."
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-brand"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price_from">A partir de (R$)</Label>
          <Input
            id="price_from"
            name="price_from"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialPriceFrom ?? ""}
            placeholder="100"
          />
        </div>
        <div>
          <Label htmlFor="price_to">Até (R$, opcional)</Label>
          <Input
            id="price_to"
            name="price_to"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialPriceTo ?? ""}
            placeholder="200"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="availability">Disponibilidade</Label>
        <Input
          id="availability"
          name="availability"
          defaultValue={initialAvailability ?? ""}
          placeholder="Ex: Seg a sex, 8h às 18h"
        />
      </div>

      <div>
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          defaultValue={initialWhatsapp ?? ""}
          placeholder="(11) 90000-0000"
        />
        <p className="mt-1 text-xs text-muted">
          Contato de referência no seu cadastro (não aparece publicamente — dúvidas de cliente
          e prestador vão pelo suporte).
        </p>
      </div>

      {feedback && (
        <p className={`text-sm ${feedback.ok ? "text-success" : "text-danger"}`}>{feedback.message}</p>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando…" : "Salvar perfil"}
      </Button>
    </form>
  );
}
