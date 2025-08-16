-- Enable RLS on linked_riot_accounts
ALTER TABLE public.linked_riot_accounts ENABLE ROW LEVEL SECURITY;

-- Verify existing policies for linked_riot_accounts
DO $$ 
BEGIN
    -- Service role policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'linked_riot_accounts' 
        AND policyname = 'Enable read access for service role'
    ) THEN
        CREATE POLICY "Enable read access for service role"
        ON public.linked_riot_accounts
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'linked_riot_accounts' 
        AND policyname = 'Enable insert access for service role'
    ) THEN
        CREATE POLICY "Enable insert access for service role"
        ON public.linked_riot_accounts
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'linked_riot_accounts' 
        AND policyname = 'Enable update access for service role'
    ) THEN
        CREATE POLICY "Enable update access for service role"
        ON public.linked_riot_accounts
        FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;

    -- User-specific policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'linked_riot_accounts' 
        AND policyname = 'lra_select_own'
    ) THEN
        CREATE POLICY lra_select_own
        ON public.linked_riot_accounts
        FOR SELECT
        TO authenticated
        USING (auth.uid() = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'linked_riot_accounts' 
        AND policyname = 'lra_insert_own'
    ) THEN
        CREATE POLICY lra_insert_own
        ON public.linked_riot_accounts
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'linked_riot_accounts' 
        AND policyname = 'lra_update_own'
    ) THEN
        CREATE POLICY lra_update_own
        ON public.linked_riot_accounts
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = "userId")
        WITH CHECK (auth.uid() = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'linked_riot_accounts' 
        AND policyname = 'lra_delete_own'
    ) THEN
        CREATE POLICY lra_delete_own
        ON public.linked_riot_accounts
        FOR DELETE
        TO authenticated
        USING (auth.uid() = "userId");
    END IF;
END $$;

-- Enable RLS on riot_verification_challenges
ALTER TABLE public.riot_verification_challenges ENABLE ROW LEVEL SECURITY;

-- Verify existing policies for riot_verification_challenges
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'riot_verification_challenges' 
        AND policyname = 'rvc_select_own'
    ) THEN
        CREATE POLICY rvc_select_own
        ON public.riot_verification_challenges
        FOR SELECT
        TO authenticated
        USING (auth.uid() = "userId");
    END IF;
END $$;

-- Enable RLS on riot_matches
ALTER TABLE public.riot_matches ENABLE ROW LEVEL SECURITY;

-- Verify existing policies for riot_matches
DO $$ 
BEGIN
    -- Service role policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'riot_matches' 
        AND policyname = 'Enable read access for service role'
    ) THEN
        CREATE POLICY "Enable read access for service role"
        ON public.riot_matches
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'riot_matches' 
        AND policyname = 'Enable insert access for service role'
    ) THEN
        CREATE POLICY "Enable insert access for service role"
        ON public.riot_matches
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'riot_matches' 
        AND policyname = 'Enable update access for service role'
    ) THEN
        CREATE POLICY "Enable update access for service role"
        ON public.riot_matches
        FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;

    -- User-specific policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'riot_matches' 
        AND policyname = 'rm_select_own'
    ) THEN
        CREATE POLICY rm_select_own
        ON public.riot_matches
        FOR SELECT
        TO authenticated
        USING (auth.uid() = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'riot_matches' 
        AND policyname = 'rm_insert_own'
    ) THEN
        CREATE POLICY rm_insert_own
        ON public.riot_matches
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'riot_matches' 
        AND policyname = 'rm_update_own'
    ) THEN
        CREATE POLICY rm_update_own
        ON public.riot_matches
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = "userId")
        WITH CHECK (auth.uid() = "userId");
    END IF;
END $$;

-- Enable RLS on tournament_matches
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

-- Verify existing policies for tournament_matches
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournament_matches' 
        AND policyname = 'tm_select_all'
    ) THEN
        CREATE POLICY tm_select_all
        ON public.tournament_matches
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;

-- Enable RLS on tournament_participants
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

-- Verify existing policies for tournament_participants
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournament_participants' 
        AND policyname = 'tp_select_all'
    ) THEN
        CREATE POLICY tp_select_all
        ON public.tournament_participants
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournament_participants' 
        AND policyname = 'tp_insert_own'
    ) THEN
        CREATE POLICY tp_insert_own
        ON public.tournament_participants
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = "userId");
    END IF;
END $$;

-- Enable RLS on tournament_registrations
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Verify existing policies for tournament_registrations
DO $$ 
BEGIN
    -- Service role policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournament_registrations' 
        AND policyname = 'Enable read access for service role'
    ) THEN
        CREATE POLICY "Enable read access for service role"
        ON public.tournament_registrations
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournament_registrations' 
        AND policyname = 'Enable insert access for service role'
    ) THEN
        CREATE POLICY "Enable insert access for service role"
        ON public.tournament_registrations
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
    END IF;

    -- User-specific policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournament_registrations' 
        AND policyname = 'Users can view own registrations'
    ) THEN
        CREATE POLICY "Users can view own registrations"
        ON public.tournament_registrations
        FOR SELECT
        TO authenticated
        USING (auth.uid() = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournament_registrations' 
        AND policyname = 'Users can insert own registrations'
    ) THEN
        CREATE POLICY "Users can insert own registrations"
        ON public.tournament_registrations
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = "userId");
    END IF;
END $$;

-- Enable RLS on tournaments
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Verify existing policies for tournaments
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournaments' 
        AND policyname = 'tournaments_select_all'
    ) THEN
        CREATE POLICY tournaments_select_all
        ON public.tournaments
        FOR SELECT
        TO authenticated
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournaments' 
        AND policyname = 'tournaments_insert_by_creator'
    ) THEN
        CREATE POLICY tournaments_insert_by_creator
        ON public.tournaments
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = "creatorId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournaments' 
        AND policyname = 'tournaments_update_by_creator'
    ) THEN
        CREATE POLICY tournaments_update_by_creator
        ON public.tournaments
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = "creatorId")
        WITH CHECK (auth.uid() = "creatorId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tournaments' 
        AND policyname = 'tournaments_delete_by_creator'
    ) THEN
        CREATE POLICY tournaments_delete_by_creator
        ON public.tournaments
        FOR DELETE
        TO authenticated
        USING (auth.uid() = "creatorId");
    END IF;
END $$;

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Verify existing policies for user_profiles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'up_select_own'
    ) THEN
        CREATE POLICY up_select_own
        ON public.user_profiles
        FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
    END IF;
END $$;
