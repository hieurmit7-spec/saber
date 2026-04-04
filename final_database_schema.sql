-- CHÚ Ý QUAN TRỌNG: Tắt RLS và GRANT full quyền để sửa lỗi 404 trên Supabase
DROP TABLE IF EXISTS public.matchmaking CASCADE;
DROP TABLE IF EXISTS public.equipments CASCADE;
DROP TABLE IF EXISTS public.player_characters CASCADE;
DROP TABLE IF EXISTS public.characters CASCADE;
DROP TABLE IF EXISTS public.players CASCADE;

CREATE TABLE public.players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  kc_balance INTEGER DEFAULT 0,
  genesis_cores INTEGER DEFAULT 0,
  pvp_rank_level INTEGER DEFAULT 1,
  pvp_stars INTEGER DEFAULT 0,
  highest_pve_level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.characters (
  id VARCHAR(50) PRIMARY KEY,
  name TEXT NOT NULL,
  base_hp INTEGER NOT NULL,
  base_speed INTEGER NOT NULL,
  base_armor INTEGER NOT NULL,
  base_dmg INTEGER NOT NULL,
  description TEXT
);

INSERT INTO public.characters (id, name, base_hp, base_speed, base_armor, base_dmg, description) 
VALUES 
('saber', 'Saber', 1000, 70, 1500, 200, 'A legendary swordswoman.'),
('slime', 'Slime', 500, 50, 100, 80, 'Weak enemy.'),
('goblin', 'Goblin', 800, 85, 200, 150, 'Fast enemy.'),
('boss_dragon', 'Dragon Boss', 5000, 100, 3000, 400, 'Endgame Boss.');

CREATE TABLE public.equipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  rarity TEXT NOT NULL,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.player_characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  character_id VARCHAR(50) REFERENCES public.characters(id) ON DELETE CASCADE,
  star_level INTEGER DEFAULT 1,
  shards INTEGER DEFAULT 0,
  custom_skill_3 JSONB DEFAULT '{}'::jsonb,
  -- Các khóa ngoại ánh xạ trực tiếp trang bị (Equipment) trên UI
  equip_shoes_id UUID REFERENCES public.equipments(id) ON DELETE SET NULL,
  equip_hat_id UUID REFERENCES public.equipments(id) ON DELETE SET NULL,
  equip_armor_id UUID REFERENCES public.equipments(id) ON DELETE SET NULL,
  equip_ring_id UUID REFERENCES public.equipments(id) ON DELETE SET NULL,
  equip_belt_id UUID REFERENCES public.equipments(id) ON DELETE SET NULL,
  equip_artifact_id UUID REFERENCES public.equipments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, character_id) -- UNIQUE constraint for UPSERT
);

CREATE TABLE public.matchmaking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code VARCHAR(6) UNIQUE,
  is_ranked BOOLEAN DEFAULT false,
  rank_level INTEGER,
  host_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  host_data JSONB,
  guest_data JSONB,
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================== RPC FUNCTIONS ==================

-- 1. Đăng ký tài khoản và tự động Add Saber
CREATE OR REPLACE FUNCTION rpc_register_player(
  p_username TEXT,
  p_password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_player_id UUID;
BEGIN
  -- Tạo player với vốn khởi điểm vô cực kim cương cho đợt test
  INSERT INTO public.players (username, password, kc_balance)
  VALUES (p_username, p_password, 999999999) 
  RETURNING id INTO new_player_id;

  -- Kích hoạt miễn phí nhân vật cơ bản: Saber với 1 sao
  INSERT INTO public.player_characters (player_id, character_id, star_level, shards)
  VALUES (new_player_id, 'saber', 1, 0);

  RETURN new_player_id;
END;
$$;

-- 2. Đập hộp Gacha (Bulk Insert)
CREATE OR REPLACE FUNCTION rpc_gacha_roll(
  p_player_id UUID,
  p_cost INTEGER,
  p_equipments JSONB,          -- mảng equipment [ {id: UUID, type: string, rarity: string, stats: JSONB} ]
  p_character_shards JSONB     -- mảng shards [ {character_id: string, amount: int} ]
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Trừ Kim Cương
  UPDATE public.players
  SET kc_balance = kc_balance - p_cost
  WHERE id = p_player_id;

  -- Thêm Hàng loạt trang bị (1 thẻ / 10 thẻ)
  IF p_equipments IS NOT NULL AND jsonb_array_length(p_equipments) > 0 THEN
    INSERT INTO public.equipments (id, player_id, type, rarity, stats)
    SELECT
      (el->>'id')::UUID,
      p_player_id,
      el->>'type',
      el->>'rarity',
      (el->>'stats')::JSONB
    FROM jsonb_array_elements(p_equipments) AS el;
  END IF;

  -- Cộng shards cho nhân vật (Nếu có duplicate nổ ra Saber shards)
  IF p_character_shards IS NOT NULL AND jsonb_array_length(p_character_shards) > 0 THEN
    -- Mảng có thể chứa nhiều lượt roll chung 1 character, thực hiện trong 1 truy vấn
    INSERT INTO public.player_characters (player_id, character_id, star_level, shards)
    SELECT 
      p_player_id,
      el->>'character_id',
      1,
      (el->>'amount')::INT
    FROM jsonb_array_elements(p_character_shards) AS el
    ON CONFLICT (player_id, character_id) 
    DO UPDATE SET shards = public.player_characters.shards + EXCLUDED.shards;
  END IF;

END;
$$;

ALTER TABLE public.players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_characters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaking DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
