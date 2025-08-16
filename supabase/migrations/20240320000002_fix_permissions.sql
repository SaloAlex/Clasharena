-- 1. Primero, deshabilitamos RLS temporalmente
ALTER TABLE public.linked_riot_accounts DISABLE ROW LEVEL SECURITY;

-- 2. Eliminamos todas las políticas existentes para empezar desde cero
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias cuentas vinculadas" ON public.linked_riot_accounts;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias cuentas vinculadas" ON public.linked_riot_accounts;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias cuentas vinculadas" ON public.linked_riot_accounts;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias cuentas vinculadas" ON public.linked_riot_accounts;
DROP POLICY IF EXISTS "Service role tiene acceso completo" ON public.linked_riot_accounts;

-- 3. Habilitamos RLS nuevamente
ALTER TABLE public.linked_riot_accounts ENABLE ROW LEVEL SECURITY;

-- 4. Creamos una política que permite todas las operaciones al service role
CREATE POLICY "Enable all access for service role"
ON public.linked_riot_accounts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Aseguramos que el esquema public sea accesible
GRANT USAGE ON SCHEMA public TO service_role, postgres, anon, authenticated;

-- 6. Otorgamos todos los permisos necesarios en la tabla
GRANT ALL ON public.linked_riot_accounts TO service_role;
GRANT ALL ON public.linked_riot_accounts TO authenticated;
GRANT ALL ON public.linked_riot_accounts TO postgres;
