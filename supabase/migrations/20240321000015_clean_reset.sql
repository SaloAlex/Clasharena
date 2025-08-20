-- 1. Primero, forzar la eliminación completa del esquema y recrearlo
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- 2. Crear la tabla tournaments primero (ya que es referenciada por las otras)
CREATE TABLE public.tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    format VARCHAR(50) NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    points_per_win INTEGER NOT NULL DEFAULT 100,
    points_per_loss INTEGER NOT NULL DEFAULT 0,
    queues JSONB NOT NULL DEFAULT '{
        "ranked_solo": {"enabled": true, "multiplier": 1.0},
        "ranked_flex": {"enabled": true, "multiplier": 0.8},
        "normal_draft": {"enabled": false, "multiplier": 0.6}
    }',
    prizes JSONB DEFAULT '{"first": "", "second": "", "third": ""}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear la tabla tournament_registrations
CREATE TABLE public.tournament_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    summoner_name VARCHAR(50) NOT NULL,
    summoner_id VARCHAR(63),
    region VARCHAR(10) NOT NULL,
    current_rank VARCHAR(20),
    total_points INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

-- 4. Crear la tabla match_records
CREATE TABLE public.match_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    registration_id UUID REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
    match_id VARCHAR(20) NOT NULL,
    queue_type VARCHAR(20) NOT NULL,
    game_start TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL,
    win BOOLEAN NOT NULL,
    kills INTEGER NOT NULL DEFAULT 0,
    deaths INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    champion_id INTEGER NOT NULL,
    points_earned INTEGER NOT NULL,
    points_breakdown JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, registration_id)
);

-- 5. Crear índices para optimización
CREATE INDEX idx_tournaments_dates ON public.tournaments(start_at, end_at);
CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_tournaments_creator ON public.tournaments(creator_id);

CREATE INDEX idx_registrations_tournament ON public.tournament_registrations(tournament_id);
CREATE INDEX idx_registrations_user ON public.tournament_registrations(user_id);
CREATE INDEX idx_registrations_points ON public.tournament_registrations(tournament_id, total_points DESC);

CREATE INDEX idx_matches_tournament ON public.match_records(tournament_id);
CREATE INDEX idx_matches_registration ON public.match_records(registration_id);
CREATE INDEX idx_matches_date ON public.match_records(game_start DESC);

-- 6. Deshabilitar RLS en todas las tablas
ALTER TABLE public.tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_records DISABLE ROW LEVEL SECURITY;

-- 7. Verificar que las tablas se crearon correctamente
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
