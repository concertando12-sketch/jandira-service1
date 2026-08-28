"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { StarRating } from "@/components/ui/star-rating";
import { FavoriteButton } from "@/components/provider/favorite-button";
import { RegionSearchSelect } from "@/components/regions/region-search-select";
import type { RegionOption } from "@/components/regions/region-checkbox-list";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type ServiceOption = { id: string; name: string; slug: string; category_name: string | null };
type SearchResult = Database["public"]["Functions"]["search_providers"]["Returns"][number];

const PAGE_SIZE = 20;

export function BuscarForm({
  services,
  regions,
  initialServiceSlug,
  initialRegionId,
  initialRegionName,
  initialResults,
  initialFavoritedIds,
}: {
  services: ServiceOption[];
  regions: RegionOption[];
  initialServiceSlug: string;
  initialRegionId: string | null;
  initialRegionName: string | null;
  initialResults: SearchResult[] | null;
  initialFavoritedIds: string[];
}) {
  const [serviceSlug, setServiceSlug] = useState(initialServiceSlug);
  const [regionId, setRegionId] = useState<string | null>(initialRegionId);
  const [regionName, setRegionName] = useState<string | null>(initialRegionName);
  const [results, setResults] = useState<SearchResult[] | null>(initialResults);
  const [hasMore, setHasMore] = useState((initialResults?.length ?? 0) >= PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");

  const favoritedIds = useMemo(() => new Set(initialFavoritedIds), [initialFavoritedIds]);

  async function runSearch(slug: string, region: string) {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("search_providers", {
      p_service_slug: slug,
      p_region_id: region,
      p_limit: PAGE_SIZE,
      p_offset: 0,
    });
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setResults(data ?? []);
    setHasMore((data ?? []).length >= PAGE_SIZE);
  }

  async function loadMore() {
    if (!serviceSlug || !regionId || !results) return;
    setLoadingMore(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("search_providers", {
      p_service_slug: serviceSlug,
      p_region_id: regionId,
      p_limit: PAGE_SIZE,
      p_offset: results.length,
    });
    setLoadingMore(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setResults([...results, ...(data ?? [])]);
    setHasMore((data ?? []).length >= PAGE_SIZE);
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

  const filteredResults = useMemo(() => {
    if (!results) return null;
    return results.filter((r) => {
      if (minRating > 0 && r.rating_avg < minRating) return false;
      if (verifiedOnly && !r.is_verified) return false;
      if (maxPrice && r.price_from && Number(r.price_from) > Number(maxPrice)) return false;
      return true;
    });
  }, [results, minRating, verifiedOnly, maxPrice]);

  return (
    <div>
      {initialRegionName && (
        <p className="mb-4 text-xs text-muted">
          📍 Usando seu bairro salvo:{" "}
          <Link href="/cliente/endereco" className="text-brand hover:underline">
            {initialRegionName} (trocar)
          </Link>
        </p>
      )}

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
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {filteredResults && filteredResults.length > 0
                ? `${selectedService?.name ?? "Prestadores"} em ${regionName}`
                : `Nenhum prestador de ${selectedService?.name ?? "serviço"} encontrado em ${regionName} ainda`}
            </p>
            {results.length > 0 && (
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-brand"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filtros
              </button>
            )}
          </div>

          {showFilters && (
            <Card className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start">
              <div>
                <Label>Avaliação mínima</Label>
                <div className="flex gap-2">
                  {[0, 4, 4.5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setMinRating(v)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium",
                        minRating === v
                          ? "border-brand bg-brand text-brand-foreground"
                          : "border-border text-foreground hover:border-brand/50",
                      )}
                    >
                      {v === 0 ? "Todas" : `${v}+`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="maxPrice">Preço até (R$)</Label>
                <input
                  id="maxPrice"
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Sem limite"
                  className="h-9 w-32 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-brand"
                />
              </div>
              <label className="flex items-center gap-2 pt-6 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
                Somente verificados
              </label>
            </Card>
          )}

          {filteredResults && filteredResults.length === 0 && (
            <Card className="py-10 text-center text-sm text-muted">
              {results.length === 0
                ? "Assim que um prestador marcar esse bairro como atendido, ele aparece aqui automaticamente. Tente outro bairro ali em cima."
                : "Nenhum resultado com esses filtros — tente afrouxar um pouco."}
            </Card>
          )}

          <div className="flex flex-col gap-3">
            {filteredResults?.map((r) => {
              const otherRegions = r.other_regions ?? [];
              return (
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
                        <StarRating value={r.rating_avg} count={r.rating_count} />
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
                    {otherRegions.length > 0 && (
                      <p className="mt-1 text-xs text-muted">
                        Atende também: {otherRegions.slice(0, 2).join(", ")}
                        {otherRegions.length > 2 && ` +${otherRegions.length - 2}`}
                      </p>
                    )}
                    {r.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted">{r.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <FavoriteButton
                      providerId={r.provider_id}
                      initialFavorited={favoritedIds.has(r.provider_id)}
                      size="sm"
                    />
                    <Link
                      href={`/cliente/prestador/${r.provider_id}`}
                      className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-brand/50"
                    >
                      Ver perfil
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>

          {hasMore && filteredResults && filteredResults.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Button type="button" variant="secondary" size="sm" disabled={loadingMore} onClick={loadMore}>
                {loadingMore ? "Carregando…" : "Carregar mais"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
