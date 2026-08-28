"use client";

import { SuggestServiceForm } from "./suggest-service-form";

export interface CategoryWithServices {
  id: string;
  name: string;
  services: { id: string; name: string }[];
}

// Catálogo agrupado por categoria (item 18-21 da Fase 1) — vem do
// admin, sem nada fixo em código.
export function ServiceCheckboxList({
  categories,
  defaultSelectedIds,
  allCategories,
}: {
  categories: CategoryWithServices[];
  defaultSelectedIds: string[];
  allCategories: { id: string; name: string }[];
}) {
  return (
    <div className="flex flex-col gap-5">
      {categories.map((cat) => (
        <div key={cat.id}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{cat.name}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {cat.services.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground hover:border-brand/50"
              >
                <input
                  type="checkbox"
                  name="service_ids"
                  value={s.id}
                  defaultChecked={defaultSelectedIds.includes(s.id)}
                  className="h-4 w-4 rounded border-border accent-[var(--brand)]"
                />
                {s.name}
              </label>
            ))}
          </div>
        </div>
      ))}

      <SuggestServiceForm categories={allCategories} />
    </div>
  );
}
