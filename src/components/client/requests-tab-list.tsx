"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RequestCard, type RequestCardData } from "./request-card";
import type { RequestStatus } from "@/lib/constants";

const TABS: { key: string; label: string; statuses: RequestStatus[] | null }[] = [
  { key: "all", label: "Todas", statuses: null },
  { key: "pending", label: "Pendentes", statuses: ["PENDING"] },
  { key: "accepted", label: "Aceitas", statuses: ["ACCEPTED"] },
  { key: "scheduled", label: "Agendadas", statuses: ["SCHEDULED"] },
  { key: "progress", label: "Em andamento", statuses: ["IN_PROGRESS"] },
  { key: "completed", label: "Concluídas", statuses: ["COMPLETED"] },
  { key: "cancelled", label: "Canceladas", statuses: ["CANCELLED", "DECLINED"] },
];

export function RequestsTabList({ requests }: { requests: RequestCardData[] }) {
  const [activeTab, setActiveTab] = useState("all");

  const filtered = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    if (!tab?.statuses) return requests;
    return requests.filter((r) => tab.statuses!.includes(r.status));
  }, [requests, activeTab]);

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              activeTab === tab.key
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border text-muted hover:border-brand/50 hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtered.map((r) => (
            <RequestCard key={r.id} data={r} />
          ))}
        </div>
      ) : (
        <Card className="py-14 text-center text-sm text-muted">Nada por aqui ainda.</Card>
      )}
    </div>
  );
}
