-- ==========================================
-- 01_SEED_DATA.SQL
-- Danh mục Nhân vật & Quái vật mặc định
-- Có thể chạy lại nhiều lần để cập nhật chỉ số tướng.
-- ==========================================

INSERT INTO public.characters (id, name, base_hp, base_speed, base_armor, base_dmg, description) 
VALUES 
('saber', 'Saber', 1000, 70, 1500, 200, 'A legendary swordswoman.'),
('sasuke', 'Sasuke', 800, 100, 800, 250, 'The last Uchiha. Sát thủ with Sharingan and Susanoo.'),
('slime', 'Slime', 500, 50, 100, 80, 'Weak enemy.'),
('goblin', 'Goblin', 800, 85, 200, 150, 'Fast enemy.'),
('boss_dragon', 'Dragon Boss', 5000, 100, 3000, 400, 'Endgame Boss.')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  base_hp = EXCLUDED.base_hp,
  base_speed = EXCLUDED.base_speed,
  base_armor = EXCLUDED.base_armor,
  base_dmg = EXCLUDED.base_dmg,
  description = EXCLUDED.description;
