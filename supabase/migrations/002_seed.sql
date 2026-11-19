-- ==============================================================================
-- ALUGAÊ — Seed do Acervo Inicial (Baseado em js/data.js)
-- Arquivo: supabase/migrations/002_seed.sql
-- ==============================================================================

DO $$
DECLARE
  v_admin_id UUID;
  v_admin_email TEXT := 'contato@alugae.com.br';
BEGIN
  -- 1. Usa um usuário administrador criado pelo painel/API do Supabase.
  -- Nunca grave senhas ou hashes de autenticação em migrations.
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = v_admin_email
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Crie o usuário administrador % no Supabase antes de executar esta migration.', v_admin_email;
  END IF;

  -- 2. Garante perfil do anunciante oficial
  INSERT INTO public.profiles (
    id, nome, telefone, tipo, nome_loja, cidade, descricao_loja, created_at, updated_at
  ) VALUES (
    v_admin_id,
    'ALUGAÊ Oficial',
    '(11) 99999-0000',
    'anunciante',
    'ALUGAÊ Acervo Oficial',
    'São Paulo - SP',
    'Peças exclusivas e selecionadas com curadoria oficial da ALUGAÊ.',
    timezone('utc', now()),
    timezone('utc', now())
  ) ON CONFLICT (id) DO UPDATE SET
    nome_loja = EXCLUDED.nome_loja,
    tipo = 'anunciante';

  -- 3. Insere os 10 produtos fundamentais do catálogo inicial (se ainda não existirem)
  INSERT INTO public.products (
    id, owner_id, titulo, categoria, tamanhos, preco_diaria, caucao, descricao,
    medidas, imagens, art_type, art_color, rating, reviews, ativo
  ) VALUES
  (
    1, v_admin_id, 'Vestido Longo Evasê', 'casamento',
    ARRAY['PP', 'P', 'M', 'G'], 249.00, 300.00,
    'Vestido longo evasê em tecido crepe de alta gramatura, com decote em V delicado e saia fluida. Ideal para cerimônias de casamento e festas ao ar livre. Inclui cinto de cetim removível.',
    '{"busto":"88cm","cintura":"68cm","quadril":"94cm","comprimento":"145cm"}'::jsonb,
    '{}', 'dress-long', '#D4C4A8', 4.9, 34, true
  ),
  (
    2, v_admin_id, 'Vestido Midi de Festa', 'festa',
    ARRAY['PP', 'P', 'M', 'G', 'GG'], 149.00, 180.00,
    'Vestido midi em veludo bordô com detalhe de renda na barra. Silhueta ajustada ao corpo com abertura discreta no colarinho. Perfeito para jantares sofisticados e festas noturnas.',
    '{"busto":"90cm","cintura":"70cm","quadril":"96cm","comprimento":"115cm"}'::jsonb,
    '{}', 'dress-midi', '#8B3A4A', 4.8, 51, true
  ),
  (
    3, v_admin_id, 'Terno Slim Grafite', 'social',
    ARRAY['P', 'M', 'G', 'GG'], 189.00, 250.00,
    'Terno slim fit em tecido lã-poliéster na cor grafite com leve toque de elastano para conforto de movimento. Acompanha calça de alfaiataria com a mesma combinação. Ideal para cerimônias formais, apresentações e formaturas.',
    '{"ombro":"44cm","manga":"63cm","torax":"100cm","comprimento":"76cm"}'::jsonb,
    '{}', 'suit', '#4A4A55', 4.7, 28, true
  ),
  (
    4, v_admin_id, 'Vestido Longo Azul Royal', 'formatura',
    ARRAY['PP', 'P', 'M'], 219.00, 280.00,
    'Vestido longo em crepe azul royal com decote nas costas e cauda discreta. Bordado artesanal de cristais na cintura que captura a luz de forma deslumbrante. Uma das peças mais requisitadas do nosso acervo.',
    '{"busto":"86cm","cintura":"66cm","quadril":"92cm","comprimento":"148cm"}'::jsonb,
    '{}', 'dress-long', '#2C4A9E', 5.0, 19, true
  ),
  (
    5, v_admin_id, 'Conjunto Praia Linho', 'praia',
    ARRAY['P', 'M', 'G'], 89.00, 100.00,
    'Conjunto de calça wide leg e camisa oversized em linho lavado cor areia. Levíssimo e respirável, ideal para viagens à praia, piscinas e ambientes ao ar livre. Acompanha sacola de praia em palha.',
    '{"busto":"livre","cintura":"elastico","quadril":"livre","comprimento":"calca 98cm"}'::jsonb,
    '{}', 'casual-set', '#C8B898', 4.6, 42, true
  ),
  (
    6, v_admin_id, 'Vestido Preto Elegante', 'casual',
    ARRAY['PP', 'P', 'M', 'G', 'GG'], 129.00, 150.00,
    'Vestido midi em malha ponto romano preta com manga 3/4 e cinto fino incluso. Peça versátil que transita com facilidade entre o ambiente corporativo e eventos noturnos. Um clássico atemporal.',
    '{"busto":"92cm","cintura":"72cm","quadril":"98cm","comprimento":"100cm"}'::jsonb,
    '{}', 'dress-midi', '#2A2A2A', 4.8, 67, true
  ),
  (
    7, v_admin_id, 'Fantasia Veneziana', 'fantasia',
    ARRAY['P', 'M', 'G'], 199.00, 250.00,
    'Fantasia veneziana completa com vestido longo em brocado dourado e bordô, máscara artesanal, luvas de renda e tiara. Perfeita para bailes à fantasia, festas de carnaval e eventos temáticos.',
    '{"busto":"88cm","cintura":"ajustavel","quadril":"94cm","comprimento":"130cm"}'::jsonb,
    '{}', 'costume', '#8B6914', 4.9, 15, true
  ),
  (
    8, v_admin_id, 'Kit Acessórios Noiva', 'casamento',
    ARRAY['Tamanho único'], 149.00, 200.00,
    'Kit completo para noiva com colar de pérolas de água doce, brincos combinando, tiara cravejada de cristais, luvas de renda e bolsa clutch bordada. Todos os itens higienizados e embalados individualmente.',
    '{"colar":"42cm","brincos":"5cm comprimento","luvas":"ate o cotovelo"}'::jsonb,
    '{}', 'accessories', '#D4C4A8', 4.9, 22, true
  ),
  (
    9, v_admin_id, 'Vestido Floral Casual', 'casual',
    ARRAY['PP', 'P', 'M', 'G'], 79.00, 90.00,
    'Vestido midi em viscose floral com alças finas ajustáveis e saia rodada. Levíssimo, ideal para o dia a dia, passeios ao ar livre e viagens.',
    '{"busto":"86cm","cintura":"66cm","quadril":"92cm","comprimento":"110cm"}'::jsonb,
    '{}', 'dress-midi', '#6B8A5E', 4.5, 38, true
  ),
  (
    10, v_admin_id, 'Blazer Alfaiataria Bege', 'social',
    ARRAY['P', 'M', 'G'], 119.00, 140.00,
    'Blazer oversized de alfaiataria em crepe encorpado cor bege areia. Ombreiras suaves e botões marmorizados. A peça curinga perfeita para elevar qualquer produção corporativa.',
    '{"ombro":"42cm","manga":"60cm","busto":"96cm","comprimento":"72cm"}'::jsonb,
    '{}', 'blazer', '#C8B898', 4.7, 29, true
  )
  ON CONFLICT (id) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    categoria = EXCLUDED.categoria,
    tamanhos = EXCLUDED.tamanhos,
    preco_diaria = EXCLUDED.preco_diaria,
    caucao = EXCLUDED.caucao,
    descricao = EXCLUDED.descricao,
    medidas = EXCLUDED.medidas,
    art_type = EXCLUDED.art_type,
    art_color = EXCLUDED.art_color,
    ativo = true;

  -- Ajusta o sequence para novos produtos não colidirem com os IDs 1..10
  PERFORM setval('public.products_id_seq', (SELECT GREATEST(MAX(id), 10) FROM public.products));

END $$;
