-- Regras vigentes das taxas da Alugaê e do Mercado Pago.

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS taxa_mercado_pago NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- Atualiza valores pendentes/antigos que ainda usavam a comissão anterior.
UPDATE public.reservations
SET taxa_plataforma = ROUND(valor_diarias * 0.10, 2),
    valor_repasse = CASE
      WHEN status = 'paga'
        THEN GREATEST(0, ROUND(valor_diarias - ROUND(valor_diarias * 0.10, 2) - taxa_mercado_pago, 2))
      ELSE ROUND(valor_diarias * 0.90, 2)
    END,
    valor_bruto = CASE WHEN valor_bruto = 0 THEN valor_diarias ELSE valor_bruto END,
    valor_caucao = 0,
    valor_total = valor_diarias,
    updated_at = timezone('utc', now())
WHERE taxa_plataforma <> ROUND(valor_diarias * 0.10, 2)
   OR valor_repasse = ROUND(valor_diarias * 0.85, 2);
