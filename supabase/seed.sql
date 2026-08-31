-- =====================================================================
-- JANDIRA SERVICE — SEED (dados de referência)
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

-- Lista dos 14 bairros acima era só um ponto de partida (nunca foi
-- definitiva) e ficou bem menor que os ~80 bairros reais de Jandira —
-- gente sugerindo bairro que já existia de verdade, sem achar. Lista
-- abaixo pesquisada em fontes públicas (GuiaMais, mbi.com.br) — sem
-- lat/lng por enquanto (não temos a coordenada real de cada um; a
-- coluna é opcional e reservada pra uma fase futura com mapa).
insert into public.regions (city_id, name, slug, is_active)
select c.id, n.name, n.slug, true
from public.cities c
cross join (values
  ('Altos de São Fernando',                   'altos-de-sao-fernando'),
  ('Bosque de Jandira',                       'bosque-de-jandira'),
  ('Chácaras do Peroba',                      'chacaras-do-peroba'),
  ('Granja Alvorada',                         'granja-alvorada'),
  ('Infant''s Garden',                        'infants-garden'),
  ('Jardim Analândia',                        'jardim-analandia'),
  ('Jardim Antônio Porto',                    'jardim-antonio-porto'),
  ('Jardim Aurora',                           'jardim-aurora'),
  ('Jardim Belmont',                          'jardim-belmont'),
  ('Jardim Bolívia',                          'jardim-bolivia'),
  ('Jardim Camila',                           'jardim-camila'),
  ('Jardim Centenário',                       'jardim-centenario'),
  ('Jardim Cristino',                         'jardim-cristino'),
  ('Jardim das Margaridas',                   'jardim-das-margaridas'),
  ('Jardim do Golf I',                        'jardim-do-golf-i'),
  ('Jardim do Líbano',                        'jardim-do-libano'),
  ('Jardim Europa',                           'jardim-europa'),
  ('Jardim Gabriela I',                       'jardim-gabriela-i'),
  ('Jardim Gabriela II',                      'jardim-gabriela-ii'),
  ('Jardim Gabriela III',                     'jardim-gabriela-iii'),
  ('Jardim Heneide',                          'jardim-heneide'),
  ('Jardim Jandira',                          'jardim-jandira'),
  ('Jardim Javaés',                           'jardim-javaes'),
  ('Jardim Lindomar',                         'jardim-lindomar'),
  ('Jardim Marília',                          'jardim-marilia'),
  ('Jardim Mase',                             'jardim-mase'),
  ('Jardim Nossa Senhora de Fátima',          'jardim-nossa-senhora-de-fatima'),
  ('Jardim Novo Horizonte',                   'jardim-novo-horizonte'),
  ('Jardim Palmeiras',                        'jardim-palmeiras'),
  ('Jardim Patriarca',                        'jardim-patriarca'),
  ('Jardim Rosa Emília',                      'jardim-rosa-emilia'),
  ('Jardim Sagrado Coração',                  'jardim-sagrado-coracao'),
  ('Jardim São João',                         'jardim-sao-joao'),
  ('Jardim São Luiz',                         'jardim-sao-luiz'),
  ('Jardim São Paulo',                        'jardim-sao-paulo'),
  ('Jardim Sol Nascente',                     'jardim-sol-nascente'),
  ('Jardim Sorocabano',                       'jardim-sorocabano'),
  ('Jardim Stella Maris',                     'jardim-stella-maris'),
  ('Jardim Velho Sanazar',                    'jardim-velho-sanazar'),
  ('Lago dos Cisnes',                         'lago-dos-cisnes'),
  ('Mirante de Jandira',                      'mirante-de-jandira'),
  ('Nova Higienópolis',                       'nova-higienopolis'),
  ('Núcleo Micro Industrial Presidente Wilson', 'nucleo-micro-industrial-presidente-wilson'),
  ('Parque das Iglesias',                     'parque-das-iglesias'),
  ('Parque dos Lagos',                        'parque-dos-lagos'),
  ('Parque Nova Jandira',                     'parque-nova-jandira'),
  ('Parque Santa Tereza',                     'parque-santa-tereza'),
  ('Sítio Pedra Bonita',                      'sitio-pedra-bonita'),
  ('Suite Quebra Nozes',                      'suite-quebra-nozes'),
  ('Vale do Sol',                             'vale-do-sol'),
  ('Vila Anita Costa',                        'vila-anita-costa'),
  ('Vila Cecília',                            'vila-cecilia'),
  ('Vila Diogo Balhesteiro',                  'vila-diogo-balhesteiro'),
  ('Vila Dolores Paschoalin',                 'vila-dolores-paschoalin'),
  ('Vila Ercília',                            'vila-ercilia'),
  ('Vila Esmeralda',                          'vila-esmeralda'),
  ('Vila Eugênia',                            'vila-eugenia'),
  ('Vila Godinho',                            'vila-godinho'),
  ('Vila Ipê',                                'vila-ipe'),
  ('Vila Lucinda',                            'vila-lucinda'),
  ('Vila Makenzi',                            'vila-makenzi'),
  ('Vila Mercedes',                           'vila-mercedes'),
  ('Vila Ouro Verde',                         'vila-ouro-verde'),
  ('Vila Popi',                               'vila-popi'),
  ('Vila Rolim',                              'vila-rolim'),
  ('Vila Santa Rosa',                         'vila-santa-rosa'),
  ('Vila Santo Antônio',                      'vila-santo-antonio'),
  ('Vila São Nicolau',                        'vila-sao-nicolau')
) as n(name, slug)
where c.name = 'Jandira' and c.state = 'SP'
on conflict (city_id, slug) do nothing;

