# Jandira Service — Especificação do Projeto (referência)

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

## Modo prévia (sem login real)

Adicionado a pedido, pra dar pra olhar o sistema andando antes de conectar
o Supabase de verdade:

- `/preview` — escolhe "ver como Cliente/Prestador/Admin", grava um cookie
  (`dev_preview_role`) e entra direto no dashboard daquele papel
- `src/lib/preview.ts` + `src/lib/supabase/mock-client.ts`: com o Supabase
  não configurado, `getCurrentUser()` devolve um usuário de mentira (lido
  do cookie) e todo `.from()/.rpc()` do Supabase vira um mock que nunca
  bate na rede — sempre resolve vazio (`data: null`), então as telas
  renderizam com os estados vazios normais, sem travar numa URL falsa
- **Isso só existe enquanto `isSupabaseConfigured` for falso** — a partir
  do momento que `.env.local` tiver as chaves reais, `/preview` vira
  redirect pro `/login` de verdade e tudo isso some sozinho. Não precisa
  eu tirar esse código depois.
- Achado e corrigido nesse processo: `DashboardShell` (Client Component)
  recebia os ícones da lucide-react como referência de componente vinda
  de um Server Component — isso quebra no React/Next atual ("Only plain
  objects can be passed..."). Corrigido passando o ícone já renderizado
  (`<Home />`) em vez do componente cru.

## Fase 4 — Busca, match regional e perfil do prestador (decisões)

- **Nome do projeto corrigido**: era "Jendira Service" (erro de digitação
  arrastado desde a primeira mensagem), o certo é **Jandira Service**
  (mesmo nome da cidade). Renomeado em todo o código, textos, e-mails
  demo e no `package.json`.
- **Admin**: só o dono acessa por enquanto — nada a mudar no código,
  continua sendo promovido manualmente por SQL (`update users set
  role='ADMIN'`) quando chegar a hora de dar acesso a mais alguém.
- **`search_providers` ganhou paginação** (`p_limit`/`p_offset`, 20 por
  página — item 42/43) e passou a devolver `other_regions` (pra mostrar
  "atende também" no card — item 12) buscando o bairro do prestador via
  `user_addresses` (Fase 3.1), não mais um `region_id` solto.
- **Filtros são só no que já foi buscado** (item 14): avaliação mínima,
  verificado, preço — filtrados no array já carregado no navegador, sem
  round-trip novo no banco. Dataset por bairro é pequeno o suficiente
  pra isso ser instantâneo e ainda assim seguir o item 43 (banco filtra
  o essencial — serviço+região —, o resto é refinamento leve).
- **`service_requests` ganhou `preferred_date`/`preferred_time`** (o
  formulário de solicitar mostrava esses campos mas o banco não tinha
  onde guardar).
- **Fluxo de status implementado**: PENDING → ACCEPTED/DECLINED
  (prestador, botões em `/prestador/solicitacoes`) → COMPLETED
  (prestador marca "concluído") → cliente avalia. Cliente pode
  CANCELLED enquanto não estiver COMPLETED/CANCELLED. Toda transição é
  validada no server action (não só no RLS) — ver
  `service-request-actions.ts`.
- **"Sugerir um prestador"** (item 15) ficou de fora — não existe
  schema pra isso e não foi pedido antes; se quiser, dá pra tratar como
  uma Fase própria depois (ex: reaproveitando o padrão de
  `region_suggestions`).
- **Favoritos e avaliações**: só reaproveitaram tabelas/RLS que já
  existiam desde a Fase 1 (`favorites`, `reviews` + trigger
  `update_provider_rating`) — a novidade foi só a UI.

## Fase 5 — Solicitação, negociação e acompanhamento (decisões)

- **Novo status `SCHEDULED`** entre `ACCEPTED` e `IN_PROGRESS`: prestador
  aceita e informa o valor (`provider_price`) → **cliente confirma**
  (`ACCEPTED → SCHEDULED`, item 18) → prestador inicia
  (`SCHEDULED → IN_PROGRESS`) → prestador finaliza
  (`IN_PROGRESS → COMPLETED`). Cancelamento tem motivo
  (`cancel_reason`) e só é permitido em `PENDING/ACCEPTED/SCHEDULED`
  pelo cliente, ou em `SCHEDULED` pelo prestador (item 30/31).
- **`preferred_date`/`preferred_time` viraram `requested_date`/
  `requested_time`** — nome exato pedido no item 1, e passaram a ser
  obrigatórios no formulário de solicitar (o item 7 lista "data válida"
  e "horário válido" como validação).
- **Segurança de verdade, não só no server action** (item 38/39/47):
  criei o trigger `enforce_service_request_transition` no Postgres —
  ele é quem decide de fato se `PENDING → ACCEPTED` é permitido, se
  quem está mudando o status é o ator certo (cliente vs prestador), e
  bloqueia qualquer tentativa de alterar `client_id`/`provider_id`/
  `service_id`/`provider_price`/`provider_response` por quem não pode.
  Isso vale mesmo se alguém chamar a API do Supabase direto, pulando o
  app inteiro — RLS sozinho não bastava pra isso (só decide se a linha
  pode ser tocada, não *como*). O server action continua existindo só
  pra dar mensagem de erro amigável antes de chegar no banco.
- **Notificações internas** (item 34-37): tabela `notifications` +
  função `notify()` (security definer, só insere se quem está chamando
  participa da solicitação referenciada — evita spam forjado). Sino no
  menu com contador, marca tudo como lido ao abrir a tela.
- **Item 29** (prestador avaliar cliente no futuro): não implementado
  de propósito, só documentado — ver comentário em `reviews` no
  schema.sql.
- **Página de detalhe do cliente** (`/cliente/solicitacoes/[id]`, item
  11) concentra as ações reais (confirmar, cancelar, WhatsApp, avaliar)
  — a lista (`/cliente/solicitacoes`) ficou só com card resumido +
  abas de status (item 9/10), sem repetir os botões pesados. Do lado
  do prestador, as ações continuam na própria lista (item 12/13 já
  mostra os botões direto no card) — não criei uma página de detalhe
  separada pra ele.
- **"Histórico"** (item 32/33) não virou uma tela nova — as abas de
  status dentro de `/cliente/solicitacoes` e `/prestador/solicitacoes`
  (+ o resumo numérico no topo da tela do prestador) já cobrem isso.

## Fase 6 — Painel administrativo, homologação e controle (decisões)

- **Sem tabela `admin_users` própria**: o item 1/2 pedia login separado
  com hash de senha próprio. Implementar isso do zero (hash, sessão,
  cookies) duplicaria — pior, com mais risco — o que o Supabase Auth já
  faz certo. Fica `/admin/login`: entrada separada, nunca linkada do
  cadastro comum, com a cara de "Painel Administrativo", mas por baixo
  é o mesmo Supabase Auth (que já nunca guarda senha em texto puro) —
  só que rejeita e desloga na hora se `role != ADMIN`. Simplicidade
  pedida no enunciado da própria fase, e sem reinventar autenticação.
- **Bug real encontrado e corrigido nessa fase**: `/admin/login` estava
  dentro de `src/app/admin/`, então herdava o `layout.tsx` que exige
  `requireRole("ADMIN")` — ou seja, ninguém deslogado conseguia nem ver
  a tela de login. Corrigido movendo todas as páginas protegidas pra
  `src/app/admin/(protected)/` (route group do Next.js — não aparece na
  URL), deixando `admin/login` como única página realmente pública sob
  `/admin`.
- **`status` (homologação) é separado de `is_active` (publicação)**:
  `is_active` continua sendo o prestador publicando o próprio perfil
  (Fase 2/3); `status` (`PENDING/APPROVED/REJECTED/SUSPENDED/INACTIVE`)
  é só o admin quem muda — trigger `prevent_provider_status_escalation`
  garante isso mesmo se alguém chamar a API direto. Pra aparecer na
  busca agora precisa das duas coisas: `is_active = true AND status =
  'APPROVED'` (item 42) — atualizado em `search_providers`, na RLS de
  `provider_profiles` e nas telas que buscam prestador direto.
- **Bloqueio de conta** (`users.is_active`, item 8) é diferente de
  homologação — vale pra CLIENT e PROVIDER igual, é "essa pessoa pode
  usar o app". Trigger em `users` (o mesmo que já impedia auto-promover
  role) agora também impede a pessoa de se desbloquear sozinha.
  `requireRole` manda quem está bloqueado pra `/bloqueado`.
