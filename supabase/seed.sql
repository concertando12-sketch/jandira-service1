-- =====================================================================
-- JENDIRA SERVICE — SEED (dados de referência)
-- Rode depois do supabase/schema.sql.
-- Idempotente: pode rodar de novo sem duplicar (usa ON CONFLICT).
--
-- Contém: cidade Jandira-SP (única ativa), bairros com lat/lng
-- aproximados (sem Google Maps — cadastro manual, editável depois pelo
-- admin), categorias e serviços do catálogo inicial.
--
-- Prestadores DEMO (fictícios, item 48 da spec) ficam em
-- scripts/seed-demo.ts porque exigem contas de autenticação reais
-- (precisa da service role key, que você ainda não configurou).
-- =====================================================================

-- ---------------------------------------------------------------------
-- CIDADE (somente Jandira-SP ativa — regra 5/21)
-- ---------------------------------------------------------------------
insert into public.cities (name, state, country, is_active)
values ('Jandira', 'SP', 'BR', true)
on conflict (name, state, country) do nothing;

-- ---------------------------------------------------------------------
-- BAIRROS DE JANDIRA-SP (tabela `regions` — item 4 da Parte 2)
-- Lista inicial, NÃO definitiva — o admin pode corrigir nomes, ativar,
-- desativar e adicionar novos bairros a qualquer momento pelo painel,
-- sem precisar mexer neste arquivo nem no código (regra final da
-- Parte 2: "bairros são dados, não código").
--
-- Latitude/longitude são opcionais e só usadas numa fase futura com
-- Google Maps — o motor de busca do MVP não depende delas.
-- ---------------------------------------------------------------------
insert into public.regions (city_id, name, slug, latitude, longitude, is_active)
select c.id, n.name, n.slug, n.latitude, n.longitude, true
from public.cities c
cross join (values
  ('Centro',                    'centro',                     -23.5272, -46.9042),
  ('Novo Horizonte',            'novo-horizonte',              -23.5190, -46.9010),
  ('Jardim Silveira',           'jardim-silveira',             -23.5310, -46.9105),
  ('Jardim Alvorada',           'jardim-alvorada',             -23.5230, -46.9130),
  ('Jardim Adriana',            'jardim-adriana',               -23.5340, -46.8990),
  ('Vila São Luiz',             'vila-sao-luiz',                -23.5285, -46.8975),
  ('Vila Eunice',               'vila-eunice',                  -23.5165, -46.8940),
  ('Jardim Cristiane',          'jardim-cristiane',             -23.5155, -46.9075),
  ('Jardim Márcia',             'jardim-marcia',                -23.5205, -46.8950),
  ('Jardim Santo Expedito',     'jardim-santo-expedito',        -23.5355, -46.9060),
  ('Parque Novo Horizonte',     'parque-novo-horizonte',        -23.5175, -46.8985),
  ('Chácara Silvânia',          'chacara-silvania',             -23.5250, -46.9180),
  ('Jardim Estrela D''Alva',    'jardim-estrela-d-alva',        -23.5320, -46.8930),
  ('Jardim Brotinho',           'jardim-brotinho',              -23.5225, -46.9200)
) as n(name, slug, latitude, longitude)
where c.name = 'Jandira' and c.state = 'SP'
on conflict (city_id, slug) do nothing;

-- ---------------------------------------------------------------------
-- CATEGORIAS
-- ---------------------------------------------------------------------
insert into public.categories (name, slug, icon, description, is_active) values
  ('Casa',        'casa',        'home',        'Serviços domésticos e reparos residenciais', true),
  ('Cuidados',    'cuidados',    'heart-handshake', 'Cuidado de pessoas', true),
  ('Beleza',      'beleza',      'scissors',    'Beleza e estética', true),
  ('Tecnologia',  'tecnologia',  'laptop',      'Tecnologia e serviços digitais', true),
  ('Eventos',     'eventos',     'party-popper','Serviços para eventos', true),
  ('Educação',    'educacao',    'graduation-cap', 'Aulas e reforço escolar', true),
  ('Transporte',  'transporte',  'car',         'Transporte e veículos', true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- SERVIÇOS (profissões) por categoria
-- ---------------------------------------------------------------------
insert into public.services (category_id, name, slug, description, is_active)
select c.id, s.name, s.slug, s.description, true
from public.categories c
join (values
  ('casa', 'Diarista',            'diarista',            'Limpeza avulsa residencial'),
  ('casa', 'Faxineira',           'faxineira',           'Limpeza residencial e comercial'),
  ('casa', 'Eletricista',         'eletricista',         'Instalação e manutenção elétrica'),
  ('casa', 'Encanador',           'encanador',           'Instalação e reparo hidráulico'),
  ('casa', 'Pedreiro',            'pedreiro',            'Alvenaria e reformas'),
  ('casa', 'Pintor',              'pintor',              'Pintura residencial e comercial'),
  ('casa', 'Marceneiro',          'marceneiro',          'Móveis e marcenaria sob medida'),
  ('casa', 'Montador de móveis',  'montador-de-moveis',  'Montagem e desmontagem de móveis'),
  ('cuidados', 'Babá',            'baba',                'Cuidado de crianças'),
  ('cuidados', 'Cuidador',        'cuidador',            'Cuidado de idosos e pessoas com necessidades especiais'),
  ('cuidados', 'Acompanhante',    'acompanhante',        'Acompanhamento de idosos e convalescentes'),
  ('beleza', 'Manicure',          'manicure',            'Cuidados com unhas'),
  ('beleza', 'Cabeleireiro',      'cabeleireiro',        'Corte e tratamento capilar'),
  ('beleza', 'Barbeiro',          'barbeiro',            'Corte e barba masculina'),
  ('beleza', 'Maquiador',         'maquiador',           'Maquiagem para eventos'),
  ('tecnologia', 'Técnico de informática', 'tecnico-de-informatica', 'Manutenção de computadores e redes'),
  ('tecnologia', 'Desenvolvedor', 'desenvolvedor',       'Desenvolvimento de software'),
  ('tecnologia', 'Designer',      'designer',            'Design gráfico e digital'),
  ('tecnologia', 'Social media',  'social-media',        'Gestão de redes sociais'),
  ('eventos', 'Fotógrafo',        'fotografo',           'Cobertura fotográfica de eventos'),
  ('eventos', 'Videomaker',       'videomaker',          'Produção de vídeo para eventos'),
  ('eventos', 'DJ',               'dj',                  'Som e animação de festas'),
  ('eventos', 'Garçom',           'garcom',               'Serviço de garçom para eventos'),
  ('eventos', 'Decorador',        'decorador',           'Decoração de festas e eventos'),
  ('educacao', 'Professor particular',   'professor-particular',   'Aulas particulares'),
  ('educacao', 'Professor de idiomas',   'professor-de-idiomas',   'Aulas de idiomas'),
  ('educacao', 'Reforço escolar',        'reforco-escolar',        'Reforço escolar para alunos'),
  ('transporte', 'Motorista',     'motorista',           'Transporte particular'),
  ('transporte', 'Mecânico',      'mecanico',            'Manutenção automotiva')
) as s(category_slug, name, slug, description) on c.slug = s.category_slug
on conflict (slug) do nothing;
