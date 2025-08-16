-- Tabla para registros de partidas
CREATE TABLE IF NOT EXISTS public.match_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id TEXT NOT NULL,
    puuid TEXT NOT NULL,
    platform TEXT NOT NULL,
    queue_id INTEGER NOT NULL,
    game_start TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_sec INTEGER NOT NULL,
    win BOOLEAN NOT NULL,
    kills INTEGER NOT NULL,
    deaths INTEGER NOT NULL,
    assists INTEGER NOT NULL,
    champion_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, puuid)
);

-- Tabla para puntos de torneo
CREATE TABLE IF NOT EXISTS public.tournament_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    match_id TEXT NOT NULL,
    points INTEGER NOT NULL,
    reasons TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, user_id, match_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_match_records_puuid ON public.match_records(puuid);
CREATE INDEX IF NOT EXISTS idx_match_records_game_start ON public.match_records(game_start DESC);
CREATE INDEX IF NOT EXISTS idx_tournament_points_tournament ON public.tournament_points(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_points_user ON public.tournament_points(user_id);

-- RLS
ALTER TABLE public.match_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_points ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuarios pueden ver sus partidas"
ON public.match_records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios pueden ver puntos de torneo"
ON public.tournament_points FOR SELECT
TO authenticated
USING (true);
