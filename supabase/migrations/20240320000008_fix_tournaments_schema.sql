-- Verificar y agregar las columnas que faltan en la tabla tournaments

-- Agregar columna queues si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tournaments' AND column_name = 'queues') THEN
        ALTER TABLE public.tournaments ADD COLUMN queues JSONB DEFAULT '{
            "ranked_solo": {"enabled": true, "pointMultiplier": 1.0, "id": 420},
            "ranked_flex": {"enabled": true, "pointMultiplier": 0.8, "id": 440},
            "normal_draft": {"enabled": false, "pointMultiplier": 0.6, "id": 400},
            "normal_blind": {"enabled": false, "pointMultiplier": 0.5, "id": 430},
            "aram": {"enabled": false, "pointMultiplier": 0.4, "id": 450}
        }'::jsonb;
    END IF;
END $$;

-- Agregar columna custom_rules si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tournaments' AND column_name = 'custom_rules') THEN
        ALTER TABLE public.tournaments ADD COLUMN custom_rules TEXT;
    END IF;
END $$;

-- Agregar columna prizes si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tournaments' AND column_name = 'prizes') THEN
        ALTER TABLE public.tournaments ADD COLUMN prizes JSONB DEFAULT '{"first": "", "second": "", "third": ""}'::jsonb;
    END IF;
END $$;

-- Verificar si las columnas de fecha son start_at/end_at o start_date/end_date
DO $$ 
BEGIN
    -- Si existe start_date pero no start_at, renombrar
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tournaments' AND column_name = 'start_date') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'tournaments' AND column_name = 'start_at') THEN
        ALTER TABLE public.tournaments RENAME COLUMN start_date TO start_at;
    END IF;
    
    -- Si existe end_date pero no end_at, renombrar
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tournaments' AND column_name = 'end_date') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'tournaments' AND column_name = 'end_at') THEN
        ALTER TABLE public.tournaments RENAME COLUMN end_date TO end_at;
    END IF;
END $$;
