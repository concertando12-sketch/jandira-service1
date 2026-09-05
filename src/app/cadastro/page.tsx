import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { CadastroForm } from "./cadastro-form";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { APP_CITY, APP_STATE, ROLE_HOME } from "@/lib/constants";

export default async function CadastroPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.is_active ? ROLE_HOME[user.role] : "/bloqueado");
  }

  // Bairros carregados aqui (leitura pública, sem precisar de sessão)
  // pra já deixar a pessoa informar onde mora direto no cadastro —
  // sem isso, o endereço só tinha sido pedido depois, em
  // /cliente/endereco ou /prestador/endereco (Fase 3.1).
  const supabase = await createClient();
  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("name", APP_CITY)
    .eq("state", APP_STATE)
    .maybeSingle();

  const { data: regions } = city
    ? await supabase.from("regions").select("id, name").eq("city_id", city.id).eq("is_active", true).order("name")
    : { data: [] as { id: string; name: string }[] };

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Leva menos de um minuto"
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <CadastroForm regions={regions ?? []} />
      </Suspense>
    </AuthShell>
  );
}
