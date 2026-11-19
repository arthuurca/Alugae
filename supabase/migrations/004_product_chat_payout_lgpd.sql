-- ALUGAÊ - Conta dupla, chat, repasses e LGPD

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consentimento_lgpd_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consentimento_lgpd_versao TEXT;

-- A conta pode ser locatário e anunciante ao mesmo tempo.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tipo_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_tipo_check
  CHECK (tipo IN ('locatario', 'anunciante', 'ambos'));

-- Permite ativar a função de anunciante a partir da própria conta.
DROP TRIGGER IF EXISTS trg_prevent_profile_tipo_change ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_profile_tipo_change();

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS valor_bruto NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taxa_plataforma NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taxa_mercado_pago NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_repasse NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repasse_previsto_para TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS repasse_observacao TEXT;

UPDATE public.reservations
SET valor_bruto = valor_diarias,
    taxa_plataforma = ROUND(valor_diarias * 0.10, 2),
    taxa_mercado_pago = 0,
    valor_repasse = ROUND(valor_diarias * 0.90, 2),
    valor_caucao = 0,
    valor_total = valor_diarias
WHERE valor_bruto = 0;

UPDATE public.products SET caucao = 0;

DROP POLICY IF EXISTS "Apenas anunciante insere produto" ON public.products;
CREATE POLICY "Apenas anunciante insere produto"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.tipo IN ('anunciante', 'ambos')
    )
  );

DROP POLICY IF EXISTS "Anunciante envia foto para sua pasta" ON storage.objects;
CREATE POLICY "Anunciante envia foto para sua pasta"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'produtos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.tipo IN ('anunciante', 'ambos')
    )
  );

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(reservation_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participantes veem conversa" ON public.conversations;
CREATE POLICY "Participantes veem conversa"
  ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = renter_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Participantes criam conversa" ON public.conversations;
CREATE POLICY "Participantes criam conversa"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = renter_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Participantes veem mensagens" ON public.messages;
CREATE POLICY "Participantes veem mensagens"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.renter_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Participantes enviam mensagens" ON public.messages;
CREATE POLICY "Participantes enviam mensagens"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.renter_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

-- Remove registros implantados pelo seed antigo de demonstração.
-- Use esta lista antes de criar o acervo real.
DELETE FROM public.products
WHERE owner_id = (
  SELECT id FROM public.profiles
  WHERE nome_loja = 'ALUGAÊ Acervo Oficial'
  LIMIT 1
) AND id BETWEEN 1 AND 10;
