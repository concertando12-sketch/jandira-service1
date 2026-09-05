"use client";

import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SuggestRegionForm } from "./suggest-region-form";
import { cn } from "@/lib/utils";
import type { RegionOption } from "./region-checkbox-list";

// Seleção de UM bairro (busca do cliente — item 8/9/18 da Parte 2). A
// filtragem acontece no array já carregado do banco, sem chamar
// nenhuma API externa.
export function RegionSearchSelect({
  regions,
  value,
  onChange,
  showSuggestion = true,
}: {
  regions: RegionOption[];
  value: string | null;
  onChange: (regionId: string, regionName: string) => void;
  // "Sugerir bairro" chama uma server action que exige login — em
  // telas sem sessão ainda (ex: cadastro) não faz sentido mostrar.
  showSuggestion?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return regions;
    return regions.filter((r) => r.name.toLowerCase().includes(q));
  }, [regions, query]);

  const selected = regions.find((r) => r.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center gap-2 rounded-xl border border-border bg-surface px-4 text-left text-sm text-foreground outline-none transition-colors focus:border-brand"
      >
        <MapPin className="h-4 w-4 shrink-0 text-brand" />
        <span className={cn(!selected && "text-muted")}>
          {selected ? selected.name : "Selecione seu bairro"}
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-border bg-surface p-3 shadow-xl">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar bairro…"
              className="pl-10"
            />
          </div>
          <div className="flex max-h-56 flex-col overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-muted">Nenhum bairro encontrado.</p>
            )}
            {filtered.map((region) => (
              <button
                key={region.id}
                type="button"
                onClick={() => {
                  onChange(region.id, region.name);
                  setOpen(false);
                  setQuery("");
                }}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-left text-sm hover:bg-surface-2",
                  region.id === value ? "bg-brand/15 text-brand" : "text-foreground",
                )}
              >
                {region.name}
              </button>
            ))}
          </div>
          {showSuggestion && <SuggestRegionForm />}
        </div>
      )}
    </div>
  );
}
