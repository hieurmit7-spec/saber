-- ==========================================
-- EXAMPLE_NEW_HERO_PATCH.SQL
-- Hướng dẫn thêm nhân vật mới sau này (ví dụ: Naruto)
-- ==========================================

-- Bước 1: Thêm dòng này vào danh sách nhân vật
INSERT INTO public.characters (id, name, base_hp, base_speed, base_armor, base_dmg, description) 
VALUES ('naruto', 'Naruto', 1200, 80, 1000, 220, 'Cửu vĩ Jinchuriki. Đấu sĩ với Rasengan và Phân thân chi thuật.')
ON CONFLICT (id) DO NOTHING;

-- Bước 2: (Tùy chọn) Nếu muốn cập nhật Skill đặc biệt cho Naruto mặc định cho mọi người chơi đã có
-- UPDATE public.player_characters SET custom_skill_3 = '{"name": "Rasenshuriken", "dmg": 500}' WHERE character_id = 'naruto';
