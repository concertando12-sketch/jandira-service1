"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface ClientRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  regionName: string | null;
  isActive: boolean;
  createdAt: string;
}

// Busca por nome/e-mail/telefone/bairro (item 6 da Fase 6) — filtro no
// que já foi carregado, sem round-trip novo (lista de clientes é
// pequena o suficiente pro MVP).
export function ClientSearchTable({ clients }: { clients: ClientRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.name, c.email, c.phone ?? "", c.regionName ?? ""].some((field) =>
        field.toLowerCase().includes(q),
      ),
    );
  }, [clients, query]);

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, e-mail, telefone, bairro…"
          className="pl-10"
        />
      </div>

      {filtered.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Bairro</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link href={`/admin/clientes/${c.id}`} className="hover:text-brand">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.email}</td>
                  <td className="px-4 py-3 text-muted">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{c.regionName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.isActive ? "success" : "danger"}>
                      {c.isActive ? "Ativo" : "Bloqueado"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="py-10 text-center text-sm text-muted">Nenhum cliente encontrado.</Card>
      )}
    </div>
  );
}
