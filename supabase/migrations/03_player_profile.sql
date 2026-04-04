-- Add bio, avatar_url, and frame_url to players table

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='bio') THEN
        ALTER TABLE public.players ADD COLUMN bio TEXT DEFAULT 'Sinh mạng này ta hiến tế cho chiến trường.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='avatar_url') THEN
        ALTER TABLE public.players ADD COLUMN avatar_url TEXT DEFAULT 'default';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='players' AND column_name='frame_url') THEN
        ALTER TABLE public.players ADD COLUMN frame_url TEXT DEFAULT 'none';
    END IF;
END $$;
