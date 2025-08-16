-- Primero, eliminamos la tabla si existe
DROP TABLE IF EXISTS public.riot_verification_challenges;

-- Recreamos la tabla con la estructura correcta
CREATE TABLE public.riot_verification_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_code VARCHAR(10) NOT NULL,
    puuid VARCHAR(78),
    platform VARCHAR(10),
    consumed BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aseguramos que RLS está habilitado
ALTER TABLE public.riot_verification_challenges ENABLE ROW LEVEL SECURITY;

-- Eliminamos políticas existentes
DROP POLICY IF EXISTS "Enable all access for service role" ON public.riot_verification_challenges;

-- Creamos políticas necesarias
CREATE POLICY "Enable all access for service role"
ON public.riot_verification_challenges
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Otorgamos permisos necesarios
GRANT ALL ON public.riot_verification_challenges TO service_role;
GRANT ALL ON public.riot_verification_challenges TO authenticated;
GRANT ALL ON public.riot_verification_challenges TO postgres;

-- Aseguramos que la secuencia del ID tenga los permisos correctos
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_riot_verification_challenges_user_id ON public.riot_verification_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_riot_verification_challenges_puuid ON public.riot_verification_challenges(puuid);
CREATE INDEX IF NOT EXISTS idx_riot_verification_challenges_expires_at ON public.riot_verification_challenges(expires_at);

-- Trigger para limpiar desafíos expirados
CREATE OR REPLACE FUNCTION clean_expired_challenges()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.riot_verification_challenges
  WHERE expires_at < NOW() AND consumed = false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clean_expired_challenges ON public.riot_verification_challenges;

CREATE TRIGGER trigger_clean_expired_challenges
  AFTER INSERT ON public.riot_verification_challenges
  EXECUTE FUNCTION clean_expired_challenges();
