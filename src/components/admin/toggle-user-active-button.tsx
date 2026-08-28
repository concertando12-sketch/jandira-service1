"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toggleUserActiveAction } from "@/lib/actions/admin-actions";

// Bloquear/desbloquear a CONTA (login) do usuário — item 8 da Fase 6.
// Pede confirmação porque é uma ação sensível ("não permitir alteração
// arbitrária de dados sensíveis sem confirmação").
export function ToggleUserActiveButton({
  userId,
  userName,
  isActive,
}: {
  userId: string;
  userName: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    startTransition(async () => {
      const result = await toggleUserActiveAction(userId, userName, !isActive);
      if (!result.ok) setError(result.message ?? null);
      else {
        setConfirming(false);
        router.refresh();
      }
    });
  }

  if (confirming) {
    return (
      <Card className="flex flex-col gap-2">
        <p className="text-sm text-foreground">
          {isActive
            ? `Bloquear o acesso de ${userName}? A pessoa não vai conseguir mais entrar no app.`
            : `Desbloquear o acesso de ${userName}?`}
        </p>
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={isActive ? "danger" : "primary"} disabled={pending} onClick={handleConfirm}>
            Confirmar
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            Cancelar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Button type="button" variant={isActive ? "danger" : "secondary"} size="sm" onClick={() => setConfirming(true)}>
      {isActive ? "Bloquear usuário" : "Desbloquear usuário"}
    </Button>
  );
}
