/**
 * Seed de dados DEMO (item 48 da spec) — prestadores fictícios em
 * Jandira-SP para testar o fluxo ponta a ponta (item 49).
 *
 * Diferente de supabase/seed.sql (dados de referência puros), este
 * script cria CONTAS DE VERDADE no Supabase Auth — por isso roda em
 * Node com a service role key, não no SQL Editor.
 *
 * Pré-requisitos:
 *   1. supabase/schema.sql e supabase/seed.sql já rodados
 *   2. .env.local preenchido com NEXT_PUBLIC_SUPABASE_URL e
 *      SUPABASE_SERVICE_ROLE_KEY (Project Settings → API → service_role)
 *
 * Rodar:
 *   npm run seed:demo
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_CITY = process.env.NEXT_PUBLIC_APP_CITY ?? "Jandira";
const APP_STATE = process.env.NEXT_PUBLIC_APP_STATE ?? "SP";

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local.",
  );
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = "Demo123456!";

const DEMO_PROVIDERS = [
  {
    email: "ana.souza.demo@jendiraservice.com",
    name: "Ana Souza",
    phone: "(11) 90000-0001",
    professionalName: "Ana Souza",
    serviceSlug: "baba",
    neighborhood: "Novo Horizonte",
    description: "[DEMO] Babá com 8 anos de experiência, referências disponíveis.",
    priceFrom: 100,
    priceTo: 180,
    radiusKm: 5,
    verified: true,
  },
  {
    email: "carlos.oliveira.demo@jendiraservice.com",
    name: "Carlos Oliveira",
    phone: "(11) 90000-0002",
    professionalName: "Carlos Oliveira",
    serviceSlug: "eletricista",
    neighborhood: "Centro",
    description: "[DEMO] Eletricista predial e residencial, atendimento rápido.",
    priceFrom: 80,
    priceTo: 250,
    radiusKm: 8,
    verified: true,
  },
  {
    email: "maria.santos.demo@jendiraservice.com",
    name: "Maria Santos",
    phone: "(11) 90000-0003",
    professionalName: "Maria Santos",
    serviceSlug: "diarista",
    neighborhood: "Jardim Silveira",
    description: "[DEMO] Diarista de confiança, disponibilidade em dias úteis.",
    priceFrom: 120,
    priceTo: 150,
    radiusKm: 6,
    verified: false,
  },
  {
    email: "joao.pereira.demo@jendiraservice.com",
    name: "João Pereira",
    phone: "(11) 90000-0004",
    professionalName: "João Pereira",
    serviceSlug: "encanador",
    neighborhood: "Jardim Alvorada",
    description: "[DEMO] Encanador, conserto de vazamentos e instalações hidráulicas.",
    priceFrom: 90,
    priceTo: 200,
    radiusKm: 7,
    verified: true,
  },
];

const DEMO_CLIENT = {
  email: "cliente.teste.demo@jendiraservice.com",
  name: "Cliente Teste",
  phone: "(11) 90000-0000",
};

async function ensureAuthUser(params: {
  email: string;
  name: string;
  phone: string;
  role: "CLIENT" | "PROVIDER";
}) {
  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing.users.find((u) => u.email === params.email);
  if (found) {
    console.log(`  já existe: ${params.email}`);
    return found.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: params.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name: params.name, phone: params.phone, role: params.role },
  });

  if (error || !data.user) {
    throw new Error(`Erro ao criar ${params.email}: ${error?.message}`);
  }
  console.log(`  criado: ${params.email}`);
  return data.user.id;
}

async function main() {
  console.log(`Seed DEMO — ${APP_CITY}/${APP_STATE}\n`);

  const { data: city } = await admin
    .from("cities")
    .select("id")
    .eq("name", APP_CITY)
    .eq("state", APP_STATE)
    .single();

  if (!city) {
    throw new Error(
      `Cidade ${APP_CITY}/${APP_STATE} não encontrada. Rode supabase/seed.sql primeiro.`,
    );
  }

  console.log("Cliente demo:");
  await ensureAuthUser({ ...DEMO_CLIENT, role: "CLIENT" });

  console.log("\nPrestadores demo:");
  for (const provider of DEMO_PROVIDERS) {
    const userId = await ensureAuthUser({
      email: provider.email,
      name: provider.name,
      phone: provider.phone,
      role: "PROVIDER",
    });

    const { data: neighborhood } = await admin
      .from("neighborhoods")
      .select("id, latitude, longitude")
      .eq("city_id", city.id)
      .eq("name", provider.neighborhood)
      .single();

    if (!neighborhood) {
      console.warn(
        `  ! bairro "${provider.neighborhood}" não encontrado — pulando perfil de ${provider.name}`,
      );
      continue;
    }

    const { data: service } = await admin
      .from("services")
      .select("id")
      .eq("slug", provider.serviceSlug)
      .single();

    if (!service) {
      console.warn(`  ! serviço "${provider.serviceSlug}" não encontrado — pulando ${provider.name}`);
      continue;
    }

    const { data: profile, error: profileError } = await admin
      .from("provider_profiles")
      .upsert(
        {
          user_id: userId,
          professional_name: provider.professionalName,
          description: provider.description,
          phone: provider.phone,
          whatsapp: provider.phone,
          city_id: city.id,
          neighborhood_id: neighborhood.id,
          latitude: neighborhood.latitude,
          longitude: neighborhood.longitude,
          service_radius_km: provider.radiusKm,
          price_from: provider.priceFrom,
          price_to: provider.priceTo,
          is_active: true,
          is_verified: provider.verified,
          profile_completion: 100,
        },
        { onConflict: "user_id" },
      )
      .select("id")
      .single();

    if (profileError || !profile) {
      console.warn(`  ! erro ao salvar perfil de ${provider.name}: ${profileError?.message}`);
      continue;
    }

    await admin
      .from("provider_services")
      .upsert(
        { provider_id: profile.id, service_id: service.id },
        { onConflict: "provider_id,service_id" },
      );

    console.log(`  perfil publicado: ${provider.name} (${provider.serviceSlug} em ${provider.neighborhood})`);
  }

  console.log(`\nPronto. Login de qualquer conta demo: senha "${DEMO_PASSWORD}".`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
