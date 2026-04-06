-- ==========================================
-- 04_PLAYER_MATERIALS_AND_UPGRADE.SQL
-- Sửa lỗi: Thêm bảng player_materials và RPC upgrade equipment
-- ==========================================

-- 1. Tạo bảng Player Materials (Đá nâng cấp & vật liệu)
CREATE TABLE IF NOT EXISTS public.player_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
  material_id TEXT NOT NULL,  -- e.g. 'upgrade_stone_lv1', 'upgrade_stone_lv3'
  amount INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, material_id)
);

-- 2. Thêm cột level vào bảng equipments (để lưu cấp cường hóa)
ALTER TABLE public.equipments 
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Unknown',
  ADD COLUMN IF NOT EXISTS type_name TEXT DEFAULT '';

-- 3. Cập nhật lại hàm rpc_gacha_roll để xử lý materials
CREATE OR REPLACE FUNCTION rpc_gacha_roll(
  p_player_id UUID,
  p_cost INTEGER,
  p_equipments JSONB,
  p_character_shards JSONB,
  p_materials JSONB DEFAULT '[]'::JSONB
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Trừ KC
  UPDATE public.players
  SET kc_balance = kc_balance - p_cost
  WHERE id = p_player_id;

  -- Thêm trang bị vào kho
  IF p_equipments IS NOT NULL AND jsonb_array_length(p_equipments) > 0 THEN
    INSERT INTO public.equipments (id, player_id, type, rarity, stats, level, name, type_name)
    SELECT 
      (el->>'id')::UUID, 
      p_player_id, 
      el->>'type', 
      el->>'rarity', 
      (el->>'stats')::JSONB,
      COALESCE((el->>'level')::INT, 0),
      COALESCE(el->>'name', 'Unknown'),
      COALESCE(el->>'typeName', '')
    FROM jsonb_array_elements(p_equipments) AS el
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Thêm mảnh nhân vật
  IF p_character_shards IS NOT NULL AND jsonb_array_length(p_character_shards) > 0 THEN
    INSERT INTO public.player_characters (player_id, character_id, star_level, shards)
    SELECT p_player_id, el->>'character_id', 1, (el->>'amount')::INT
    FROM jsonb_array_elements(p_character_shards) AS el
    ON CONFLICT (player_id, character_id) 
    DO UPDATE SET shards = public.player_characters.shards + EXCLUDED.shards;
  END IF;

  -- Thêm vật liệu (đá nâng cấp)
  IF p_materials IS NOT NULL AND jsonb_array_length(p_materials) > 0 THEN
    INSERT INTO public.player_materials (player_id, material_id, amount)
    SELECT p_player_id, el->>'material_id', (el->>'amount')::INT
    FROM jsonb_array_elements(p_materials) AS el
    ON CONFLICT (player_id, material_id) 
    DO UPDATE SET amount = public.player_materials.amount + EXCLUDED.amount;
  END IF;
END;
$$;

-- 4. Tạo hàm RPC để cường hóa trang bị
CREATE OR REPLACE FUNCTION rpc_upgrade_equipment(
  p_player_id UUID,
  p_equipment_id UUID,
  p_stones_count INTEGER,
  p_stone_id TEXT,
  p_success BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Trừ đá nâng cấp
  UPDATE public.player_materials
  SET amount = amount - p_stones_count
  WHERE player_id = p_player_id AND material_id = p_stone_id;

  -- Nếu thành công: tăng level trang bị
  IF p_success THEN
    UPDATE public.equipments
    SET level = LEAST(level + 1, 16)
    WHERE id = p_equipment_id AND player_id = p_player_id;
  END IF;
END;
$$;

-- 5. Phân quyền
ALTER TABLE public.player_materials DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.player_materials TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
