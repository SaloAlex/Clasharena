-- 1. Deshabilitamos RLS temporalmente
ALTER TABLE public.riot_verification_challenges DISABLE ROW LEVEL SECURITY;

-- 2. Eliminamos políticas existentes
DROP POLICY IF EXISTS "Enable all access for service role" ON public.riot_verification_challenges;

-- 3. Habilitamos RLS nuevamente
ALTER TABLE public.riot_verification_challenges ENABLE ROW LEVEL SECURITY;

-- 4. Creamos política que permite todas las operaciones
CREATE POLICY "Enable all access for service role"
ON public.riot_verification_challenges
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Otorgamos permisos necesarios
GRANT ALL ON public.riot_verification_challenges TO service_role;
GRANT ALL ON public.riot_verification_challenges TO authenticated;
GRANT ALL ON public.riot_verification_challenges TO postgres;

-- 6. Aseguramos que la secuencia del ID también tenga los permisos correctos
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
