-- Remove somente o acervo fake/antigo da loja oficial (IDs 1 a 10).
-- Produtos publicados por outros anunciantes permanecem ativos.
UPDATE public.products
SET ativo = false,
    updated_at = timezone('utc', now())
WHERE id BETWEEN 1 AND 10
  AND owner_id = (
    SELECT id
    FROM public.profiles
    WHERE nome_loja = 'ALUGAÊ Acervo Oficial'
    LIMIT 1
  );
