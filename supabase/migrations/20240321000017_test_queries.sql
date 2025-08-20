-- 1. Prueba de SELECT
SELECT * FROM public.tournaments LIMIT 1;

-- 2. Prueba de INSERT
INSERT INTO public.tournaments (
    creator_id,
    title,
    description,
    format,
    start_at,
    end_at,
    status,
    points_per_win,
    points_per_loss,
    queues,
    prizes
) VALUES (
    auth.uid(),  -- Esto usará tu ID de usuario actual
    'Torneo de Prueba',
    'Descripción de prueba',
    'league',
    NOW(),
    NOW() + interval '7 days',
    'upcoming',
    100,
    0,
    '{
        "ranked_solo": {"enabled": true, "multiplier": 1.0},
        "ranked_flex": {"enabled": true, "multiplier": 0.8},
        "normal_draft": {"enabled": false, "multiplier": 0.6}
    }',
    '{"first": "1000 RP", "second": "500 RP", "third": "250 RP"}'
) RETURNING *;

-- 3. Verificar permisos nuevamente
SELECT 
    has_table_privilege('authenticated', 'public.tournaments', 'SELECT') as auth_can_select,
    has_table_privilege('anon', 'public.tournaments', 'SELECT') as anon_can_select,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'tournaments') as rls_enabled;

