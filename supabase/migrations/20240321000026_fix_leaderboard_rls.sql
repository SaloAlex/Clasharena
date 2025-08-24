-- Corregir RLS para que el leaderboard pueda leer match_records
-- Opción A: Permitir lectura pública para fines de leaderboard

-- Asegurar que RLS esté habilitado
ALTER TABLE public.match_records ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública de partidas (para leaderboard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'match_records' 
    AND policyname = 'public_read_match_records_for_leaderboard'
  ) THEN
    CREATE POLICY "public_read_match_records_for_leaderboard"
    ON public.match_records
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- También permitir lectura de tournament_registrations para el leaderboard
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tournament_registrations' 
    AND policyname = 'public_read_registrations_for_leaderboard'
  ) THEN
    CREATE POLICY "public_read_registrations_for_leaderboard"
    ON public.tournament_registrations
    FOR SELECT
    USING (true);
  END IF;
END $$;


