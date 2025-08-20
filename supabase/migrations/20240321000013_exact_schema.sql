-- Primero eliminamos las tablas si existen (en orden correcto por las dependencias)
DROP TABLE IF EXISTS public.match_records CASCADE;
DROP TABLE IF EXISTS public.tournament_registrations CASCADE;
DROP TABLE IF EXISTS public.tournaments CASCADE;

-- Ahora creamos las tablas exactamente como están en las imágenes

-- 1. Tabla tournaments
CREATE TABLE public.tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- Referencia al creador del torneo
    title VARCHAR(255) NOT NULL,                                 -- Título del torneo
    description TEXT,                                           -- Descripción detallada
    format VARCHAR(50) NOT NULL,                                -- Formato (liga, eliminación, etc.)
    start_at TIMESTAMPTZ NOT NULL,                             -- Fecha de inicio
    end_at TIMESTAMPTZ NOT NULL,                               -- Fecha de fin
    status VARCHAR(50) NOT NULL DEFAULT 'draft',               -- Estado (draft, active, completed)
    points_per_win INTEGER NOT NULL DEFAULT 100,               -- Puntos por victoria
    points_per_loss INTEGER NOT NULL DEFAULT 0,                -- Puntos por derrota
    queues JSONB NOT NULL DEFAULT '{
        "ranked_solo": {"enabled": true, "multiplier": 1.0},
        "ranked_flex": {"enabled": true, "multiplier": 0.8},
        "normal_draft": {"enabled": false, "multiplier": 0.6}
    }',                                                        -- Colas habilitadas y multiplicadores
    prizes JSONB DEFAULT '{"first": "", "second": "", "third": ""}',  -- Premios
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla tournament_registrations
CREATE TABLE public.tournament_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,  -- Torneo al que pertenece
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,              -- Usuario registrado
    summoner_name VARCHAR(50) NOT NULL,                                    -- Nombre de invocador
    summoner_id VARCHAR(63),                                              -- ID de invocador de Riot
    region VARCHAR(10) NOT NULL,                                          -- Región del jugador
    current_rank VARCHAR(20),                                             -- Rango actual
    total_points INTEGER DEFAULT 0,                                       -- Puntos totales
    total_matches INTEGER DEFAULT 0,                                      -- Partidas jugadas
    status VARCHAR(20) DEFAULT 'active',                                  -- Estado (active, disqualified)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)                                        -- Un usuario solo puede registrarse una vez
);

-- 3. Tabla match_records
CREATE TABLE public.match_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,     -- Torneo al que pertenece
    registration_id UUID REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,  -- Participante
    match_id VARCHAR(20) NOT NULL,                                             -- ID de la partida de Riot
    queue_type VARCHAR(20) NOT NULL,                                           -- Tipo de cola (ranked_solo, etc)
    game_start TIMESTAMPTZ NOT NULL,                                          -- Inicio de la partida
    duration INTEGER NOT NULL,                                                -- Duración en segundos
    win BOOLEAN NOT NULL,                                                     -- Victoria/Derrota
    kills INTEGER NOT NULL DEFAULT 0,                                         -- Estadísticas
    deaths INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    champion_id INTEGER NOT NULL,                                             -- Campeón usado
    points_earned INTEGER NOT NULL,                                           -- Puntos ganados
    points_breakdown JSONB NOT NULL DEFAULT '{}',                             -- Desglose de puntos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, registration_id)                                         -- Evitar duplicados
);

-- Índices para optimización
CREATE INDEX idx_tournaments_dates ON public.tournaments(start_at, end_at);
CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_tournaments_creator ON public.tournaments(creator_id);

CREATE INDEX idx_registrations_tournament ON public.tournament_registrations(tournament_id);
CREATE INDEX idx_registrations_user ON public.tournament_registrations(user_id);
CREATE INDEX idx_registrations_points ON public.tournament_registrations(tournament_id, total_points DESC);
CREATE INDEX idx_registrations_status ON public.tournament_registrations(status);

CREATE INDEX idx_matches_tournament ON public.match_records(tournament_id);
CREATE INDEX idx_matches_registration ON public.match_records(registration_id);
CREATE INDEX idx_matches_date ON public.match_records(game_start DESC);

-- Deshabilitar RLS
ALTER TABLE public.tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_records DISABLE ROW LEVEL SECURITY;
