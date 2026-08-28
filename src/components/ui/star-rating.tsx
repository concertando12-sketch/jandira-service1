import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Estrelas só de leitura (nota + card). Para escolher nota, ver
// review-form.tsx (interativo).
export function StarRating({
  value,
  count,
  size = "sm",
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span className="flex items-center gap-1 text-foreground">
      <Star className={cn(starSize, "fill-brand text-brand")} />
      <span className="font-medium">{value.toFixed(1)}</span>
      {typeof count === "number" && <span className="text-muted">({count})</span>}
    </span>
  );
}
