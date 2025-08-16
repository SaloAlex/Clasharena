-- Agregar columnas para la clasificación a tournament_registrations
ALTER TABLE public.tournament_registrations
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0;

-- Crear índice para ordenar por puntos
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_points 
ON public.tournament_registrations(tournament_id, points DESC);

-- Actualizar RLS policies para permitir ver la clasificación
CREATE POLICY "Cualquiera puede ver la clasificación"
ON public.tournament_registrations FOR SELECT
TO public
USING (true);
