-- 1. Primero, eliminamos todas las tablas y objetos relacionados anteriores
DROP TABLE IF EXISTS public.linked_riot_accounts CASCADE;
DROP TABLE IF EXISTS public.riot_verification_challenges CASCADE;
DROP TABLE IF EXISTS public.riot_matches CASCADE;
DROP TABLE IF EXISTS public.match_records CASCADE;
DROP TABLE IF EXISTS public.tournament_points CASCADE;
DROP TABLE IF EXISTS public.tournament_registrations CASCADE;
DROP TABLE IF EXISTS public.tournament_participants CASCADE;
DROP TABLE IF EXISTS public.tournament_matches CASCADE;
DROP TABLE IF EXISTS public.tournaments CASCADE;

-- Eliminar funciones y triggers anteriores
DROP FUNCTION IF EXISTS public.tg_touch_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.tg_touch_synced_at() CASCADE;
DROP FUNCTION IF EXISTS public.clean_expired_challenges() CASCADE;

-- 2. Crear las nuevas tablas limpias

-- Tabla principal para cuentas vinculadas
CREATE TABLE public.riot_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    puuid VARCHAR(78) UNIQUE NOT NULL,
    game_name VARCHAR(50) NOT NULL,
    tag_line VARCHAR(10) NOT NULL,
    platform VARCHAR(10) NOT NULL,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para desafíos de verificación
CREATE TABLE public.verification_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    icon_id INTEGER NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear índices para mejor rendimiento
CREATE INDEX idx_riot_accounts_user_id ON public.riot_accounts(user_id);
CREATE INDEX idx_riot_accounts_puuid ON public.riot_accounts(puuid);
CREATE INDEX idx_verification_challenges_user_id ON public.verification_challenges(user_id);
CREATE INDEX idx_verification_challenges_expires ON public.verification_challenges(expires_at);

-- 4. Configurar RLS (Row Level Security)

-- RLS para riot_accounts
ALTER TABLE public.riot_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias cuentas"
ON public.riot_accounts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propias cuentas"
ON public.riot_accounts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias cuentas"
ON public.riot_accounts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS para verification_challenges
ALTER TABLE public.verification_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propios desafíos"
ON public.verification_challenges FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propios desafíos"
ON public.verification_challenges FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios desafíos"
ON public.verification_challenges FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 5. Crear función para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_riot_accounts_updated_at
    BEFORE UPDATE ON public.riot_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Función para limpiar desafíos expirados
CREATE OR REPLACE FUNCTION clean_expired_challenges()
RETURNS trigger AS $$
BEGIN
    DELETE FROM public.verification_challenges
    WHERE expires_at < NOW() AND completed = false;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para limpiar desafíos expirados
CREATE TRIGGER trigger_clean_expired_challenges
    AFTER INSERT ON public.verification_challenges
    EXECUTE FUNCTION clean_expired_challenges();

-- 7. Otorgar permisos necesarios
GRANT USAGE ON SCHEMA public TO service_role, postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
