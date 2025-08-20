-- Extensiones útiles
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Permisos a nivel de esquema
GRANT USAGE ON SCHEMA public TO postgres, service_role, authenticated, anon;

-- 2. Permisos sobre todas las tablas/secuencias actuales
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- 3. Permisos por defecto para FUTURAS tablas/secuencias
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON SEQUENCES TO service_role;

-- 4. Verificación de permisos
SELECT 
    has_table_privilege('authenticated', 'public.tournaments', 'SELECT') as auth_can_select,
    has_table_privilege('anon', 'public.tournaments', 'SELECT') as anon_can_select,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'tournaments') as rls_enabled;

