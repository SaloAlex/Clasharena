-- Tabla de torneos
CREATE TABLE public.tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    format VARCHAR(50) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    points_per_win INTEGER NOT NULL DEFAULT 100,
    points_per_loss INTEGER NOT NULL DEFAULT 0,
    points_first_blood INTEGER NOT NULL DEFAULT 10,
    points_first_tower INTEGER NOT NULL DEFAULT 20,
    points_perfect_game INTEGER NOT NULL DEFAULT 50,
    min_rank VARCHAR(50) NOT NULL DEFAULT 'NONE',
    max_rank VARCHAR(50) NOT NULL DEFAULT 'NONE',
    max_games_per_day INTEGER NOT NULL DEFAULT 0,
    queues JSONB NOT NULL DEFAULT '{
        "ranked_solo": {"enabled": true, "pointMultiplier": 1.0},
        "ranked_flex": {"enabled": true, "pointMultiplier": 0.8},
        "normal_draft": {"enabled": false, "pointMultiplier": 0.6},
        "normal_blind": {"enabled": false, "pointMultiplier": 0.5},
        "aram": {"enabled": false, "pointMultiplier": 0.4}
    }',
    custom_rules TEXT,
    prizes JSONB NOT NULL DEFAULT '{"first": "", "second": "", "third": ""}',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tournaments_creator_id ON public.tournaments(creator_id);
CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_tournaments_dates ON public.tournaments(start_date, end_date);

-- RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Todos pueden ver torneos"
ON public.tournaments FOR SELECT
TO public
USING (true);

CREATE POLICY "Solo el creador puede crear torneos"
ON public.tournaments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Solo el creador puede actualizar torneos"
ON public.tournaments FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Solo el creador puede eliminar torneos"
ON public.tournaments FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

-- Trigger para updated_at
CREATE TRIGGER update_tournaments_updated_at
    BEFORE UPDATE ON public.tournaments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
