import { create } from 'zustand';

// Types definition for backward compatibility
// Enchantment Scaling Table
const STAT_BONUS_TABLE = [
  0, 0.05, 0.10, 0.15, 0.20,
  0.30, 0.40, 0.50, 0.65,
  0.80, 1.00, 1.25, 1.55,
  1.90, 2.30, 2.80, 3.50
];

const STAT_SCALE_FACTORS = {
  hp: 1.0,
  dmg: 0.25, // Maps to 'atk' in user code
  armor: 0.18, // Maps to 'def' in user code
  speed: 0.05
};

export interface Equipment {
  id: string;
  name: string;
  type: 'shoes' | 'hat' | 'armor' | 'ring' | 'belt' | 'artifact';
  typeName: string;
  rarity: 'white' | 'green' | 'blue' | 'orange' | 'red' | 'black' | 'rainbow';
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
  custom_skill_3?: any;
}

interface GameState {
  // Pure UI State
  selectedCharacterId: string | null;
  currentScreen: 'main' | 'character' | 'gacha' | 'battle' | 'bag';
  showCalendar: boolean;
  showEquipSelect: { charId: string; slot: keyof GameCharacter['equipment'] } | null;
  pvpRank: number;
  pvpStars: number;

  setCurrentScreen: (screen: GameState['currentScreen']) => void;
  selectCharacter: (id: string | null) => void;
  setShowCalendar: (show: boolean) => void;
  setShowEquipSelect: (val: GameState['showEquipSelect']) => void;
  addPvpStar: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  selectedCharacterId: 'saber',
  currentScreen: 'main',
  showCalendar: false,
  showEquipSelect: null,
  pvpRank: 1,
  pvpStars: 0,

  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  selectCharacter: (id) => set({ selectedCharacterId: id }),
  setShowCalendar: (show) => set({ showCalendar: show }),
  setShowEquipSelect: (val) => set({ showEquipSelect: val }),
  addPvpStar: () => set((s) => ({
    pvpStars: s.pvpStars >= 4 ? 0 : s.pvpStars + 1,
    pvpRank: s.pvpStars >= 4 ? s.pvpRank + 1 : s.pvpRank
  })),
}));

// Utility functions
export function getCharacterTotalStats(char: GameCharacter) {
  const eq = char.equipment;
  const bonus = { hp: 0, speed: 0, armor: 0, dmg: 0 };
  Object.values(eq).forEach((item) => {
    if (item) {
      const level = item.level || 0;
      const b = STAT_BONUS_TABLE[level];
      
      const calcScaling = (baseStatValue: number | undefined, statKey: keyof typeof STAT_SCALE_FACTORS) => {
        if (!baseStatValue) return 0;
        return baseStatValue * (1 + b * STAT_SCALE_FACTORS[statKey]);
      };

      bonus.hp += calcScaling(item.stats.hp, 'hp');
      bonus.speed += calcScaling(item.stats.speed, 'speed');
      bonus.armor += calcScaling(item.stats.armor, 'armor');
      bonus.dmg += calcScaling(item.stats.dmg, 'dmg');
    }
  });
  const totalHp = char.baseStats.hp + bonus.hp;
  const totalArmor = char.baseStats.armor + bonus.armor;

  // Peter 4★: +30% Max HP, +20% Armor
  const hpMultiplier = char.id === 'peter' && char.stars >= 4 ? 1.3 : 1;
  const armorMultiplier = char.id === 'peter' && char.stars >= 4 ? 1.2 : 1;

  return {
    hp: Math.floor(totalHp * hpMultiplier),
    speed: Math.floor(char.baseStats.speed + bonus.speed),
    armor: Math.min(Math.floor(totalArmor * armorMultiplier), 2000), 
    dmg: Math.floor(char.baseStats.dmg + bonus.dmg),
  };
}

export function calculateCP(char: GameCharacter) {
  const stats = getCharacterTotalStats(char);
  return Math.floor(stats.hp * 0.5 + stats.dmg * 8 + stats.speed * 20 + stats.armor * 1.5) * char.stars;
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
