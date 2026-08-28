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

## Fases

Ver spec completa enviada pelo cliente. Ordem de execução: Fase 1 → Fase 8, uma de
cada vez, testando antes de avançar (regra do cliente, item 33 e 51).
