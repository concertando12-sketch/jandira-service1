# Jendira Service

Marketplace regional de serviços — **Jandira/SP**. Conecta clientes que
precisam de um serviço a prestadores que atendem a região. Pensado para
crescer para outras cidades depois, mas o MVP é 100% focado em Jandira.

Stack: **Next.js (App Router) + TypeScript + Tailwind CSS + Supabase**
(Auth, Postgres, Storage). Sem Google Maps — a localização é 100% baseada
em bairros cadastrados no próprio banco (tabela `regions`, dado, não
código), cruzando **serviço + bairro atendido** para o match entre
cliente e prestador. Nada de raio/lat-lng/GPS no MVP.

## Status

**Fase 1** — autenticação, roles, estrutura ✅
- Landing "Sou cliente / Sou prestador", cadastro, login, recuperar/redefinir senha
- Roles `CLIENT` / `PROVIDER` / `ADMIN` com rotas protegidas (proxy + RLS)
- Dashboards iniciais dos três perfis, com dados reais do Supabase

**Parte 2 — Sistema de regiões e bairros** ✅
- Bairros (`regions`) 100% cadastráveis pelo admin — criar, editar, ativar/desativar
- Prestador escolhe **quantos bairros quiser** que atende (`/prestador/regiao`),
  separado de onde mora — N:N (`provider_regions`)
- Cliente busca por serviço + bairro (`/cliente/buscar`), motor de busca
  100% no banco (`search_providers`, sem API externa)
- "Não encontrei meu bairro" → sugestão fica pendente até um admin aprovar
  (`region_suggestions` + moderação em Admin → Regiões)
- Painel admin: categorias, serviços e bairros 100% cadastráveis sem mexer em código

- ⏳ Endereço completo, solicitação de serviço, avaliações → próximas fases
  (ver `PROJETO_SPEC.md`)

## 1. Configurar o Supabase

1. Crie um projeto grátis em [app.supabase.com](https://app.supabase.com)
2. Vá em **SQL Editor**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e rode
3. Cole o conteúdo de [`supabase/seed.sql`](supabase/seed.sql) e rode (cidade Jandira, bairros, categorias e serviços)
4. Vá em **Project Settings → API** e copie a `Project URL` e a `anon public key`

## 2. Configurar o projeto local

```bash
cp .env.example .env.local
```

Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no
`.env.local` com os valores do passo anterior.

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## 3. (Opcional) Dados demo

Para testar o fluxo com prestadores fictícios de Jandira (item 48 da
spec: Ana Souza/Babá, Carlos Oliveira/Eletricista, Maria Santos/Diarista,
João Pereira/Encanador):

1. Em **Project Settings → API**, copie a `service_role key` e cole em
   `SUPABASE_SERVICE_ROLE_KEY` no `.env.local` (nunca exponha essa chave no navegador)
2. Rode:

```bash
npm run seed:demo
```

Login de qualquer conta demo: senha `Demo123456!`.

## Primeiro acesso como admin

Não existe cadastro de admin pelo app (por segurança — ver `supabase/schema.sql`,
função `handle_new_user`). Para criar o primeiro admin:

1. Cadastre-se normalmente pelo app como cliente ou prestador
2. No SQL Editor do Supabase, rode:

```sql
update public.users set role = 'ADMIN' where email = 'seu-email@exemplo.com';
```

## Estrutura

```
src/
  app/
    (landing, login, cadastro, recuperar-senha, redefinir-senha, auth/callback)
    cliente/   → dashboard, categorias, buscar, solicitacoes, favoritos, perfil, prestador/[id]
    prestador/ → dashboard, solicitacoes, servicos, perfil, regiao, configuracoes
    admin/     → dashboard, clientes, prestadores, categorias, servicos, solicitacoes, avaliacoes, regioes, configuracoes
  components/  → ui/ (design system), brand/ (logo), dashboard/, admin/, account/, auth/
  lib/
    supabase/  → clients (browser, server, middleware) + tipos do banco
    actions/   → Server Actions (conta, admin)
    auth.ts    → getCurrentUser / requireRole
    constants.ts → APP_CITY/STATE/COUNTRY, labels
supabase/
  schema.sql   → tabelas, RLS, triggers, função de busca por região
  seed.sql     → cidade, bairros, categorias, serviços (dados de referência)
scripts/
  seed-demo.ts → cria contas + perfis de prestadores fictícios
```

## Identidade visual

Preto + amarelo, minimalista — inspirado na logo enviada (círculo, "JS",
casinha). A marca em SVG está em `src/components/brand/logo.tsx`; troque
pelo arquivo original assim que ele estiver disponível como asset no
projeto.

Veja `PROJETO_SPEC.md` para as decisões de arquitetura tomadas na Fase 1.
