import { create } from 'zustand';

export const STAT_SCALE_FACTORS = {
  hp: 1.0,
  dmg: 0.25,
  armor: 0.18,
  speed: 0.05
};

export const STAT_BONUS_TABLE = [
  0, 0.05, 0.10, 0.15, 0.20,
  0.30, 0.40, 0.50, 0.65,
  0.80, 1.00, 1.25, 1.55,
  1.90, 2.30, 2.80, 3.50
];

// --- STAR LIMIT BREAK SYSTEM (46 STEPS) ---
export const STAR_TIERS = [
  { id: 'gold', label: 'Vàng', range: [1, 6], color: '#FFD700' },
  { id: 'emerald', label: 'Lục', range: [7, 11], color: '#10b981' },
  { id: 'azure', label: 'Lam', range: [12, 16], color: '#60a5fa' },
  { id: 'orange', label: 'Cam', range: [17, 21], color: '#f59e0b' },
  { id: 'purple', label: 'Tím', range: [22, 26], color: '#a855f7' },
  { id: 'red', label: 'Đỏ', range: [27, 31], color: '#ef4444' },
  { id: 'black', label: 'Đen', range: [32, 36], color: '#333333' },
  { id: 'pentacolor', label: 'Ngũ Sắc', range: [37, 41], colors: ['#A52A2A', '#B8860B', '#556B2F', '#483D8B', '#708090'] },
  { id: 'heptacolor', label: 'Thất Sắc', range: [42, 46], colors: ['#8B0000', '#D2691E', '#DAA520', '#8F9779', '#4682B4', '#191970', '#4B0082'] }
];

export function getStarTier(starLevel: number) {
  return STAR_TIERS.find(t => starLevel >= t.range[0] && starLevel <= t.range[1]) || STAR_TIERS[0];
}

export const getRequiredExp = (level: number) => {
  return Math.floor(100 * Math.pow(1.15, level - 1));
};

// --- CULTIVATION REALMS (14 REALMS / 420 LEVELS) ---
export const REALM_DATA = [
  { name: "Luyện Khí Kỳ", cap: 30, successRate: 1.0, costStone: 1, costKC: 0 },
  { name: "Trúc Cơ Kỳ", cap: 60, successRate: 0.95, costStone: 2, costKC: 200 },
  { name: "Kim Đan Kỳ", cap: 90, successRate: 0.90, costStone: 3, costKC: 500 },
  { name: "Nguyên Anh Kỳ", cap: 120, successRate: 0.85, costStone: 5, costKC: 1000 },
  { name: "Hóa Thần Kỳ", cap: 150, successRate: 0.80, costStone: 8, costKC: 2000 },
  { name: "Luyện Hư Kỳ", cap: 180, successRate: 0.70, costStone: 12, costKC: 4000 },
  { name: "Hợp Thể Kỳ", cap: 210, successRate: 0.60, costStone: 15, costKC: 6000 },
  { name: "Đại Thừa Kỳ", cap: 240, successRate: 0.50, costStone: 20, costKC: 10000 },
  { name: "Độ Kiếp Kỳ", cap: 270, successRate: 0.40, costStone: 25, costKC: 20000 },
  { name: "Địa Tiên", cap: 300, successRate: 0.30, costStone: 35, costKC: 40000 },
  { name: "Chân Tiên", cap: 330, successRate: 0.20, costStone: 50, costKC: 80000 },
  { name: "Thiên Tiên", cap: 360, successRate: 0.10, costStone: 75, costKC: 150000 },
  { name: "Tiên Vương", cap: 390, successRate: 0.05, costStone: 100, costKC: 300000 },
  { name: "Tiên Đế (Đỉnh Phong)", cap: 420, successRate: 0.03, costStone: 200, costKC: 1000000 }
];

export function getLevelCap(realmRank: number) {
  return REALM_DATA[Math.min(realmRank, REALM_DATA.length - 1)].cap;
}

export function getRealmTitle(realmRank: number) {
  return REALM_DATA[Math.min(realmRank, REALM_DATA.length - 1)].name;
}

