-- Agregar relación entre tournament_registrations y riot_accounts
ALTER TABLE public.tournament_registrations
ADD COLUMN riot_account_id UUID REFERENCES public.riot_accounts(id) ON DELETE SET NULL;

-- Crear índice para la relación
CREATE INDEX idx_tournament_registrations_riot_account 
ON public.tournament_registrations(riot_account_id);

-- Actualizar la consulta en el endpoint de scan
CREATE OR REPLACE FUNCTION get_tournament_with_registrations(tournament_id UUID)
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'tournament', t.*,
      'registrations', (
        SELECT json_agg(json_build_object(
          'registration', tr.*,
          'riot_account', ra.*
        ))
        FROM tournament_registrations tr
        LEFT JOIN riot_accounts ra ON tr.riot_account_id = ra.id
        WHERE tr.tournament_id = t.id
      )
    )
    FROM tournaments t
    WHERE t.id = tournament_id
  );
END;
$$ LANGUAGE plpgsql;
