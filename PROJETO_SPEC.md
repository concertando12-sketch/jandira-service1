# Jendira Service — Especificação do Projeto (referência)

Este arquivo guarda as decisões tomadas na FASE 1 para o time (e para você) não perder o fio.

## Decisões confirmadas com o cliente (2026-08-27)

- **Sem credenciais Supabase ainda**: o projeto inteiro (schema SQL, RLS, código) é
  construído pronto para conectar. Nada é mockado — quando as chaves forem coladas em
  `.env.local` e o `supabase/schema.sql` + `supabase/seed.sql` forem rodados, tudo passa
  a funcionar de verdade (auth, dashboards, busca).
- **Sem Google Maps API**: para não gerar custo agora, não usamos Places/Geocoding.
  Em vez disso, os **bairros de Jandira-SP são cadastrados manualmente** numa tabela
  `neighborhoods` (nome + lat/lng aproximados + cidade), gerenciável pelo admin.
  O cruzamento cliente × prestador é feito por **distância entre os bairros
  cadastrados** (fórmula Haversine em SQL) comparada ao `service_radius_km` do
  prestador — sem depender de nenhuma API externa. Dá pra trocar por Google Maps no
  futuro sem redesenhar o schema (lat/lng já existem).
- **Logo**: a imagem enviada no chat não ficou disponível como arquivo em disco nesta
  sessão. Foi recriada uma marca própria em SVG (círculo, "JS", casinha, preto/amarelo)
  em `src/components/brand/logo.tsx`. Troque pelo arquivo original quando puder — basta
  substituir o SVG ou colocar `public/logo.png` e trocar a referência.

## Paleta

- Preto: `#0A0A0A` (fundo), `#151515` (superfícies)
- Amarelo (marca): `#F2B705` — usado com moderação (CTAs, ícones, destaques)
- Branco: `#FFFFFF` / cinza claro para texto secundário sobre preto

## Parte 2 — Sistema de regiões e bairros (decisões)

- **`neighborhoods` virou `regions`**: mesma ideia, nome alinhado com o
  que o cliente pediu. `city_id` continua como FK pra `cities` (em vez
  dos campos `city`/`state`/`country` soltos que o texto original
  listava) — mantém a estrutura `cities → regions` pedida no item 27
  pra multi-cidade futura, sem duplicar dado.
- **Sem raio/lat-lng no MVP**: saiu o modelo "prestador tem 1 bairro +
  raio_km" da Fase 1. Agora é **N:N** (`provider_regions`): um
  prestador marca todos os bairros que atende, independente de onde
  mora (`provider_profiles.region_id` é só informativo). `latitude`/
  `longitude` continuam nas tabelas (opcionais) só reservados pro dia
  que entrar Google Maps — motor de busca não usa.
- **Bairro é dado, não código**: tabela `regions`, CRUD completo no
  admin (criar/editar/ativar/desativar, nunca deleta — item 16).
  Duplicidade evitada por slug único por cidade (item 17).
- **Sugestão de bairro** (item 11/12): tabela `region_suggestions`.
  Qualquer cliente/prestador pode sugerir; só vira `regions` de verdade
  quando um admin aprova (`approve_region_suggestion`, RPC), que já
  evita duplicata por slug.
- **Auto-publicação do prestador**: ao salvar "onde atende"
  (`/prestador/regiao`), o `provider_profiles` é criado (se não
  existir) e marcado `is_active = true` — item 39 da Parte 1 diz que
  quem publica é o próprio prestador, não o admin. A verificação (selo
  ✓) continua manual e separada (item 41).
- **Busca do cliente**: `/cliente/buscar` chama a função `search_providers(service_slug, region_id)`
  direto do banco (RPC), sem endpoint próprio — serviço + bairro
  batendo com `provider_services`/`provider_regions`, ordenado por
  verificado > avaliação > perfil completo (item 10).
- Componentes reutilizáveis: [region-checkbox-list.tsx](src/components/regions/region-checkbox-list.tsx)
  (seleção múltipla, usado no prestador) e [region-search-select.tsx](src/components/regions/region-search-select.tsx)
  (seleção única com busca, usado no cliente) — ambos com o fluxo
  "não encontrei meu bairro" embutido ([suggest-region-form.tsx](src/components/regions/suggest-region-form.tsx)).

## Fase 3.1 — Endereço e cruzamento regional (decisões)

- **`user_addresses`**: tabela única pra CLIENT e PROVIDER (cidade fixa +
  bairro + rua/número/complemento). Um endereço por usuário no MVP
  (`unique(user_id)`), com `is_primary` já no schema pra quando permitirmos
  vários endereços (item 21) — evitei o índice único parcial (`where
  is_primary`) porque o `.upsert(..., {onConflict})` do supabase-js não
  infere bem índice parcial; `unique(user_id)` simples resolve igual pro
  MVP e migra fácil depois.
- **`provider_profiles.region_id` foi removido** (existia desde a Parte 2)
  — virou redundante com `user_addresses`. Onde o prestador mora agora
  é 100% `user_addresses`; onde ele atende continua em `provider_regions`
  (N:N, intocado).
- **Duas telas separadas no prestador**, exatamente como pedido (item
  16/17): `/prestador/endereco` (onde ele está) e `/prestador/regiao`
  (bairros que atende) — a segunda não pergunta mais "onde você mora".
- **Não veio como etapa bloqueante do cadastro**: segui o mesmo padrão da
  Parte 2 (região do prestador) — telas dedicadas `/cliente/endereco` e
  `/prestador/endereco`, com nudge no dashboard/nav, em vez de inflar o
  formulário de cadastro inicial (item 38 da Parte 1: não criar telas
  desnecessárias / atrito).
- **Home do cliente e busca usam o bairro salvo automaticamente** (item
  8/9/12): `/cliente/buscar` já chega com o bairro pré-selecionado (busca
  inclusive roda no servidor, sem round-trip) — mas o cliente pode trocar
  na hora (item 13, busca manual por outro bairro).
- **`service_requests` ganhou `city_id`/`street`/`number`/`complement`**
  (item 14) — schema pronto, mas a TELA de solicitar serviço continua
  Fase 5 (ainda não construída), só o banco foi preparado agora.
- **Privacidade (item 19/20)**: nenhuma query pública devolve rua/número —
  `search_providers` só retorna o nome do bairro (`home_region_name`),
  igual já era na Parte 2. O perfil público do prestador (`/cliente/prestador/[id]`)
  continua como stub da Fase 4/5; quando for construído, é só respeitar
  essa mesma regra (nunca renderizar `street`/`number`/`complement`).

## Fases

Ver spec completa enviada pelo cliente. Ordem de execução: Fase 1 → Fase 8, uma de
cada vez, testando antes de avançar (regra do cliente, item 33 e 51).
