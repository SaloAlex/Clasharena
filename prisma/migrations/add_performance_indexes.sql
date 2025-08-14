-- Agregar índices para mejorar el rendimiento de las consultas

-- Índice para tournament_points por torneo y usuario
CREATE INDEX IF NOT EXISTS idx_tournament_points_tournament_user 
ON tournament_points(tournament_id, user_id);

-- Índice para tournament_points por match_id
CREATE INDEX IF NOT EXISTS idx_tournament_points_match 
ON tournament_points(match_id);

-- Índice para match_records por puuid y gameStart
CREATE INDEX IF NOT EXISTS idx_match_records_puuid_gamestart 
ON match_records(puuid, game_start);

-- Índice para match_records por routing
CREATE INDEX IF NOT EXISTS idx_match_records_routing 
ON match_records(routing);

-- Índice para linked_accounts por usuario y juego
CREATE INDEX IF NOT EXISTS idx_linked_accounts_user_game 
ON linked_accounts(user_id, game);

-- Índice para linked_accounts por puuid
CREATE INDEX IF NOT EXISTS idx_linked_accounts_puuid 
ON linked_accounts(puuid);

-- Índice para tournament_registrations por torneo
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament 
ON tournament_registrations(tournament_id);

-- Índice para tournament_registrations por usuario
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user 
ON tournament_registrations(user_id);

-- Índice compuesto para tournaments por status y fechas
CREATE INDEX IF NOT EXISTS idx_tournaments_status_dates 
ON tournaments(status, start_at, end_at);

-- Índice para users por email
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- Índice para búsqueda de summoner names
CREATE INDEX IF NOT EXISTS idx_linked_accounts_summoner_name 
ON linked_accounts(summoner_name);

-- Índice para tournament_points por razón
CREATE INDEX IF NOT EXISTS idx_tournament_points_reason 
ON tournament_points(reason);

-- Índice para match_records por queue
CREATE INDEX IF NOT EXISTS idx_match_records_queue 
ON match_records(queue);

-- Índice para match_records por win
CREATE INDEX IF NOT EXISTS idx_match_records_win 
ON match_records(win);

-- Índice compuesto para leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_composite 
ON tournament_points(tournament_id, user_id, points DESC, created_at DESC);

-- Índice para búsqueda de partidas por fecha
CREATE INDEX IF NOT EXISTS idx_match_records_processed_at 
ON match_records(processed_at);

-- Índice para linked_accounts por región
CREATE INDEX IF NOT EXISTS idx_linked_accounts_routing 
ON linked_accounts(routing);
