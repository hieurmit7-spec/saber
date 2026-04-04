-- ==========================================
-- 00_INITIAL_SCHEMA.SQL
-- Định nghĩa cấu trúc bảng và hàm (RPC)
-- Chạy 1 lần duy nhất khi khởi tạo database.
-- ==========================================

-- 1. Bảng Người Chơi (Players)
CREATE TABLE IF NOT EXISTS public.players (
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

-- 2. Bảng Thư Viện Nhân Vật (Characters) - Chứa stats gốc
CREATE TABLE IF NOT EXISTS public.characters (
  id VARCHAR(50) PRIMARY KEY,
  name TEXT NOT NULL,
  base_hp INTEGER NOT NULL,
  base_speed INTEGER NOT NULL,
  base_armor INTEGER NOT NULL,
  base_dmg INTEGER NOT NULL,
  description TEXT
);

-- 3. Bảng Trang Bị (Equipments)
CREATE TABLE IF NOT EXISTS public.equipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  rarity TEXT NOT NULL,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bảng Nhân Vật Của Người Chơi (Player Characters) - Lưu level, stars, shards
CREATE TABLE IF NOT EXISTS public.player_characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  character_id VARCHAR(50) REFERENCES public.characters(id) ON DELETE CASCADE,
  star_level INTEGER DEFAULT 1,
  shards INTEGER DEFAULT 0,
  custom_skill_3 JSONB DEFAULT '{}'::jsonb,
  equip_shoes_id UUID REFERENCES public.equipments(id) ON DELETE SET NULL,
  equip_hat_id UUID REFERENCES public.equipments(id) ON DELETE SET NULL,
  equip_armor_id UUID REFERENCES public.equipments(id) ON DELETE SET NULL,
  equip_ring_id UUID REFERENCES public.equipments(id) ON DELETE SET NULL,
  equip_belt_id UUID REFERENCES public.equipments(id) ON DELETE SET NULL,
  equip_artifact_id UUID REFERENCES public.equipments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, character_id)
);

-- 5. Bảng Matchmaking (Phòng chờ)
CREATE TABLE IF NOT EXISTS public.matchmaking (
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

-- 1. Đăng ký tài khoản (Tự động cấp Saber)
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
  INSERT INTO public.players (username, password, kc_balance)
  VALUES (p_username, p_password, 999999999) 
  RETURNING id INTO new_player_id;

  INSERT INTO public.player_characters (player_id, character_id, star_level, shards)
  VALUES (new_player_id, 'saber', 1, 0);

  RETURN new_player_id;
END;
$$;

-- 2. Xử lý Gacha (Atomic Transaction)
CREATE OR REPLACE FUNCTION rpc_gacha_roll(
  p_player_id UUID,
  p_cost INTEGER,
  p_equipments JSONB,
  p_character_shards JSONB
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.players
  SET kc_balance = kc_balance - p_cost
  WHERE id = p_player_id;

  IF p_equipments IS NOT NULL AND jsonb_array_length(p_equipments) > 0 THEN
    INSERT INTO public.equipments (id, player_id, type, rarity, stats)
    SELECT (el->>'id')::UUID, p_player_id, el->>'type', el->>'rarity', (el->>'stats')::JSONB
    FROM jsonb_array_elements(p_equipments) AS el;
  END IF;

  IF p_character_shards IS NOT NULL AND jsonb_array_length(p_character_shards) > 0 THEN
    INSERT INTO public.player_characters (player_id, character_id, star_level, shards)
    SELECT p_player_id, el->>'character_id', 1, (el->>'amount')::INT
    FROM jsonb_array_elements(p_character_shards) AS el
    ON CONFLICT (player_id, character_id) 
    DO UPDATE SET shards = public.player_characters.shards + EXCLUDED.shards;
  END IF;
END;
$$;

-- Security & Permissions
ALTER TABLE public.players DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_characters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaking DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
