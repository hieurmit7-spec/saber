-- ============================================
-- GOJO COMPLETE PATCH - Run in Supabase SQL Editor
-- Step 1: Insert Gojo into the characters library (required for FK)
-- Step 2: Verify it was inserted
-- ============================================

-- Step 1: Upsert Gojo into characters table
INSERT INTO public.characters (id, name, base_hp, base_speed, base_armor, base_dmg, description)
VALUES (
    'gojo',
    'Gojo',
    700,
    120,
    1500,
    220,
    'Chú thuật sư mạnh nhất thời hiện đại. Nhân vật Đặc Cấp với khả năng Bành Trướng Lãnh Địa: Vô Lượng Không Xứ.'
) ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    base_hp     = EXCLUDED.base_hp,
    base_speed  = EXCLUDED.base_speed,
    base_armor  = EXCLUDED.base_armor,
    base_dmg    = EXCLUDED.base_dmg,
    description = EXCLUDED.description;

-- Step 2: Verification — should return 1 row for 'gojo'
SELECT id, name, base_hp, base_speed, base_armor, base_dmg
FROM public.characters
WHERE id = 'gojo';
