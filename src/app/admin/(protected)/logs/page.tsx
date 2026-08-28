import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";

// Log administrativo (item 40) — quem fez o quê. Sem filtros por
// enquanto, só o histórico mais recente.
export default async function AdminLogsPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("admin_logs")
    .select("id, action, target_type, description, created_at, users(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <PageHeader title="Log administrativo" description="Histórico de ações do painel" />

      {logs && logs.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Quando</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Ação</th>
                <th className="px-4 py-3 font-medium">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {new Date(l.created_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-foreground">{l.users?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{l.action}</td>
                  <td className="px-4 py-3 text-muted">{l.description ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="py-10 text-center text-sm text-muted">Nenhuma ação registrada ainda.</Card>
      )}
    </div>
  );
}
