-- ========================================
-- ARREGLAR SEGURIDAD: RLS + POLÍTICAS
-- ========================================

-- 0) Habilitar RLS en todas las tablas principales
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_records ENABLE ROW LEVEL SECURITY;

-- 1) TOURNAMENTS - Políticas
-- Lectura: cualquiera puede ver torneos publicados, creador ve todo
DROP POLICY IF EXISTS tournaments_select_public ON public.tournaments;
CREATE POLICY tournaments_select_public
ON public.tournaments
FOR SELECT TO anon, authenticated
USING (
  status IN ('upcoming','active','completed')
  OR creator_id = auth.uid()
);

-- Insertar: sólo el creador
DROP POLICY IF EXISTS tournaments_insert_own ON public.tournaments;
CREATE POLICY tournaments_insert_own
ON public.tournaments
FOR INSERT TO authenticated
WITH CHECK (creator_id = auth.uid());

-- Actualizar: sólo el creador
DROP POLICY IF EXISTS tournaments_update_own ON public.tournaments;
CREATE POLICY tournaments_update_own
ON public.tournaments
FOR UPDATE TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

-- Eliminar: sólo el creador
DROP POLICY IF EXISTS tournaments_delete_own ON public.tournaments;
CREATE POLICY tournaments_delete_own
ON public.tournaments
FOR DELETE TO authenticated
USING (creator_id = auth.uid());

-- 2) TOURNAMENT_REGISTRATIONS - Políticas
-- Ver: usuario ve sus inscripciones, creador ve todas de sus torneos
DROP POLICY IF EXISTS regs_select_own_or_owner ON public.tournament_registrations;
CREATE POLICY regs_select_own_or_owner
ON public.tournament_registrations
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.tournaments t
    WHERE t.id = tournament_id
      AND t.creator_id = auth.uid()
  )
);

-- Insertar: sólo el usuario
DROP POLICY IF EXISTS regs_insert_own ON public.tournament_registrations;
CREATE POLICY regs_insert_own
ON public.tournament_registrations
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Actualizar: sólo el usuario
DROP POLICY IF EXISTS regs_update_own ON public.tournament_registrations;
CREATE POLICY regs_update_own
ON public.tournament_registrations
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Eliminar: sólo el usuario
DROP POLICY IF EXISTS regs_delete_own ON public.tournament_registrations;
CREATE POLICY regs_delete_own
ON public.tournament_registrations
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- 3) MATCH_RECORDS - Políticas
-- Ver: jugador dueño de la inscripción o organizador del torneo
DROP POLICY IF EXISTS matches_select_player_or_owner ON public.match_records;
CREATE POLICY matches_select_player_or_owner
ON public.match_records
FOR SELECT TO authenticated
USING (
  -- dueñ@ de la inscripción
  EXISTS (
    SELECT 1
    FROM public.tournament_registrations tr
    WHERE tr.id = registration_id
      AND tr.user_id = auth.uid()
  )
  OR
  -- organizador del torneo
  EXISTS (
    SELECT 1
    FROM public.tournament_registrations tr
    JOIN public.tournaments t ON t.id = tr.tournament_id
    WHERE tr.id = registration_id
      AND t.creator_id = auth.uid()
  )
);

-- ========================================
-- ARREGLAR WARNING DE FUNCIÓN
-- ========================================

-- Fijar search_path de la función trigger
ALTER FUNCTION public.tg_touch_updated_at() SET search_path = public;

-- ========================================
-- ÍNDICES ÚTILES (OPCIONAL)
-- ========================================

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_regs_user ON public.tournament_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_regs_tournament ON public.tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_reg ON public.match_records(registration_id);
CREATE INDEX IF NOT EXISTS idx_matches_game_start ON public.match_records(game_start DESC);

-- Comentarios para documentar
COMMENT ON TABLE public.tournaments IS 'Torneos con RLS habilitado - usuarios autenticados pueden crear, ver torneos públicos';
COMMENT ON TABLE public.tournament_registrations IS 'Inscripciones con RLS - usuarios ven sus propias inscripciones, creadores ven todas de sus torneos';
COMMENT ON TABLE public.match_records IS 'Registros de partidas con RLS - jugadores y organizadores pueden ver partidas relevantes';
