/**
 * Remove as contas DEMO criadas por scripts/seed-demo.ts — o app já
 * está em produção com contas reais, então não faz mais sentido
 * manter os prestadores/cliente fictícios.
 *
 * Só apaga contas cujo e-mail termina em @jandiraservice.com — é o
 * domínio fictício usado EXCLUSIVAMENTE pelo seed-demo.ts (nenhuma
 * conta real usa esse domínio). Contas reais nunca são tocadas.
 *
 * Apaga via Auth Admin API (não SQL direto) — isso já cuida de
 * cascatear a remoção em public.users, provider_profiles,
 * subscriptions, etc. (todas as FKs já são ON DELETE CASCADE).
 *
 * Rodar:
 *   npm run cleanup:demo
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_DOMAIN = "@jandiraservice.com";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local.");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`Buscando contas demo (e-mail terminando em ${DEMO_DOMAIN})...\n`);

  let page = 1;
  const demoUsers: { id: string; email: string }[] = [];
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const u of data.users) {
      if (u.email?.toLowerCase().endsWith(DEMO_DOMAIN)) {
        demoUsers.push({ id: u.id, email: u.email });
      }
    }
    if (data.users.length < 200) break;
    page++;
  }

  if (demoUsers.length === 0) {
    console.log("Nenhuma conta demo encontrada. Nada pra fazer.");
    return;
  }

  console.log(`Encontradas ${demoUsers.length} contas demo:`);
  demoUsers.forEach((u) => console.log(`  - ${u.email}`));
  console.log("\nApagando...\n");

  let ok = 0;
  for (const u of demoUsers) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) {
      console.warn(`  ! erro ao apagar ${u.email}: ${error.message}`);
    } else {
      console.log(`  apagada: ${u.email}`);
      ok++;
    }
  }

  console.log(`\nPronto — ${ok}/${demoUsers.length} contas demo removidas.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
