-- Habilitar RLS en linked_riot_accounts
ALTER TABLE public.linked_riot_accounts ENABLE ROW LEVEL SECURITY;

-- Políticas para linked_riot_accounts
CREATE POLICY "Usuarios pueden ver sus propias cuentas vinculadas"
ON public.linked_riot_accounts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propias cuentas vinculadas"
ON public.linked_riot_accounts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias cuentas vinculadas"
ON public.linked_riot_accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias cuentas vinculadas"
ON public.linked_riot_accounts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Política para el service role (para operaciones desde el backend)
CREATE POLICY "Service role tiene acceso completo"
ON public.linked_riot_accounts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
