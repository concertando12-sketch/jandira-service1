"use client";

import { useMemo, useState } from "react";
import { Card, Badge } from "@/components/ui/card";
import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<RequestStatus, "default" | "brand" | "success" | "danger" | "muted"> = {
  PENDING: "brand",
  ACCEPTED: "default",
  DECLINED: "danger",
  SCHEDULED: "success",
  IN_PROGRESS: "success",
  COMPLETED: "success",
  CANCELLED: "muted",
};

export interface AdminRequestRow {
  id: string;
  status: RequestStatus;
  serviceName: string | null;
  clientName: string | null;
  providerName: string | null;
  regionName: string | null;
  price: number | null;
  createdAt: string;
}

// Filtro por status (item 28) — client-side, dataset de admin é
// pequeno o suficiente pro MVP.
export function AdminRequestsTable({ requests }: { requests: AdminRequestRow[] }) {
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    if (status === "all") return requests;
    return requests.filter((r) => r.status === status);
  }, [requests, status]);

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {["all", ...Object.keys(REQUEST_STATUS_LABELS)].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              status === s
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border text-muted hover:border-brand/50 hover:text-foreground",
            )}
          >
            {s === "all" ? "Todas" : REQUEST_STATUS_LABELS[s as RequestStatus]}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Serviço</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Prestador</th>
                <th className="px-4 py-3 font-medium">Bairro</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{r.serviceName}</td>
                  <td className="px-4 py-3 text-muted">{r.clientName}</td>
                  <td className="px-4 py-3 text-muted">{r.providerName}</td>
                  <td className="px-4 py-3 text-muted">{r.regionName ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    {r.price ? `R$ ${Number(r.price).toLocaleString("pt-BR")}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[r.status] ?? "default"}>
                      {REQUEST_STATUS_LABELS[r.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="py-10 text-center text-sm text-muted">Nenhuma solicitação com esse status.</Card>
      )}
    </div>
  );
}
