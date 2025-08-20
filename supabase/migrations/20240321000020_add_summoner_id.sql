-- Agregar campo summoner_id a riot_accounts para cachear el ID del summoner
ALTER TABLE public.riot_accounts
  ADD COLUMN IF NOT EXISTS summoner_id varchar(63);

-- Crear índice para búsquedas rápidas por summoner_id
CREATE INDEX IF NOT EXISTS idx_riot_accounts_summoner_id
  ON public.riot_accounts(summoner_id);

-- Comentario para documentar el propósito del campo
COMMENT ON COLUMN public.riot_accounts.summoner_id IS 'Cache del summoner_id para evitar llamadas repetidas a la API de Riot';
