"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "@/lib/actions/favorite-actions";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  providerId,
  initialFavorited,
  size = "md",
}: {
  providerId: string;
  initialFavorited: boolean;
  size?: "sm" | "md";
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !favorited;
    setFavorited(next); // otimista
    startTransition(async () => {
      const result = await toggleFavoriteAction(providerId);
      if (!result.ok) setFavorited(!next); // desfaz se der errado
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={favorited ? "Remover dos favoritos" : "Favoritar"}
      className={cn(
        "flex items-center justify-center rounded-full border border-border bg-surface transition-colors hover:border-brand/50 disabled:opacity-50",
        size === "sm" ? "h-8 w-8" : "h-10 w-10",
      )}
    >
      <Heart
        className={cn(size === "sm" ? "h-4 w-4" : "h-5 w-5", favorited && "fill-brand text-brand")}
        strokeWidth={2}
      />
    </button>
  );
}
