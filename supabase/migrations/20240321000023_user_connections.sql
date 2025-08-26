-- Crear tabla para almacenar conexiones de usuarios con servicios externos (Kick, etc.)
CREATE TABLE IF NOT EXISTS public.user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Kick connection fields
  kick_id VARCHAR(255),
  kick_username VARCHAR(255),
  kick_display_name VARCHAR(255),
  kick_profile_image TEXT,
  kick_access_token TEXT,
  kick_refresh_token TEXT,
  kick_expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(user_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON public.user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_kick_id ON public.user_connections(kick_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_kick_username ON public.user_connections(kick_username);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_user_connections_touch_updated_at ON public.user_connections;
CREATE TRIGGER trg_user_connections_touch_updated_at
  BEFORE UPDATE ON public.user_connections
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- RLS
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
DROP POLICY IF EXISTS "user_connections_select_own" ON public.user_connections;
CREATE POLICY "user_connections_select_own"
  ON public.user_connections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_connections_insert_own" ON public.user_connections;
CREATE POLICY "user_connections_insert_own"
  ON public.user_connections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_connections_update_own" ON public.user_connections;
CREATE POLICY "user_connections_update_own"
  ON public.user_connections FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_connections_delete_own" ON public.user_connections;
CREATE POLICY "user_connections_delete_own"
  ON public.user_connections FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
