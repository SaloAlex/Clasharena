-- Primero, vamos a crear un tipo enum para los modos de juego
DO $$ BEGIN
    CREATE TYPE game_mode AS ENUM (
        'RANKED_SOLO',
        'RANKED_FLEX',
        'NORMAL_DRAFT',
        'NORMAL_BLIND',
        'ARAM'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear una tabla para almacenar la configuración de colas por torneo
CREATE TABLE IF NOT EXISTS tournament_queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    queue_type game_mode NOT NULL,
    queue_id INTEGER NOT NULL, -- ID de la cola (420, 440, etc.)
    enabled BOOLEAN DEFAULT true,
    point_multiplier DECIMAL(3,2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tournament_id, queue_type)
);

-- Modificar la tabla de torneos
ALTER TABLE tournaments
    DROP COLUMN IF EXISTS queues,
    ADD COLUMN IF NOT EXISTS allowed_queues JSONB DEFAULT '{
        "RANKED_SOLO": {"enabled": true, "queue_id": 420, "point_multiplier": 1.00},
        "RANKED_FLEX": {"enabled": true, "queue_id": 440, "point_multiplier": 0.80},
        "NORMAL_DRAFT": {"enabled": false, "queue_id": 400, "point_multiplier": 0.60},
        "NORMAL_BLIND": {"enabled": false, "queue_id": 430, "point_multiplier": 0.50},
        "ARAM": {"enabled": false, "queue_id": 450, "point_multiplier": 0.40}
    }'::jsonb;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_tournament_queues_tournament_id ON tournament_queues(tournament_id);

-- Crear políticas de seguridad
ALTER TABLE tournament_queues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver configuración de colas"
    ON tournament_queues FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Solo el creador puede modificar configuración de colas"
    ON tournament_queues FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tournaments t
            WHERE t.id = tournament_queues.tournament_id
            AND t.creator_id = auth.uid()
        )
    );

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_tournament_queues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp
CREATE TRIGGER update_tournament_queues_timestamp
    BEFORE UPDATE ON tournament_queues
    FOR EACH ROW
    EXECUTE FUNCTION update_tournament_queues_updated_at();
