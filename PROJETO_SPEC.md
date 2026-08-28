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

## Fases

Ver spec completa enviada pelo cliente. Ordem de execução: Fase 1 → Fase 8, uma de
cada vez, testando antes de avançar (regra do cliente, item 33 e 51).
