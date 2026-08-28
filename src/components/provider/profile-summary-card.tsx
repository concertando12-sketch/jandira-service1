import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

// Card de resumo (leitura) pra informação que é editada em outra tela
// — endereço, regiões atendidas, serviços. Mantém a edição separada
// (decisão da Fase 3: "onde mora" ≠ "onde atende"), mas sem isso o
// perfil profissional parecia incompleto.
export function ProfileSummaryCard({
  title,
  editHref,
  editLabel = "Editar",
  children,
}: {
  title: string;
  editHref: string;
  editLabel?: string;
  children: ReactNode;
}) {
  return (
    <Card className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
        <Link href={editHref} className="text-xs font-semibold text-brand hover:underline">
          {editLabel}
        </Link>
      </div>
      {children}
    </Card>
  );
}