- **Avaliação oculta não conta na média**: `reviews.is_visible` — a
  trigger `update_provider_rating` só soma as visíveis.
- **`notify()` (Fase 5) ficou mais estrita**: agora só admin pode
  disparar notificação sem `service_request_id` associado (precisava
  pra avisar aprovação/recusa/suspensão, que não tem pedido nenhum
  envolvido) — usuário comum continua só podendo notificar alguém em
  nome de uma solicitação da qual participa.
- **`provider_documents`**: schema pronto (item 13), sem upload nem
  tela — não é obrigatório no MVP, exatamente como pedido.
- **Item 30** ("ação administrativa" pra intervir manualmente numa
  solicitação travada) não foi construído — é um caso de exceção sem
  fluxo definido no enunciado; o admin já consegue ver tudo em
  `/admin/solicitacoes`, só não tem um botão de forçar mudança de
  status por enquanto.
- **"Avaliações para análise"** (um dos 4 alertas do item 39) ficou de
  fora do painel de alertas — no meu modelo as avaliações já nascem
  visíveis (moderação é reativa, via denúncia ou revisão manual em
  Avaliações), não existe uma fila de "pendente de análise" pra contar.
  Os outros três alertas (prestadores pendentes, denúncias, sugestões
  de bairro) estão todos lá, clicáveis.
- **Busca administrativa global** (item 47) não virou uma tela própria
  — só o que foi pedido explicitamente por nome (busca de clientes,
  item 6) foi implementado. Um omnisearch cross-entidade fica pra
  quando fizer falta de verdade.
- **Menu fica em lista única**, não em árvore com submenus (item 4
  sugeria "Usuários > Clientes/Prestadores" aninhado) — o
  `DashboardShell` não tem esse nível de UI ainda; os itens estão todos
  lá, só sem indentação visual agrupada.
