import { GameCharacter, Equipment } from '@/stores/gameStore';

export const SABER: GameCharacter = {
  id: 'saber',
  name: 'Saber',
  class: 'Đấu sĩ',
  stars: 1,
  shards: 0,
  level: 1,
  realm_rank: 0,
  exp: 0,
  baseStats: { hp: 3200, speed: 70, armor: 1100, dmg: 160 },
  equipment: { shoes: null, hat: null, armor: null, ring: null, belt: null, artifact: null },
  skills: [
    { id: 1, name: 'Strike Air', description: 'Active: Gây 200 sát thương. Slash trail VFX.\n[Hồi chiêu: 1 lượt]', cooldown: 1, type: 'active' },
    { id: 2, name: 'Instinct', description: 'Passive: 50% cơ hội sát thương tay gây thêm +120% bonus dmg & nhận 1 Darkness Stack.', cooldown: 0, type: 'passive' },
    { id: 3, name: 'Excalibur', description: 'Ultimate: Requires 3 Darkness Stacks. 400% ATK all enemies + 120% ATK all allies. Cinematic cutscene.', cooldown: 0, type: 'ultimate' },
  ],
  videoAvatar: '/videos/saber-avatar.gif',
  videoBanner: '/videos/banner-ulti.mp4',
  darknessStacks: 0,
};

export const SASUKE: GameCharacter = {
  id: 'sasuke',
  name: 'Sasuke',
  class: 'Sát thủ',
  stars: 1,
  shards: 0,
  level: 1,
  realm_rank: 0,
  exp: 0,
  baseStats: { hp: 2900, speed: 100, armor: 800, dmg: 210 },
  equipment: { shoes: null, hat: null, armor: null, ring: null, belt: null, artifact: null },
  skills: [
    {
      id: 1,
      name: 'Chidori',
      description: 'Active: Gây 250% ATK sát thương đơn mục tiêu. Nhận 20 Chakra.\n[2★] Bỏ qua 30% Giáp.\n[Hồi chiêu: 1 lượt]',
      cooldown: 1,
      type: 'active',
    },
    {
      id: 2,
      name: 'Sharingan Foresight',
      description: 'Passive: 20% Dodge Rate — evade attacks entirely, taking 0 damage. On successful dodge: gain 30 Chakra.\n[2★] Dodge Rate → 30%.\n[6★] Dodge Rate → 40%.',
      cooldown: 0,
      type: 'passive',
    },
    {
      id: 3,
      name: 'Susanoo Manifestation',
      description: 'Ultimate: Requires 100 Chakra. Deals 350% ATK to ALL enemies. Grants Susanoo Shield = 40% Max HP (blocks damage, immune to debuffs).\n[4★] Damage → 450% ATK. Shield reflects 20% incoming damage.\n[6★] IZANAGI — On fatal damage: dodge death, revive at 50% HP, clear all debuffs (once per battle).',
      cooldown: 0,
      type: 'ultimate',
    },
  ],
  videoAvatar: '/videos/sasuke.gif',
  videoBanner: '/videos/sasuke ultimate.mp4',
};

export const PETER: GameCharacter = {
  id: 'peter',
  name: 'Peter',
  class: 'Chiến binh',
  stars: 1,
  shards: 0,
  level: 1,
  realm_rank: 0,
  exp: 0,
  baseStats: { hp: 3600, speed: 65, armor: 1200, dmg: 110 },
  equipment: { shoes: null, hat: null, armor: null, ring: null, belt: null, artifact: null },
  skills: [
    {
      id: 1,
      name: 'Nắm Đấm Say Xỉn',
      description: 'Active: Gây 220% sát thương vật lý lên 1 mục tiêu. Hồi 15 Độ Xỉn.\n[Thời gian hồi chiêu: 3 hiệp]',
      cooldown: 3,
      type: 'active',
    },
    {
      id: 2,
      name: 'Da Dày',
      description: 'Passive: Giảm 20% toàn bộ sát thương nhận vào. Khi bị tấn công, phản lại 15% sát thương gốc cho kẻ đánh và hồi 10 Độ Xỉn.\n[2★] Tỷ lệ phản sát thương tăng lên 30%.\n[4★] Tăng thêm 30% Máu tối đa và 20% Giáp cơ bản.',
      cooldown: 0,
      type: 'passive',
    },
    {
      id: 3,
      name: 'Hơi Thở Nồng Nặc',
      description: 'Ultimate: Yêu cầu 100 Độ Xỉn. Gây 300% sát thương AoE lên toàn bộ phe địch. Giảm 50% Tốc độ của toàn bộ địch trong 2 hiệp. Bản thân Peter bị Choáng trong 1 hiệp tiếp theo.\n[6★] Xóa bỏ debuff Choáng bản thân. Khi Peter bị hạ gục, nếu có đồng đội còn sống trên sân, hồi sinh với 70% Máu (chỉ 1 lần/trận).',
      cooldown: 0,
      type: 'ultimate',
    },
  ],
  videoAvatar: '/videos/peter.gif',
  videoBanner: '/videos/peter ultimate.mp4',
};

