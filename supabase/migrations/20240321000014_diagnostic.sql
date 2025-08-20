-- Verificar todas las tablas en el esquema public
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar si la tabla tournament_registrations existe y sus detalles
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'tournament_registrations'
);

-- Ver las políticas RLS existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Ver los triggers existentes
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    tgtype,
    proname AS function_name,
    nspname AS schema_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE tgrelid::regclass::text LIKE 'public.%'
ORDER BY table_name, trigger_name;
