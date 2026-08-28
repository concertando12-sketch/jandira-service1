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
-- BAIRROS DE JANDIRA-SP
-- Coordenadas aproximadas (centro da cidade ~ -23.5272, -46.9042),
-- usadas só para o cálculo de raio/distância — sem API paga. Ajuste
-- fino pode ser feito no painel admin (Fase 7) a qualquer momento.
-- ---------------------------------------------------------------------
insert into public.neighborhoods (city_id, name, latitude, longitude, is_active)
select c.id, n.name, n.latitude, n.longitude, true
from public.cities c
cross join (values
  ('Centro',                    -23.5272, -46.9042),
  ('Novo Horizonte',            -23.5190, -46.9010),
  ('Jardim Silveira',           -23.5310, -46.9105),
  ('Jardim Alvorada',           -23.5230, -46.9130),
  ('Jardim Adriana',            -23.5340, -46.8990),
  ('Vila São Luiz',             -23.5285, -46.8975),
  ('Jardim Cristiane',          -23.5155, -46.9075),
  ('Jardim Márcia',             -23.5205, -46.8950),
  ('Jardim Santo Expedito',     -23.5355, -46.9060),
  ('Parque Novo Horizonte',     -23.5175, -46.8985),
  ('Chácara Silvânia',          -23.5250, -46.9180),
  ('Jardim Estrela D''Alva',    -23.5320, -46.8930)
) as n(name, latitude, longitude)
where c.name = 'Jandira' and c.state = 'SP'
on conflict (city_id, name) do nothing;

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
