-- Add combat_power and team_setup to players table

-- Safe add columns to players
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='combat_power') THEN
        ALTER TABLE public.players ADD COLUMN combat_power INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='team_setup') THEN
        ALTER TABLE public.players ADD COLUMN team_setup JSONB DEFAULT '[null, null, null, null, null]'::jsonb;
    END IF;
END $$;
