-- Tabla para administradores de torneos
create table if not exists tournament_admins (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references tournaments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  created_by uuid references auth.users(id),
  
  -- Asegurar que un usuario solo puede ser admin una vez por torneo
  unique(tournament_id, user_id)
);

-- Índices
create index if not exists idx_tournament_admins_tournament_id on tournament_admins(tournament_id);
create index if not exists idx_tournament_admins_user_id on tournament_admins(user_id);

-- Políticas de seguridad
alter table tournament_admins enable row level security;

-- Cualquiera puede ver los admins
create policy "Cualquiera puede ver los admins"
  on tournament_admins
  for select
  using (true);

-- Solo el creador del torneo puede agregar/eliminar admins
create policy "Solo el creador del torneo puede gestionar admins"
  on tournament_admins
  for all
  using (
    auth.uid() in (
      select creator_id 
      from tournaments 
      where id = tournament_admins.tournament_id
    )
  );

-- Por defecto, el creador del torneo es admin
create or replace function add_tournament_creator_as_admin()
returns trigger as $$
begin
  insert into tournament_admins (tournament_id, user_id, created_by)
  values (new.id, new.creator_id, new.creator_id);
  return new;
end;
$$ language plpgsql;

create trigger tournament_creator_admin_trigger
  after insert on tournaments
  for each row
  execute function add_tournament_creator_as_admin();
