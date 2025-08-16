-- Primero eliminamos las columnas si existen
ALTER TABLE public.tournaments
    DROP COLUMN IF EXISTS queues,
    DROP COLUMN IF EXISTS custom_rules,
    DROP COLUMN IF EXISTS prizes;

-- Luego las agregamos con los tipos correctos
ALTER TABLE public.tournaments
    ADD COLUMN queues JSONB,
    ADD COLUMN custom_rules TEXT,
    ADD COLUMN prizes JSONB;

-- Actualizamos las columnas con valores por defecto
UPDATE public.tournaments
SET 
    queues = '{
        "ranked_solo": {"enabled": true, "pointMultiplier": 1.0},
        "ranked_flex": {"enabled": true, "pointMultiplier": 0.8},
        "normal_draft": {"enabled": false, "pointMultiplier": 0.6},
        "normal_blind": {"enabled": false, "pointMultiplier": 0.5},
        "aram": {"enabled": false, "pointMultiplier": 0.4}
    }'::jsonb,
    prizes = '{"first": "", "second": "", "third": ""}'::jsonb
WHERE queues IS NULL;

-- Asegurarnos de que las columnas de fecha tienen el tipo correcto
ALTER TABLE public.tournaments
    ALTER COLUMN start_at TYPE TIMESTAMP WITH TIME ZONE USING start_at::TIMESTAMP WITH TIME ZONE,
    ALTER COLUMN end_at TYPE TIMESTAMP WITH TIME ZONE USING end_at::TIMESTAMP WITH TIME ZONE;

-- Agregar índices si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tournaments_dates') THEN
        CREATE INDEX idx_tournaments_dates ON public.tournaments(start_at, end_at);
    END IF;
END$$;