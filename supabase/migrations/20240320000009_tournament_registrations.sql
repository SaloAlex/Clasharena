-- Crear tabla de registros de torneos
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- UUID del usuario de auth.users
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

-- Índices
CREATE INDEX idx_tournament_registrations_tournament_id ON public.tournament_registrations(tournament_id);
CREATE INDEX idx_tournament_registrations_user_id ON public.tournament_registrations(user_id);

-- RLS
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuarios pueden ver registros de torneos"
ON public.tournament_registrations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios pueden inscribirse a torneos"
ON public.tournament_registrations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden cancelar su inscripción"
ON public.tournament_registrations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
