-- ALUGAÊ — Endurecimento de acesso a dados públicos

-- A tabela completa de perfis não deve ser consultável anonimamente.
DROP POLICY IF EXISTS "Lojas com visualização pública" ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;

-- A view publica somente os campos necessários para exibir uma loja.
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, nome, nome_loja, cidade, descricao_loja
FROM public.profiles
WHERE tipo = 'anunciante';

GRANT SELECT ON public.public_profiles TO anon, authenticated;
