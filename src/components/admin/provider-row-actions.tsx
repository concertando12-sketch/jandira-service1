"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  toggleProviderActiveAction,
  toggleProviderVerifiedAction,
} from "@/lib/actions/admin-actions";

export function ProviderRowActions({
  id,
  isActive,
  isVerified,
}: {
  id: string;
  isActive: boolean;
  isVerified: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant={isVerified ? "secondary" : "outline"}
        disabled={pending}
        onClick={() => startTransition(() => toggleProviderVerifiedAction(id, !isVerified))}
      >
        {isVerified ? "Remover verificação" : "Verificar"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={isActive ? "danger" : "secondary"}
        disabled={pending}
        onClick={() => startTransition(() => toggleProviderActiveAction(id, !isActive))}
      >
        {isActive ? "Bloquear" : "Publicar"}
      </Button>
    </div>
  );
}
