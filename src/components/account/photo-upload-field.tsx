"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";

// Botão circular de foto com preview local instantâneo (antes de
// salvar) — mesmo padrão já usado no perfil do prestador
// (prestador/perfil/profile-form.tsx), agora reaproveitado também
// pelo AccountForm (cliente e prestador usam o mesmo formulário de
// conta).
export function PhotoUploadField({
  initialPhoto,
  fallbackLetter,
}: {
  initialPhoto: string | null;
  fallbackLetter: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialPhoto);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-2 text-2xl font-bold text-brand"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- vem do Supabase Storage, sem domínio configurado pro next/image
          <img src={preview} alt="Foto de perfil" className="h-full w-full object-cover" />
        ) : (
          fallbackLetter?.toUpperCase() || "?"
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
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
