-- 1. Eliminar duplicados dejando el más reciente por usuario
WITH ranked AS (
  SELECT id, user_id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM public.riot_accounts
)
DELETE FROM public.riot_accounts ra
USING ranked r
WHERE ra.id = r.id AND r.rn > 1;

-- 2. Crear la restricción única por usuario
ALTER TABLE public.riot_accounts
  ADD CONSTRAINT riot_accounts_user_unique UNIQUE (user_id);

-- 3. Verificar que las restricciones se crearon correctamente
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'riot_accounts';





