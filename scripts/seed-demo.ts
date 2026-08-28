/**
 * Seed de dados DEMO (item 48 da spec) — prestadores fictícios em
 * Jandira-SP para testar o fluxo ponta a ponta (item 49).
 *
 * Diferente de supabase/seed.sql (dados de referência puros), este
 * script cria CONTAS DE VERDADE no Supabase Auth — por isso roda em
 * Node com a service role key, não no SQL Editor.
 *
 * Cobertura: 4 prestadores "curados" (com bio/preço pensados pro
 * roteiro de teste da spec) + 1 prestador genérico pra CADA outra
 * profissão ativa no catálogo (busca em `services`, não é lista fixa —
 * cobre também profissões aprovadas depois via sugestão). Os bairros
 * são distribuídos em rodízio entre todos os `regions` ativos, pra dar
 * pra testar busca/match regional em qualquer bairro.
 *
 * Pré-requisitos:
 *   1. supabase/schema.sql e supabase/seed.sql já rodados
 *   2. .env.local preenchido com NEXT_PUBLIC_SUPABASE_URL e
 *      SUPABASE_SERVICE_ROLE_KEY (Project Settings → API → service_role)
 *
 * Rodar:
 *   npm run seed:demo
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// dotenv/config sozinho só carrega .env — o projeto usa .env.local
// (padrão do Next.js), então precisa apontar pro arquivo certo.
config({ path: ".env.local" });

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

interface DemoProvider {
  email: string;
  name: string;
  phone: string;
  professionalName: string;
  serviceSlug: string;
  homeRegion: string;
  street: string;
  number: string;
  attends: string[];
  description: string;
  priceFrom: number;
  priceTo: number;
  verified: boolean;
}

// `homeRegion` = onde mora (informativo). `attends` = bairros que
// atende de verdade (o que o motor de busca usa) — sempre inclui o
// bairro onde mora + outros, pra mostrar a regra do item 9/26 (Maria
// mora na Vila Eunice mas atende Centro e Novo Horizonte também).
const CURATED_PROVIDERS: DemoProvider[] = [
  {
    email: "ana.souza.demo@jandiraservice.com",
    name: "Ana Souza",
    phone: "(11) 90000-0001",
    professionalName: "Ana Souza",
    serviceSlug: "baba",
    homeRegion: "Novo Horizonte",
    street: "Rua das Acácias",
    number: "45",
    attends: ["Novo Horizonte", "Centro", "Parque Novo Horizonte"],
    description: "[DEMO] Babá com 8 anos de experiência, referências disponíveis.",
    priceFrom: 100,
    priceTo: 180,
    verified: true,
  },
  {
    email: "carlos.oliveira.demo@jandiraservice.com",
    name: "Carlos Oliveira",
    phone: "(11) 90000-0002",
    professionalName: "Carlos Oliveira",
    serviceSlug: "eletricista",
    homeRegion: "Centro",
    street: "Avenida Jandira",
    number: "780",
    attends: ["Centro", "Vila São Luiz", "Jardim Adriana", "Jardim Santo Expedito"],
    description: "[DEMO] Eletricista predial e residencial, atendimento rápido.",
    priceFrom: 80,
    priceTo: 250,
    verified: true,
  },
  {
    email: "maria.santos.demo@jandiraservice.com",
    name: "Maria Santos",
    phone: "(11) 90000-0003",
    professionalName: "Maria Santos",
    serviceSlug: "diarista",
    homeRegion: "Vila Eunice",
    street: "Rua Vila Eunice",
    number: "12",
    attends: ["Vila Eunice", "Centro", "Novo Horizonte", "Jardim Silveira"],
    description: "[DEMO] Diarista de confiança, disponibilidade em dias úteis.",
    priceFrom: 120,
    priceTo: 150,
    verified: false,
  },
  {
    email: "joao.pereira.demo@jandiraservice.com",
    name: "João Pereira",
    phone: "(11) 90000-0004",
    professionalName: "João Pereira",
    serviceSlug: "encanador",
    homeRegion: "Jardim Alvorada",
    street: "Rua Alvorada",
    number: "231",
    attends: ["Jardim Alvorada", "Chácara Silvânia", "Jardim Brotinho"],
    description: "[DEMO] Encanador, conserto de vazamentos e instalações hidráulicas.",
    priceFrom: 90,
    priceTo: 200,
    verified: true,
  },
];

// Pool de nomes só pra gerar os prestadores genéricos (1 por profissão
// que ainda não tem um "curado" acima) — não precisa ser bonito, só
// precisa ser único o suficiente pra não confundir nos testes.
const FIRST_NAMES = [
  "Bruno", "Camila", "Diego", "Elaine", "Fábio", "Gabriela", "Henrique", "Isabela",
  "Juliana", "Lucas", "Marcos", "Natália", "Otávio", "Patrícia", "Rafael", "Sandra",
  "Tiago", "Vanessa", "Wagner", "Aline", "Bruna", "Cristiano", "Débora", "Eduardo",
  "Fernanda", "Gustavo", "Helena", "Igor", "Jéssica", "Leandro", "Mônica", "Nelson",
  "Priscila", "Rodrigo", "Simone", "Thiago", "Viviane", "William", "Yasmin",
];
const LAST_NAMES = [
  "Almeida", "Barbosa", "Cardoso", "Duarte", "Ferreira", "Gonçalves", "Henriques",
  "Ibrahim", "Junqueira", "Lima", "Martins", "Nogueira", "Oliveira", "Pereira",
  "Queiroz", "Ramos", "Silveira", "Teixeira", "Vieira", "Xavier",
];

async function buildGeneratedProviders(regionNames: string[]): Promise<DemoProvider[]> {
  const { data: services } = await admin.from("services").select("slug, name").eq("is_active", true);
  const curatedSlugs = new Set(CURATED_PROVIDERS.map((p) => p.serviceSlug));
  const remaining = (services ?? []).filter((s) => !curatedSlugs.has(s.slug));

  return remaining.map((service, i) => {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const name = `${first} ${last}`;
    const homeRegion = regionNames[i % regionNames.length];
    const attends = [
      homeRegion,
      regionNames[(i + 1) % regionNames.length],
      regionNames[(i + 2) % regionNames.length],
    ];
    return {
      email: `demo.${service.slug}@jandiraservice.com`,
      name,
      phone: `(11) 90001-${String(1000 + i).slice(-4)}`,
      professionalName: name,
      serviceSlug: service.slug,
      homeRegion,
      street: `Rua Demo ${i + 1}`,
      number: String(100 + i),
      attends,
      description: `[DEMO] ${service.name} em Jandira-SP — conta de teste gerada automaticamente.`,
      priceFrom: 60 + (i % 8) * 10,
      priceTo: 150 + (i % 8) * 20,
      verified: i % 3 === 0,
    };
  });
}

// Mesmo bairro da Ana Souza (Novo Horizonte) de propósito — pra dar pra
// testar o teste principal da spec (item 49) direto: Cliente Teste
// busca "Babá" e a Ana já aparece automaticamente pelo bairro salvo.
const DEMO_CLIENT = {
  email: "cliente.teste.demo@jandiraservice.com",
  name: "Cliente Teste",
  phone: "(11) 90000-0000",
  homeRegion: "Novo Horizonte",
  street: "Rua Central",
  number: "500",
};

// Fase 9 (assinatura mensal via PIX): sem assinatura ATIVA, cliente
// não consegue solicitar e prestador some da busca — então toda conta
// demo precisa nascer com uma assinatura já aprovada, senão os testes
// (item 49 da spec) não têm como funcionar.
async function ensureActiveSubscription(userId: string) {
  const today = new Date();
  const periodStart = today.toISOString().slice(0, 10);
  const periodEndDate = new Date(today);
  periodEndDate.setMonth(periodEndDate.getMonth() + 1);
  const periodEnd = periodEndDate.toISOString().slice(0, 10);

  const { data: existing } = await admin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "APPROVED")
    .gte("period_end", periodStart)
    .maybeSingle();
  if (existing) return;

  await admin.from("subscriptions").insert({
    user_id: userId,
    status: "APPROVED",
    receipt_url: "demo/seed-auto-approved",
    period_start: periodStart,
    period_end: periodEnd,
    reviewed_at: today.toISOString(),
  });
}

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

async function seedProvider(
  provider: DemoProvider,
  cityId: string,
  regionByName: Map<string, string>,
) {
  const userId = await ensureAuthUser({
    email: provider.email,
    name: provider.name,
    phone: provider.phone,
    role: "PROVIDER",
  });

  const homeRegionId = regionByName.get(provider.homeRegion) ?? null;
  if (!homeRegionId) {
    console.warn(`  ! bairro "${provider.homeRegion}" não encontrado — pulando ${provider.name}`);
    return;
  }

  const { data: service } = await admin
    .from("services")
    .select("id")
    .eq("slug", provider.serviceSlug)
    .single();

  if (!service) {
    console.warn(`  ! serviço "${provider.serviceSlug}" não encontrado — pulando ${provider.name}`);
    return;
  }

  await admin.from("user_addresses").upsert(
    {
      user_id: userId,
      city_id: cityId,
      region_id: homeRegionId,
      street: provider.street,
      number: provider.number,
      is_primary: true,
    },
    { onConflict: "user_id" },
  );

  const { data: profile, error: profileError } = await admin
    .from("provider_profiles")
    .upsert(
      {
        user_id: userId,
        professional_name: provider.professionalName,
        description: provider.description,
        phone: provider.phone,
        whatsapp: provider.phone,
        price_from: provider.priceFrom,
        price_to: provider.priceTo,
        is_active: true,
        is_verified: provider.verified,
        // Já nascem homologados pra dar pra testar a busca/solicitação
        // direto (Fase 6 exige status=APPROVED pra aparecer — item 42).
        status: "APPROVED",
        profile_completion: 100,
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();

  if (profileError || !profile) {
    console.warn(`  ! erro ao salvar perfil de ${provider.name}: ${profileError?.message}`);
    return;
  }

  await admin
    .from("provider_services")
    .upsert({ provider_id: profile.id, service_id: service.id }, { onConflict: "provider_id,service_id" });

  const attendingRegionIds = provider.attends
    .map((name) => regionByName.get(name))
    .filter((id): id is string => Boolean(id));

  await admin.from("provider_regions").delete().eq("provider_id", profile.id);
  if (attendingRegionIds.length > 0) {
    await admin
      .from("provider_regions")
      .insert(attendingRegionIds.map((regionId) => ({ provider_id: profile.id, region_id: regionId })));
  }

  await ensureActiveSubscription(userId);

  console.log(
    `  perfil publicado: ${provider.name} (${provider.serviceSlug}, mora em ${provider.homeRegion}, atende ${attendingRegionIds.length} bairro(s))`,
  );
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

  const { data: allRegions } = await admin
    .from("regions")
    .select("id, name")
    .eq("city_id", city.id)
    .order("name");
  const regionByName = new Map((allRegions ?? []).map((r) => [r.name, r.id]));
  const regionNames = (allRegions ?? []).map((r) => r.name);

  if (regionNames.length === 0) {
    throw new Error("Nenhum bairro cadastrado. Rode supabase/seed.sql primeiro.");
  }

  console.log("Cliente demo:");
  const clientUserId = await ensureAuthUser({ ...DEMO_CLIENT, role: "CLIENT" });
  const clientRegionId = regionByName.get(DEMO_CLIENT.homeRegion);
  if (clientRegionId) {
    await admin.from("user_addresses").upsert(
      {
        user_id: clientUserId,
        city_id: city.id,
        region_id: clientRegionId,
        street: DEMO_CLIENT.street,
        number: DEMO_CLIENT.number,
        is_primary: true,
      },
      { onConflict: "user_id" },
    );
  }
  await ensureActiveSubscription(clientUserId);

  const generatedProviders = await buildGeneratedProviders(regionNames);
  const allProviders = [...CURATED_PROVIDERS, ...generatedProviders];

  console.log(`\nPrestadores demo (${allProviders.length} — 1 por profissão ativa no catálogo):`);
  for (const provider of allProviders) {
    await seedProvider(provider, city.id, regionByName);
  }

  console.log(`\nPronto. Login de qualquer conta demo: senha "${DEMO_PASSWORD}".`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
