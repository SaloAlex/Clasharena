-- Eliminar todas las tablas existentes
DROP TABLE IF EXISTS public.tournament_points CASCADE;
DROP TABLE IF EXISTS public.match_records CASCADE;
DROP TABLE IF EXISTS public.tournament_registrations CASCADE;
DROP TABLE IF EXISTS public.tournament_admins CASCADE;
DROP TABLE IF EXISTS public.tournaments CASCADE;
DROP TABLE IF EXISTS public.verification_challenges CASCADE;
DROP TABLE IF EXISTS public.riot_accounts CASCADE;

-- Crear solo las tablas necesarias
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.tournament_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    summoner_name VARCHAR(50) NOT NULL,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

CREATE TABLE public.match_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    registration_id UUID REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
    match_id TEXT NOT NULL,
    win BOOLEAN NOT NULL,
    points_earned INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, registration_id)
);

-- Deshabilitar RLS en todas las tablas
ALTER TABLE public.tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_records DISABLE ROW LEVEL SECURITY;

-- Índices básicos
CREATE INDEX idx_tournaments_creator ON public.tournaments(creator_id);
CREATE INDEX idx_tournaments_dates ON public.tournaments(start_at, end_at);
CREATE INDEX idx_registrations_tournament ON public.tournament_registrations(tournament_id);
CREATE INDEX idx_registrations_user ON public.tournament_registrations(user_id);
CREATE INDEX idx_match_records_tournament ON public.match_records(tournament_id);
CREATE INDEX idx_match_records_registration ON public.match_records(registration_id);
