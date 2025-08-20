-- Extensiones (por si no están)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- === RIOT ACCOUNTS ===
CREATE TABLE IF NOT EXISTS public.riot_accounts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puuid      VARCHAR(78) UNIQUE NOT NULL,
  game_name  VARCHAR(50) NOT NULL,
  tag_line   VARCHAR(10) NOT NULL,
  platform   VARCHAR(10) NOT NULL,
  verified   BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_riot_accounts_touch_updated_at ON public.riot_accounts;
CREATE TRIGGER trg_riot_accounts_touch_updated_at
  BEFORE UPDATE ON public.riot_accounts
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS idx_riot_accounts_user_id ON public.riot_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_riot_accounts_puuid ON public.riot_accounts(puuid);

-- RLS
ALTER TABLE public.riot_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "riot_accounts_select_own" ON public.riot_accounts;
CREATE POLICY "riot_accounts_select_own"
  ON public.riot_accounts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "riot_accounts_insert_own" ON public.riot_accounts;
CREATE POLICY "riot_accounts_insert_own"
  ON public.riot_accounts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "riot_accounts_update_own" ON public.riot_accounts;
CREATE POLICY "riot_accounts_update_own"
  ON public.riot_accounts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "riot_accounts_delete_own" ON public.riot_accounts;
CREATE POLICY "riot_accounts_delete_own"
  ON public.riot_accounts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- === Desafíos de verificación ===
CREATE TABLE IF NOT EXISTS public.verification_challenges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  icon_id    INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  completed  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verification_challenges_select_own" ON public.verification_challenges;
CREATE POLICY "verification_challenges_select_own"
  ON public.verification_challenges FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "verification_challenges_insert_own" ON public.verification_challenges;
CREATE POLICY "verification_challenges_insert_own"
  ON public.verification_challenges FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "verification_challenges_update_own" ON public.verification_challenges;
CREATE POLICY "verification_challenges_update_own"
  ON public.verification_challenges FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Verificación final
SELECT table_name 
FROM information_schema.tables
WHERE table_schema='public' AND table_name IN ('riot_accounts','verification_challenges');

SELECT policyname, cmd, roles 
FROM pg_policies
WHERE schemaname='public' AND tablename='riot_accounts';