-- Complemento à lista acima com uma segunda lista passada pelo
-- cliente — conferido contra as duas listas anteriores pra não
-- duplicar (nomes iguais ou variação de grafia da mesma vila/jardim
-- ficam de fora daqui), só o que realmente faltava.
insert into public.regions (city_id, name, slug, is_active)
select c.id, n.name, n.slug, true
from public.cities c
cross join (values
  ('Altos de Jandira',            'altos-de-jandira'),
  ('Beverly Hills',                'beverly-hills'),
  ('Condomínio Nova Paulista',    'condominio-nova-paulista'),
  ('Do Votupoca',                  'do-votupoca'),
  ('Jardim Granja Alvorada',      'jardim-granja-alvorada'),
  ('Jardim Hélio Cruz',           'jardim-helio-cruz'),
  ('Parque do Lago',               'parque-do-lago'),
  ('Polo Industrial Jandira',     'polo-industrial-jandira'),
  ('Sítio das Pitas',             'sitio-das-pitas'),
  ('Vila da Pedreira',             'vila-da-pedreira'),
  ('Vila Haber',                   'vila-haber'),
  ('Vila Morri',                   'vila-morri'),
  ('Vila Neusa',                   'vila-neusa')
) as n(name, slug)
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
  ('Transporte',  'transporte',  'car',         'Transporte e veículos', true),
  ('Serviços Profissionais', 'servicos-profissionais', 'briefcase', 'Advocacia, contabilidade e afins', true),
  ('Saúde e Bem-estar', 'saude-e-bem-estar', 'heart-pulse', 'Cuidados de saúde e bem-estar', true)
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
  ('transporte', 'Mecânico',      'mecanico',            'Manutenção automotiva'),
  ('casa', 'Jardineiro',          'jardineiro',          'Manutenção de jardins e áreas verdes'),
  ('casa', 'Piscineiro',          'piscineiro',          'Limpeza e manutenção de piscinas'),
  ('casa', 'Cozinheiro por encomenda', 'cozinheiro-por-encomenda', 'Refeições e marmitas sob encomenda'),
  ('beleza', 'Esteticista',       'esteticista',         'Tratamentos estéticos e cuidados com a pele'),
  ('tecnologia', 'Técnico de celular', 'tecnico-de-celular', 'Manutenção e conserto de celulares'),
  ('eventos', 'Organizador de eventos', 'organizador-de-eventos', 'Planejamento e organização de festas e eventos'),
  ('servicos-profissionais', 'Advogado independente', 'advogado-independente', 'Consultoria e serviços jurídicos autônomos'),
  ('servicos-profissionais', 'Contador autônomo', 'contador-autonomo', 'Contabilidade para pessoa física e pequenos negócios'),
  ('saude-e-bem-estar', 'Enfermeiro autônomo', 'enfermeiro-autonomo', 'Cuidados de enfermagem a domicílio'),
  ('saude-e-bem-estar', 'Personal trainer', 'personal-trainer', 'Treinamento físico personalizado')
) as s(category_slug, name, slug, description) on c.slug = s.category_slug
on conflict (slug) do nothing;
