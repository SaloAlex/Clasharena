-- Corregir tabla match_records para evitar fallas de inserción
-- 1. Agregar DEFAULT para id y created_at
-- 2. Agregar constraint único para evitar duplicados

-- Crear extensión pgcrypto si no existe
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Corregir columnas con DEFAULT
ALTER TABLE public.match_records
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN created_at SET DEFAULT now();

-- Agregar constraint único para evitar duplicados por registro
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uniq_match_per_registration'
  ) THEN
    ALTER TABLE public.match_records
      ADD CONSTRAINT uniq_match_per_registration
      UNIQUE (registration_id, match_id);
  END IF;
END $$;

-- Verificar que los cambios se aplicaron correctamente
SELECT 
  column_name, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'match_records' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'created_at')
ORDER BY column_name;