export const GOJO: GameCharacter = {
  id: 'gojo',
  name: 'Gojo',
  class: 'Đặc Cấp',
  stars: 1,
  shards: 0,
  level: 1,
  realm_rank: 0,
  exp: 0,
  baseStats: { hp: 2800, speed: 120, armor: 600, dmg: 220 },
  equipment: { shoes: null, hat: null, armor: null, ring: null, belt: null, artifact: null },
  skills: [
    {
      id: 1,
      name: 'Hách',
      description: 'Active: Gây 180% sát thương lên 1 mục tiêu. Giảm 30% Tốc độ của mục tiêu đó trong 2 hiệp. Hồi 20 Chú Lực.\n[2★] Thời gian hồi chiêu giảm từ 3 xuống 2 hiệp. Giảm 50% Tốc độ mục tiêu thay vì 30%.\n[Thời gian hồi chiêu cơ bản: 3 hiệp]',
      cooldown: 3,
      type: 'active',
    },
    {
      id: 2,
      name: 'Lục Nhãn',
      description: 'Passive: Bắt đầu trận có sẵn 30 Chú Lực. Mọi đòn đánh đều có 20% tỷ lệ Chí mạng (gây x1.5 sát thương).\n[4★] Tăng lượng Chú Lực bắt đầu trận lên 50. Tăng tỷ lệ Chí mạng lên 50%.',
      cooldown: 0,
      type: 'passive',
    },
    {
      id: 3,
      name: 'Vô Lượng Không Xứ',
      description: 'Ultimate: Yêu cầu 100 Chú Lực. Gây 150% Sát thương Chuẩn (bỏ qua 100% Giáp) lên toàn bộ phe địch. Gây hiệu ứng Choáng toàn bộ địch trong 1 hiệp.\n[6★] Sát thương Chuẩn tăng lên 250%.',
      cooldown: 0,
      type: 'ultimate',
    },
  ],
  videoAvatar: '/videos/gojo.gif',
  videoBanner: '/videos/gojo ultimate.mp4',
};

export const FRIEREN: GameCharacter = {
  id: 'frieren',
  name: 'Frieren',
  class: 'Support',
  stars: 1,
  shards: 0,
  level: 1,
  realm_rank: 0,
  exp: 0,
  baseStats: { hp: 3500, speed: 110, armor: 900, dmg: 100 },
  equipment: { shoes: null, hat: null, armor: null, ring: null, belt: null, artifact: null },
  skills: [
    {
      id: 1,
      name: 'Ma Pháp Thanh Tẩy & Tiếp Tế',
      description: 'Active: Chọn 1 đồng minh - Hồi lượng máu bằng n HP tối đa của Frieren, xóa Đóng băng/Choáng/Chậm, và bơm 25 Mana. Bản thân hồi 20 Mana.\n[2★] Thời gian hồi chiêu giảm xuống 1 hiệp.\n[Thời gian hồi chiêu cơ bản: 2 hiệp]',
      cooldown: 2,
      type: 'active',
    },
    {
      id: 2,
      name: 'Hào Quang Sinh Tồn',
      description: 'Passive: Cứu Tử - Bất kỳ đồng minh nào bị đánh chết sẽ còn 1 HP và được kích hoạt Miễn Thương trong hiệp đó. Chỉ dùng 1 lần cho mỗi tướng/trận.\n[4★] Bắt đầu trận đấu with 50 Mana.',
      cooldown: 0,
      type: 'passive',
    },
    {
      id: 3,
      name: 'Kết Giới Flamme',
      description: 'Ultimate: Yêu cầu 100 Mana. Ban trạng thái Miễn Thương lập tức cho toàn phe ta trong 1 hiệp.\n[6★] Kết Giới Flamme: Hồi Sinh toàn đội đã hy sinh (50% HP) + Chuyển hóa sát thương thành máu.',
      cooldown: 0,
      type: 'ultimate',
    },
  ],
  videoAvatar: '/videos/frieren.gif',
  videoBanner: '/videos/frieren ultimate.mp4',
};

export const BASE_CHARACTERS: Omit<GameCharacter, 'equipment'>[] = [];

export const EQUIP_NAMES: Record<Equipment['type'], string[]> = {
  shoes: ['Giày Vải', 'Giày Da', 'Giày Thép', 'Giày Pha Lê', 'Giày Hoàng Kim', 'Giày Hỏa Diệm', 'Giày Tử Thần', 'Giày Hư Không', 'Giày Thiên Mệnh'],
  hat: ['Mũ Vải', 'Mũ Da', 'Mũ Thép', 'Mũ Pháp Sư', 'Mũ Hoàng Gia', 'Mũ Hỏa Thần', 'Mũ Huyền Nguyệt', 'Mũ Hắc Thần', 'Mũ Quang Thần'],
  armor: ['Giáp Vải', 'Giáp Da', 'Giáp Thép', 'Giáp Bạc', 'Giáp Vàng', 'Giáp Kim Cương', 'Giáp Hắc Ám', 'Giáp Thần Long', 'Giáp Thánh Quang'],
  ring: ['Nhẫn Đồng', 'Nhẫn Bạc', 'Nhẫn Vàng', 'Nhẫn Ngọc', 'Nhẫn Hồng Ngọc', 'Nhẫn Kim Cương', 'Nhẫn Ma Pháp', 'Nhẫn Hắc Ám', 'Nhẫn Cầu Vồng'],
  belt: ['Đai Vải', 'Đai Da', 'Đai Thép', 'Đai Bạc', 'Đai Vàng', 'Đai Ngọc', 'Đai Long Lân', 'Đai Hắc Thần', 'Đai Thiên Giới'],
  artifact: ['Đá Thô', 'Ngọc Sơ', 'Linh Thạch', 'Pháp Khí', 'Bảo Khí', 'Thần Khí', 'Cổ Vật', 'Ma Khí Hư Không', 'Thiên Đạo Pháp Bảo'],
};

export const EQUIP_TYPE_NAMES: Record<Equipment['type'], string> = {
  shoes: 'Giày', hat: 'Mũ', armor: 'Giáp', ring: 'Nhẫn', belt: 'Đai', artifact: 'Pháp bảo',
};
