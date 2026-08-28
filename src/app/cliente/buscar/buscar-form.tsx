"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, ShieldCheck, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { RegionSearchSelect } from "@/components/regions/region-search-select";
import type { RegionOption } from "@/components/regions/region-checkbox-list";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type ServiceOption = { id: string; name: string; slug: string; category_name: string | null };
type SearchResult = Database["public"]["Functions"]["search_providers"]["Returns"][number];

export function BuscarForm({
  services,
  regions,
}: {
  services: ServiceOption[];
  regions: RegionOption[];
}) {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("servico") ?? "";

  const [serviceSlug, setServiceSlug] = useState(initialSlug);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [regionName, setRegionName] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(slug: string, region: string) {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("search_providers", {
      p_service_slug: slug,
      p_region_id: region,
    });
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setResults(data ?? []);
  }

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!serviceSlug) {
      setError("Escolha um serviço.");
      return;
    }
    if (!regionId) {
      setError("Escolha um bairro.");
      return;
    }
    runSearch(serviceSlug, regionId);
  }

  const selectedService = services.find((s) => s.slug === serviceSlug);

  return (
    <div>
      <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="service">O que você precisa?</Label>
          <select
            id="service"
            value={serviceSlug}
            onChange={(e) => setServiceSlug(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none focus:border-brand"
          >
            <option value="">Selecione um serviço…</option>
            {services.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.category_name ? `${s.category_name} — ${s.name}` : s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <Label>Onde?</Label>
          <RegionSearchSelect
            regions={regions}
            value={regionId}
            onChange={(id, name) => {
              setRegionId(id);
              setRegionName(name);
              if (serviceSlug) runSearch(serviceSlug, id);
            }}
          />
        </div>

        <Button type="submit" disabled={loading} className="h-11 gap-2">
          <Search className="h-4 w-4" />
          {loading ? "Buscando…" : "Buscar"}
        </Button>
      </form>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {results !== null && (
        <div className="mt-8">
          <p className="mb-3 text-sm font-semibold text-foreground">
            {results.length > 0
              ? `${selectedService?.name ?? "Prestadores"} em ${regionName}`
              : `Nenhum prestador de ${selectedService?.name ?? "serviço"} encontrado em ${regionName} ainda`}
          </p>

          {results.length === 0 && (
            <Card className="py-10 text-center text-sm text-muted">
              Assim que um prestador marcar esse bairro como atendido, ele aparece aqui
              automaticamente.
            </Card>
          )}

          <div className="flex flex-col gap-3">
            {results.map((r) => (
              <Card key={r.provider_id} className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-2 text-lg font-bold text-brand">
                  {r.professional_name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{r.professional_name}</p>
                    {r.is_verified && (
                      <span className="flex items-center gap-0.5 text-xs font-medium text-brand">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verificado
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    {r.rating_count > 0 ? (
                      <span className="flex items-center gap-1 text-foreground">
                        <Star className="h-3.5 w-3.5 fill-brand text-brand" /> {r.rating_avg} (
                        {r.rating_count})
                      </span>
                    ) : (
                      <span>Sem avaliações ainda</span>
                    )}
                    {r.home_region_name && <span>📍 {r.home_region_name}</span>}
                    {r.price_from && (
                      <span>
                        💰 A partir de R$ {Number(r.price_from).toLocaleString("pt-BR")}
                      </span>
                    )}
                  </div>
                  {r.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{r.description}</p>
                  )}
                </div>
                <Link
                  href={`/cliente/prestador/${r.provider_id}`}
                  className={cn(
                    "shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-brand/50",
                  )}
                >
                  Ver perfil
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