export function getRealmStage(realmRank: number) {
  if (realmRank < 5) return { label: "Phàm Nhân", color: "text-zinc-400" };
  if (realmRank < 9) return { label: "Bất Tử", color: "text-amber-500" };
  return { label: "Vô Ưu", color: "text-purple-400" };
}

export interface GachaResult {
  type: 'character' | 'equipment' | 'material';
  item: any;
  isDuplicate?: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  typeName: string;
  rarity: 'white' | 'green' | 'blue' | 'orange' | 'purple' | 'gold' | 'red' | 'black' | 'rainbow';
  level: number;
  stats: {
    hp?: number;
    speed?: number;
    armor?: number;
    dmg?: number;
  };
  icon: string;
}

export interface CharacterSkill {
  id: number;
  name: string;
  description: string;
  cooldown: number;
  type: 'active' | 'passive' | 'ultimate';
}

export interface GameCharacter {
  id: string;
  name: string;
  class: string;
  stars: number;
  shards: number;
  level: number;
  realm_rank: number;
  exp: number;
  baseStats: {
    hp: number;
    speed: number;
    armor: number;
    dmg: number;
  };
  equipment: {
    shoes: Equipment | null;
    hat: Equipment | null;
    armor: Equipment | null;
    ring: Equipment | null;
    belt: Equipment | null;
    artifact: Equipment | null;
  };
  skills: CharacterSkill[];
  videoAvatar?: string;
  videoBanner?: string;
  darknessStacks?: number;
  isUnlocked?: boolean;
}

interface GameState {
  selectedCharacterId: string | null;
  currentScreen: 'main' | 'character' | 'gacha' | 'battle' | 'bag';
  showCalendar: boolean;
  showEquipSelect: { charId: string; slot: keyof GameCharacter['equipment'] } | null;
  pvpRank: number;
  pvpStars: number;
  currency: number;
  pityCounter: number;
  gachaResults: GachaResult[];

  setCurrentScreen: (screen: GameState['currentScreen']) => void;
  selectCharacter: (id: string | null) => void;
  setShowCalendar: (show: boolean) => void;
  setShowEquipSelect: (val: GameState['showEquipSelect']) => void;
  addPvpStar: () => void;
  rollGacha: (count: 1 | 10) => void;
  clearGachaResults: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  selectedCharacterId: 'saber',
  currentScreen: 'main',
  showCalendar: false,
  showEquipSelect: null,
  pvpRank: 1,
  pvpStars: 0,
  currency: 1000,
  pityCounter: 0,
  gachaResults: [],

  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  selectCharacter: (id) => set({ selectedCharacterId: id }),
  setShowCalendar: (show) => set({ showCalendar: show }),
  setShowEquipSelect: (val) => set({ showEquipSelect: val }),
  addPvpStar: () => set((s) => ({
    pvpStars: s.pvpStars >= 4 ? 0 : s.pvpStars + 1,
    pvpRank: s.pvpStars >= 4 ? s.pvpRank + 1 : s.pvpRank
  })),
  rollGacha: (count) => set(s => ({ currency: s.currency - count * 100, pityCounter: s.pityCounter + count })),
  clearGachaResults: () => set({ gachaResults: [] }),
}));

