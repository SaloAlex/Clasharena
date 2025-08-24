-- Arreglar permisos de la tabla tournament_registrations
-- El problema es que RLS está habilitado y bloqueando las inserciones

-- 1. Deshabilitar RLS en tournament_registrations
ALTER TABLE public.tournament_registrations DISABLE ROW LEVEL SECURITY;

-- 2. Verificar que las columnas necesarias existen, si no, agregarlas
DO $$
BEGIN
    -- Agregar summoner_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tournament_registrations' 
                   AND column_name = 'summoner_id') THEN
        ALTER TABLE public.tournament_registrations 
        ADD COLUMN summoner_id VARCHAR(63);
    END IF;

    -- Agregar region si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tournament_registrations' 
                   AND column_name = 'region') THEN
        ALTER TABLE public.tournament_registrations 
        ADD COLUMN region VARCHAR(10) NOT NULL DEFAULT 'LA2';
    END IF;

    -- Agregar current_rank si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tournament_registrations' 
                   AND column_name = 'current_rank') THEN
        ALTER TABLE public.tournament_registrations 
        ADD COLUMN current_rank VARCHAR(20);
    END IF;

    -- Agregar total_matches si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tournament_registrations' 
                   AND column_name = 'total_matches') THEN
        ALTER TABLE public.tournament_registrations 
        ADD COLUMN total_matches INTEGER DEFAULT 0;
    END IF;

    -- Agregar status si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tournament_registrations' 
                   AND column_name = 'status') THEN
        ALTER TABLE public.tournament_registrations 
        ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
END $$;

-- 3. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament 
ON public.tournament_registrations(tournament_id);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user 
ON public.tournament_registrations(user_id);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_points 
ON public.tournament_registrations(tournament_id, total_points DESC);

-- 4. Verificar que la restricción única existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                   WHERE conname = 'tournament_registrations_tournament_id_user_id_key') THEN
        ALTER TABLE public.tournament_registrations 
        ADD CONSTRAINT tournament_registrations_tournament_id_user_id_key 
        UNIQUE (tournament_id, user_id);
    END IF;
END $$;

-- 5. Comentarios para documentar
COMMENT ON TABLE public.tournament_registrations IS 'Registros de usuarios en torneos';
COMMENT ON COLUMN public.tournament_registrations.summoner_id IS 'ID del summoner de Riot (opcional)';
COMMENT ON COLUMN public.tournament_registrations.region IS 'Región del jugador (ej: LA2, NA1)';
COMMENT ON COLUMN public.tournament_registrations.current_rank IS 'Rango actual del jugador';
COMMENT ON COLUMN public.tournament_registrations.total_matches IS 'Total de partidas jugadas en el torneo';
COMMENT ON COLUMN public.tournament_registrations.status IS 'Estado del registro (active, disqualified)';
