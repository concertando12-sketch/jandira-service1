import { MessageCircle } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, Badge } from "@/components/ui/card";
import { CopyButton } from "@/components/admin/copy-whatsapp-button";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { UserRole } from "@/lib/constants";

// Contatos WhatsApp (Fase 10) — todo mundo que se cadastrou e colocou
// WhatsApp, separado por papel, pra o admin montar grupo de avisos
// (cliente e prestador). O WhatsApp não deixa criar grupo já com todo
// mundo dentro por um link — o jeito é copiar os números e adicionar
// manualmente ao criar o grupo, por isso o botão "copiar todos".
export default async function AdminContatosPage() {
  await requireRole("ADMIN");
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, name, phone, role, is_active, created_at")
    .in("role", ["CLIENT", "PROVIDER"])
    .not("phone", "is", null)
    .neq("phone", "")
    .order("created_at", { ascending: false });

  const clients = (users ?? []).filter((u) => u.role === "CLIENT");
  const providers = (users ?? []).filter((u) => u.role === "PROVIDER");

  return (
    <div>
      <PageHeader
        title="Contatos"
        description="Quem já colocou WhatsApp no cadastro — copia os números pra montar um grupo de avisos."
      />

      <ContactGroup title="Clientes" people={clients} />
      <ContactGroup title="Prestadores" people={providers} />
    </div>
  );
}

function ContactGroup({
  title,
  people,
}: {
  title: string;
  people: { id: string; name: string; phone: string | null; role: UserRole; is_active: boolean }[];
}) {
  const allNumbers = people.map((p) => p.phone).filter(Boolean).join(", ");

  return (
    <div className="mt-6 first:mt-0">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          {title} <span className="font-normal text-muted">({people.length})</span>
        </p>
        {people.length > 0 && (
          <CopyButton text={allNumbers} label={`Copiar todos os números`} copiedLabel="Números copiados!" />
        )}
      </div>

      {people.length > 0 ? (
        <div className="flex flex-col gap-2">
          {people.map((p) => {
            const link = buildWhatsAppLink(p.phone, `Olá, ${p.name.split(" ")[0]}! Aqui é da Jandira Service.`);
            return (
              <Card key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{p.name || "—"}</p>
                    {!p.is_active && <Badge variant="danger">Bloqueado</Badge>}
                  </div>
                  <p className="text-xs text-muted">{p.phone}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {p.phone && <CopyButton text={p.phone} label="Copiar" />}
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success transition-colors hover:border-success/50"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Abrir
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="py-8 text-center text-sm text-muted">
          Ninguém dessa categoria com WhatsApp cadastrado ainda.
        </Card>
      )}
    </div>
  );
}
