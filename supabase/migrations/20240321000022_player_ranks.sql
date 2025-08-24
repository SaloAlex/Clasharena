-- Crear tabla para almacenar rangos de jugadores
CREATE TABLE IF NOT EXISTS player_ranks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puuid TEXT NOT NULL,
  platform TEXT NOT NULL,
  solo_q JSONB, -- { tier, rank, lp, wins, losses, hotStreak, value }
  flex JSONB,   -- { tier, rank, lp, wins, losses, hotStreak, value }
  summoner_name TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para búsquedas eficientes
  UNIQUE(user_id, puuid)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_player_ranks_user_id ON player_ranks(user_id);
CREATE INDEX IF NOT EXISTS idx_player_ranks_puuid ON player_ranks(puuid);
CREATE INDEX IF NOT EXISTS idx_player_ranks_fetched_at ON player_ranks(fetched_at);

-- Habilitar RLS
ALTER TABLE player_ranks ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can view their own ranks" ON player_ranks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ranks" ON player_ranks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ranks" ON player_ranks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ranks" ON player_ranks
  FOR DELETE USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_player_ranks_updated_at 
  BEFORE UPDATE ON player_ranks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