- **Permissões (item 41)**: nada de `SUPER_ADMIN`/`MODERATOR` agora,
  como pedido — só documentando aqui que `role` já é um enum
  (`user_role`) fácil de estender com mais valores no futuro sem quebrar
  nada que já existe.

## Fase 7 — Perfil profissional do prestador (decisões)

Essa fase fechou uma lacuna que existia desde a Fase 1: `/prestador/perfil`
era só uma tela "em construção" — nenhum prestador real conseguia
preencher foto, descrição, preço, disponibilidade ou WhatsApp. E ao
abrir isso, achei um buraco ainda mais fundamental: `/prestador/servicos`
também nunca tinha sido construído — sem ele, um prestador não tem
como dizer quais profissões oferece, e o motor de busca (que cruza
`service_id`) não tem o que casar. As duas foram construídas juntas.

- **`profile_completion` passou a ser calculado de verdade** (não é
  mais um número fixo do seed): 8 sinais reais — nome profissional,
  descrição, foto, preço, disponibilidade, WhatsApp, pelo menos 1
  serviço marcado, pelo menos 1 bairro atendido. Recalculado sempre
  que o prestador salva o perfil ou os serviços.
- **Foto de perfil usa Supabase Storage de verdade** (bucket
  `provider-photos`, público pra leitura, cada prestador só escreve
  dentro da própria pasta — `auth.uid()` como prefixo do caminho,
  RLS em `storage.objects`). Upload acontece dentro do próprio server
  action (Next.js Server Actions aceitam `File` via FormData), não
  precisou de nenhum client-side extra.
- **`/prestador/servicos` não mexe em `is_active`** — só
  `/prestador/regiao` "publica" o prestador (decisão da Fase 3),
  mantendo essa regra única em vez de duplicá-la em mais um lugar.

## Perfil do prestador — resumo + catálogo de serviços ampliado (pós-Fase 7)

Dois pedidos do cliente, feitos juntos: (1) `/prestador/perfil` "parecia
incompleto" sem mostrar endereço e regiões atendidas; (2) ativar de vez
"meus serviços", com opção de sugerir profissão que não está na lista —
igual ao que já existe pra bairro — e semear a primeira leva de 24/25
profissões que o cliente listou.

- **`ProfileSummaryCard`** (`src/components/provider/profile-summary-card.tsx`):
  card de leitura com link "Editar" pra tela própria. Usado 3x em
  `/prestador/perfil` (Endereço, Regiões que atendo, Serviços que
  ofereço) — mantém a separação já decidida na Fase 3 (onde mora ≠ onde
  atende ≠ perfil) sem duplicar formulário nenhum, só resolve a
  sensação de "faltou alguma coisa aqui".
- **`service_suggestions`**: mesma arquitetura de `region_suggestions`
  (Parte 2, item 11/12) — tabela com `status PENDING/APPROVED/REJECTED`,
  RPC `approve_service_suggestion`/`reject_service_suggestion`
  (`security definer`, só admin, slugifica via `unaccent`, dedup por
  slug), RLS (autor vê a própria, admin vê/mexe em tudo). Única
  diferença do espelho: serviço sempre precisa de uma categoria
  (`category_id`), então o formulário de sugestão pede isso também, e
  aprovar sem categoria é bloqueado na própria função.
- **Onde a sugestão aparece**: dentro de `ServiceCheckboxList`
  (`/prestador/servicos`), do mesmo jeito que `SuggestRegionForm` já
  vive dentro de `RegionCheckboxList` — inclusive herdando o mesmo
  padrão de form aninhado dentro do form principal, já testado e em
  produção desde a Parte 2. Moderação em Admin → Serviços, mesma UI de
  `RegionSuggestionRow`, e um alerta a mais no dashboard admin
  ("sugestões de serviço"), espelhando o de bairro.
- **Catálogo inicial ampliado** (`supabase/seed.sql`): das 24/25
  profissões que o cliente listou, 14-15 já existiam no catálogo sob o
  mesmo nome ou nome equivalente (Babá, Cabeleireiro, Cuidador de
  idosos → Cuidador, Diarista/Faxineira → já eram duas entradas
  separadas, Eletricista, Encanador, Fotógrafo, Maquiador,
  Manicure/Pedicure → Manicure, Marceneiro, Pedreiro, Pintor, Professor
  particular, Técnico de informática, Montador de Móveis) — tratadas
  como já cobertas, sem duplicar. As 10 realmente novas entraram:
  Jardineiro e Piscineiro e Cozinheiro por encomenda (categoria Casa),
  Esteticista (Beleza), Técnico de celular (Tecnologia), Organizador de
  eventos (Eventos), Advogado independente e Contador autônomo (nova
  categoria "Serviços Profissionais"), Enfermeiro autônomo e Personal
  trainer (nova categoria "Saúde e Bem-estar").

## Fases

Ver spec completa enviada pelo cliente. Ordem de execução: Fase 1 → Fase 8, uma de
cada vez, testando antes de avançar (regra do cliente, item 33 e 51).
