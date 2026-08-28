"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/card";

export function ActiveToggleButton({
  id,
  isActive,
  onToggle,
}: {
  id: string;
  isActive: boolean;
  onToggle: (id: string, next: boolean) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => onToggle(id, !isActive))}
      className="disabled:opacity-50"
    >
      <Badge variant={isActive ? "success" : "muted"}>{isActive ? "Ativo" : "Inativo"}</Badge>
    </button>
  );
}
