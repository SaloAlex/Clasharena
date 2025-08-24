-- Agregar columnas faltantes a la tabla tournaments
-- Estas columnas se están usando en el código pero no existen en la BD

-- Agregar columnas para puntos adicionales
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS points_first_blood INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS points_first_tower INTEGER NOT NULL DEFAULT 20,
ADD COLUMN IF NOT EXISTS points_perfect_game INTEGER NOT NULL DEFAULT 50;

-- Agregar columnas para restricciones de rango
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS min_rank VARCHAR(20) NOT NULL DEFAULT 'NONE',
ADD COLUMN IF NOT EXISTS max_rank VARCHAR(20) NOT NULL DEFAULT 'NONE';

-- Agregar columna para límite de partidas por día
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS max_games_per_day INTEGER NOT NULL DEFAULT 0;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_tournaments_min_rank ON public.tournaments(min_rank);
CREATE INDEX IF NOT EXISTS idx_tournaments_max_rank ON public.tournaments(max_rank);
CREATE INDEX IF NOT EXISTS idx_tournaments_max_games_per_day ON public.tournaments(max_games_per_day);

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN public.tournaments.points_first_blood IS 'Puntos por conseguir primera sangre';
COMMENT ON COLUMN public.tournaments.points_first_tower IS 'Puntos por destruir primera torre';
COMMENT ON COLUMN public.tournaments.points_perfect_game IS 'Puntos por partida perfecta (victoria + 0 muertes + 0 torres perdidas)';
COMMENT ON COLUMN public.tournaments.min_rank IS 'Rango mínimo requerido para participar (NONE = sin mínimo)';
COMMENT ON COLUMN public.tournaments.max_rank IS 'Rango máximo permitido para participar (NONE = sin máximo)';
COMMENT ON COLUMN public.tournaments.max_games_per_day IS 'Máximo número de partidas por día (0 = sin límite)';
