"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SuggestRegionForm } from "./suggest-region-form";
import { cn } from "@/lib/utils";

export interface RegionOption {
  id: string;
  name: string;
}

// Seleção múltipla de bairros que o prestador atende (item 7 da Parte
// 2). Checkboxes nativos (name="region_ids") para funcionar direto
// dentro de um <form action={serverAction}>. O filtro de busca só
// esconde/mostra itens — não desmonta, então a marcação não se perde.
export function RegionCheckboxList({
  regions,
  defaultSelectedIds = [],
}: {
  regions: RegionOption[];
  defaultSelectedIds?: string[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return regions;
    return regions.filter((r) => r.name.toLowerCase().includes(q));
  }, [regions, query]);

  return (
    <div>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar bairro…"
          className="pl-10"
        />
      </div>

      <div className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-xl border border-border bg-surface-2 p-2">
        {filtered.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-muted">Nenhum bairro encontrado.</p>
        )}
        {regions.map((region) => (
          <label
            key={region.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-surface",
              !filtered.some((r) => r.id === region.id) && "hidden",
            )}
          >
            <input
              type="checkbox"
              name="region_ids"
              value={region.id}
              defaultChecked={defaultSelectedIds.includes(region.id)}
              className="h-4 w-4 rounded border-border accent-[var(--brand)]"
            />
            <span className="text-foreground">{region.name}</span>
          </label>
        ))}
      </div>

      <SuggestRegionForm />
    </div>
  );
}