export function getCharacterTotalStats(char: GameCharacter) {
  const eq = char.equipment;
  const gearBonus = { hp: 0, speed: 0, armor: 0, dmg: 0 };
  
  // 1. Calculate Equipment Bonus (Additive, does not scale character base multipliers)
  Object.entries(eq).forEach(([slot, item]) => {
    if (item) {
      const level = item.level || 0;
      const b = STAT_BONUS_TABLE[level] || 0;

      const calcScaling = (baseStatValue: number | undefined, statKey: keyof typeof STAT_SCALE_FACTORS) => {
        if (!baseStatValue) return 0;
        // Equipment itself scales with its own level bonus
        return baseStatValue * (1 + b * STAT_SCALE_FACTORS[statKey]);
      };

      gearBonus.hp += calcScaling(item.stats.hp, 'hp');
      gearBonus.speed += calcScaling(item.stats.speed, 'speed');
      gearBonus.armor += calcScaling(item.stats.armor, 'armor');
      gearBonus.dmg += calcScaling(item.stats.dmg, 'dmg');
    }
  });

  // 2. Character Base Multipliers
  // Level scaling: Increased to +10% per level as requested
  const levelMult = 1 + (char.level - 1) * 0.10;
  
  // Breakthrough scaling: Increase % of ALL stats
  // Each Realm Rank (Đột phá cảnh giới) +15% total base power
  // Each Star level (Tiến hóa sao) +5% total base power
  const breakthroughMult = 1 + (char.realm_rank * 0.15) + (char.stars * 0.05);

  const totalMult = levelMult * breakthroughMult;
  
  // Final Stat Formula: (Base * Multipliers) + Gear
  const totalHp = (char.baseStats.hp * totalMult) + gearBonus.hp;
  const totalDmg = (char.baseStats.dmg * totalMult) + gearBonus.dmg;
  const totalArmor = (char.baseStats.armor * totalMult) + gearBonus.armor;
  const totalSpeed = (char.baseStats.speed * breakthroughMult) + gearBonus.speed; // Speed only scales with breakthrough

  // 3. Character-Specific Final Multipliers (e.g., Peter's Passive)
  const hpMultiplier = char.id === 'peter' && char.stars >= 4 ? 1.3 : 1;
  const armorMultiplier = char.id === 'peter' && char.stars >= 4 ? 1.2 : 1;

  return {
    hp: Math.floor(totalHp * hpMultiplier),
    speed: Math.floor(totalSpeed),
    armor: Math.floor(totalArmor * armorMultiplier),
    dmg: Math.floor(totalDmg),
  };
}

export function calculateCP(char: GameCharacter, precalculatedStats?: ReturnType<typeof getCharacterTotalStats>) {
  const stats = precalculatedStats || getCharacterTotalStats(char);
  // CP formula: weighted sum * star progress factor
  const baseCP = (stats.hp * 0.4) + (stats.dmg * 10) + (stats.speed * 25) + (stats.armor * 2);
  
  const starFactor = 1 + (char.stars * 0.2);
  
  return Math.floor(baseCP * starFactor);
}

export const STAR_BONUSES_MAP: Record<string, { stars: number, desc: string }[]> = {
  saber: [
    { stars: 2, desc: 'Tỷ lệ kích hoạt Nội tại: 50% → 70%' },
    { stars: 4, desc: 'Chiêu cuối chỉ cần 2 Darkness Stacks' },
    { stars: 6, desc: 'Chiêu cuối bỏ qua 100% Giáp địch' },
  ],
  sasuke: [
    { stars: 2, desc: 'Chiêu 1 xuyên 30% giáp. Tỷ lệ né → 30%' },
    { stars: 4, desc: 'Susanoo phản 20% sát thương' },
    { stars: 6, desc: 'IZANAGI: Hồi sinh 50% HP (1 lần). Tố độ né → 40%' },
  ],
  peter: [
    { stars: 2, desc: 'Phản sát thương tăng lên 30%' },
    { stars: 4, desc: 'Tăng 30% Máu tối đa, 20% Giáp' },
    { stars: 6, desc: 'Miễn choáng Chiêu cuối. Hồi sinh 70% HP (1 lần)' },
  ],
  gojo: [
    { stars: 2, desc: 'Hách: Hồi chiêu giảm còn 2 hiệp. Giảm 50% tốc độ mục tiêu thay vì 30%.' },
    { stars: 4, desc: 'Lục Nhãn: Chú Lực khởi đầu trận lên 50. Tỷ lệ Chí mạng tăng lên 50%.' },
    { stars: 6, desc: 'Vô Lượng Không Xứ: Sát thương chuẩn tăng từ 150% lên 250%.' },
  ],
  frieren: [
    { stars: 2, desc: 'Ma Pháp Thanh Tẩy: Hồi chiêu giảm xuống 1 hiệp.' },
    { stars: 4, desc: 'Hào Quang Sinh Tồn: Bắt đầu trận đấu với 50 Mana.' },
    { stars: 6, desc: 'Kết Giới Flamme: Hồi Sinh toàn đội đã hy sinh (50% HP) + Chuyển hóa sát thương thành máu.' },
  ]
};
