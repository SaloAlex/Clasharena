-- Tabla para ajustes manuales de puntos
create table tournament_point_adjustments (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references tournaments(id) not null,
  user_id uuid references users(id) not null,
  points int not null,
  reason text not null,
  evidence_url text, -- URL de la evidencia (captura de pantalla, etc.)
  match_id text, -- ID de la partida de Riot (opcional)
  match_date timestamp with time zone, -- Fecha de la partida
  created_at timestamp with time zone default now(),
  created_by uuid references users(id) not null, -- Admin que hizo el ajuste
  notes text -- Notas internas
);

-- Índices para búsquedas comunes
create index idx_tournament_point_adjustments_tournament_id on tournament_point_adjustments(tournament_id);
create index idx_tournament_point_adjustments_user_id on tournament_point_adjustments(user_id);

-- Políticas de seguridad
alter table tournament_point_adjustments enable row level security;

-- Solo los administradores pueden ver y crear ajustes
create policy "Admins can manage point adjustments"
  on tournament_point_adjustments
  for all
  using (auth.uid() in (
    select user_id from tournament_admins 
    where tournament_id = tournament_point_adjustments.tournament_id
  ));

-- Los usuarios pueden ver sus propios ajustes
create policy "Users can view their own adjustments"
  on tournament_point_adjustments
  for select
  using (auth.uid() = user_id);

-- Vista para el total de puntos incluyendo ajustes
create or replace view tournament_points_with_adjustments as
select 
  tp.tournament_id,
  tp.user_id,
  tp.match_id,
  tp.points as original_points,
  coalesce(tpa.points, 0) as adjustment_points,
  (tp.points + coalesce(tpa.points, 0)) as total_points,
  tp.created_at,
  tp.reason as original_reason,
  tpa.reason as adjustment_reason,
  tpa.evidence_url,
  tpa.match_date as adjustment_match_date,
  tpa.created_by as adjusted_by
from tournament_points tp
left join tournament_point_adjustments tpa 
  on tp.tournament_id = tpa.tournament_id 
  and tp.user_id = tpa.user_id
  and tp.match_id = tpa.match_id;
