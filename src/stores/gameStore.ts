import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

export interface Equipment {
  id: string;
  name: string;
  type: 'shoes' | 'hat' | 'armor' | 'ring' | 'belt' | 'artifact';
  typeName: string;
  rarity: 'white' | 'blue' | 'purple' | 'gold' | 'red' | 'rainbow';
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

export interface GachaResult {
  type: 'equipment' | 'character';
  item: Equipment | GameCharacter;
  isDuplicate: boolean;
}

interface GameState {
  currency: number;
  characters: GameCharacter[];
  inventory: Equipment[];
  selectedCharacterId: string | null;
  currentScreen: 'main' | 'character' | 'gacha' | 'battle' | 'bag';
  dailyLoginClaimed: boolean;
  pityCounter: number;
  showCalendar: boolean;
  calendarClaims: Record<number, boolean>;
  showEquipSelect: { charId: string; slot: keyof GameCharacter['equipment'] } | null;
  gachaResults: GachaResult[] | null;
  pvpRank: number;
  pvpStars: number;

  setCurrency: (amount: number) => void;
  addCurrency: (amount: number) => void;
  spendCurrency: (amount: number) => boolean;
  setCurrentScreen: (screen: GameState['currentScreen']) => void;
  selectCharacter: (id: string | null) => void;
  addCharacter: (char: GameCharacter) => void;
  addEquipment: (eq: Equipment) => void;
  equipItem: (charId: string, slot: keyof GameCharacter['equipment'], item: Equipment) => void;
  unequipItem: (charId: string, slot: keyof GameCharacter['equipment']) => void;
  claimDailyLogin: () => void;
  incrementPity: () => void;
  resetPity: () => void;
  upgradeStars: (charId: string) => void;
  setShowCalendar: (show: boolean) => void;
  claimCalendarDay: (day: number) => void;
  setShowEquipSelect: (val: GameState['showEquipSelect']) => void;
  rollGacha: (count: 1 | 10) => void;
  clearGachaResults: () => void;
  addPvpStar: () => void;
  syncSupabase: () => Promise<void>;
}

const SABER: GameCharacter = {
  id: 'saber',
  name: 'Saber',
  class: 'Đấu sĩ',
  stars: 1,
  shards: 0,
  level: 1,
  baseStats: { hp: 1000, speed: 70, armor: 1500, dmg: 200 },
  equipment: { shoes: null, hat: null, armor: null, ring: null, belt: null, artifact: null },
  skills: [
    { id: 1, name: 'Strike Air', description: 'Basic Attack - 200 dmg. Slash trail VFX.', cooldown: 0, type: 'active' },
    { id: 2, name: 'Instinct', description: 'Passive: 50% chance on basic to deal +120% bonus dmg & gain 1 Darkness Stack.', cooldown: 0, type: 'passive' },
    { id: 3, name: 'Excalibur', description: 'Ultimate: Requires 3 Darkness Stacks. 400% ATK all enemies + 120% ATK all allies. Cinematic cutscene.', cooldown: 0, type: 'ultimate' },
  ],
  videoAvatar: '/videos/saber-avatar.gif',
  videoBanner: '/videos/banner-ulti.mp4',
  darknessStacks: 0,
};

const BASE_CHARACTERS: Omit<GameCharacter, 'equipment'>[] = [
  {
    id: 'archer', name: 'Archer', class: 'Cung thủ', stars: 1, shards: 0, level: 1,
    baseStats: { hp: 800, speed: 85, armor: 800, dmg: 250 },
    skills: [
      { id: 1, name: 'Arrow Rain', description: 'Basic Attack - 250 dmg.', cooldown: 0, type: 'active' },
      { id: 2, name: 'Eagle Eye', description: 'Passive: +15% crit chance.', cooldown: 0, type: 'passive' },
      { id: 3, name: 'Unlimited Blade Works', description: 'Ultimate: 300% ATK to all enemies.', cooldown: 3, type: 'ultimate' },
    ],
  },
  {
    id: 'lancer', name: 'Lancer', class: 'Thương binh', stars: 1, shards: 0, level: 1,
    baseStats: { hp: 1200, speed: 90, armor: 1000, dmg: 180 },
    skills: [
      { id: 1, name: 'Thrust', description: 'Basic Attack - 180 dmg.', cooldown: 0, type: 'active' },
      { id: 2, name: 'Battle Continuation', description: 'Passive: Survive lethal hit with 1 HP once.', cooldown: 0, type: 'passive' },
      { id: 3, name: 'Gáe Bolg', description: 'Ultimate: 350% ATK single target, ignores 50% armor.', cooldown: 3, type: 'ultimate' },
    ],
  },
  {
    id: 'caster', name: 'Caster', class: 'Pháp sư', stars: 1, shards: 0, level: 1,
    baseStats: { hp: 700, speed: 60, armor: 500, dmg: 300 },
    skills: [
      { id: 1, name: 'Magic Bolt', description: 'Basic Attack - 300 dmg.', cooldown: 0, type: 'active' },
      { id: 2, name: 'Territory Creation', description: 'Passive: +20% dmg for all allies.', cooldown: 0, type: 'passive' },
      { id: 3, name: 'Rule Breaker', description: 'Ultimate: 280% ATK all enemies + dispel buffs.', cooldown: 3, type: 'ultimate' },
    ],
  },
  {
    id: 'assassin', name: 'Assassin', class: 'Sát thủ', stars: 1, shards: 0, level: 1,
    baseStats: { hp: 650, speed: 100, armor: 600, dmg: 280 },
    skills: [
      { id: 1, name: 'Shadow Strike', description: 'Basic Attack - 280 dmg.', cooldown: 0, type: 'active' },
      { id: 2, name: 'Presence Concealment', description: 'Passive: 30% dodge chance.', cooldown: 0, type: 'passive' },
      { id: 3, name: 'Zabaniya', description: 'Ultimate: 500% ATK single target.', cooldown: 3, type: 'ultimate' },
    ],
  },
  {
    id: 'rider', name: 'Rider', class: 'Kỵ sĩ', stars: 1, shards: 0, level: 1,
    baseStats: { hp: 900, speed: 95, armor: 900, dmg: 220 },
    skills: [
      { id: 1, name: 'Charge', description: 'Basic Attack - 220 dmg.', cooldown: 0, type: 'active' },
      { id: 2, name: 'Riding', description: 'Passive: +25% speed.', cooldown: 0, type: 'passive' },
      { id: 3, name: 'Bellerophon', description: 'Ultimate: 380% ATK to all enemies.', cooldown: 3, type: 'ultimate' },
    ],
  },
];

const EQUIP_NAMES: Record<Equipment['type'], string[]> = {
  shoes: ['Giày Chiến Binh', 'Giày Gió', 'Giày Thánh', 'Giày Rồng'],
  hat: ['Mũ Sắt', 'Mũ Ma Thuật', 'Mũ Hoàng Gia', 'Mũ Rồng'],
  armor: ['Giáp Da', 'Giáp Bạc', 'Giáp Vàng', 'Giáp Rồng'],
  ring: ['Nhẫn Đồng', 'Nhẫn Bạc', 'Nhẫn Ngọc', 'Nhẫn Rồng'],
  belt: ['Đai Vải', 'Đai Thép', 'Đai Ma Thuật', 'Đai Rồng'],
  artifact: ['Đá Phép', 'Ngọc Chiến', 'Pháp Bảo Cổ', 'Pháp Bảo Rồng'],
};

const EQUIP_TYPE_NAMES: Record<Equipment['type'], string> = {
  shoes: 'Giày', hat: 'Mũ', armor: 'Giáp', ring: 'Nhẫn', belt: 'Đai', artifact: 'Pháp bảo',
};

const RARITY_MULTIPLIERS: Record<Equipment['rarity'], number> = {
  white: 1, blue: 2, purple: 3, gold: 5, red: 10, rainbow: 20
};

export function generateEquipment(rarity: Equipment['rarity'], forceType?: Equipment['type']): Equipment {
  const types: Equipment['type'][] = ['shoes', 'hat', 'armor', 'ring', 'belt', 'artifact'];
  const type = forceType || types[Math.floor(Math.random() * types.length)];
  const names = EQUIP_NAMES[type];
  const mult = RARITY_MULTIPLIERS[rarity];
  const nameIndex = Math.min(Object.keys(RARITY_MULTIPLIERS).indexOf(rarity), names.length - 1);

  // Fallback to crypto.randomUUID if available, else random string
  const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `eq-${Date.now()}-${Math.floor(Math.random()*10000)}`;
  
  return {
    id: uuid,
    name: names[nameIndex],
    type,
    typeName: EQUIP_TYPE_NAMES[type],
    rarity,
    stats: {
      hp: Math.floor((50 + Math.random() * 100) * mult),
      speed: Math.floor((5 + Math.random() * 10) * mult),
      armor: Math.floor((30 + Math.random() * 80) * mult),
      dmg: Math.floor((20 + Math.random() * 50) * mult),
    },
    icon: type,
  };
}

function rollEquipmentRarity(): Equipment['rarity'] {
  const r = Math.random() * 100; // 0 to 100
  if (r < 40) return 'white'; // 40%
  if (r < 70) return 'blue'; // + 30% = 70%
  if (r < 90) return 'purple'; // + 20% = 90%
  if (r < 98) return 'gold'; // + 8% = 98%
  if (r < 99.99) return 'red'; // + 1.99% = 99.99%
  return 'rainbow'; // + 0.01% = 100%
}

function createBaseCharacter(template: Omit<GameCharacter, 'equipment'>): GameCharacter {
  return { ...template, equipment: { shoes: null, hat: null, armor: null, ring: null, belt: null, artifact: null } };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      currency: 999999999,
      characters: [SABER],
      inventory: [],
      selectedCharacterId: 'saber',
      currentScreen: 'main',
      dailyLoginClaimed: false,
      pityCounter: 0,
      showCalendar: false,
      calendarClaims: {},
      showEquipSelect: null,
      gachaResults: null,
      pvpRank: 1,
      pvpStars: 0,

      setCurrency: (amount) => set({ currency: amount }),
      addCurrency: (amount) => set((s) => ({ currency: s.currency + amount })),
      spendCurrency: (amount) => {
        set((s) => ({ currency: s.currency - amount }));
        return true; 
      },
  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  selectCharacter: (id) => set({ selectedCharacterId: id }),
  addCharacter: (char) => set((s) => ({ characters: [...s.characters, char] })),
  addEquipment: (eq) => set((s) => ({ inventory: [...s.inventory, eq] })),
  equipItem: (charId, slot, item) => set((s) => ({
    characters: s.characters.map((c) =>
      c.id === charId ? { ...c, equipment: { ...c.equipment, [slot]: item } } : c
    ),
    inventory: s.inventory.filter((e) => e.id !== item.id),
  })),
  unequipItem: (charId, slot) => set((s) => {
    const char = s.characters.find((c) => c.id === charId);
    const item = char?.equipment[slot];
    return {
      characters: s.characters.map((c) =>
        c.id === charId ? { ...c, equipment: { ...c.equipment, [slot]: null } } : c
      ),
      inventory: item ? [...s.inventory, item] : s.inventory,
    };
  }),
  claimDailyLogin: () => set((s) => ({
    dailyLoginClaimed: true,
    currency: s.currency + 100,
  })),
  incrementPity: () => set((s) => ({ pityCounter: s.pityCounter + 1 })),
  resetPity: () => set({ pityCounter: 0 }),
  upgradeStars: (charId) => set((s) => ({
    characters: s.characters.map((c) => {
      if (c.id === charId) {
        const costs: Record<number, number> = { 1: 20, 2: 40, 3: 50, 4: 80, 5: 100 };
        const cost = costs[c.stars];
        if (cost && c.shards >= cost) {
          return { ...c, stars: Math.min(c.stars + 1, 6), shards: c.shards - cost };
        }
      }
      return c;
    }),
  })),
  setShowCalendar: (show) => set({ showCalendar: show }),
  claimCalendarDay: (day) => {
    const state = get();
    if (!state.calendarClaims[day]) {
      set({
        calendarClaims: { ...state.calendarClaims, [day]: true },
        currency: state.currency + 100,
      });
    }
  },
  setShowEquipSelect: (val) => set({ showEquipSelect: val }),
  clearGachaResults: () => set({ gachaResults: null }),

  rollGacha: (count) => {
    const state = get();
    const cost = count === 1 ? 100 : 1000;
    if (state.currency < cost) return;

    const results: GachaResult[] = [];
    let newPity = state.pityCounter;
    const newInventory = [...state.inventory];
    const newCharacters = [...state.characters];

    for (let i = 0; i < count; i++) {
      const isLastOfTen = count === 10 && i === 9;
      newPity++;

      if (isLastOfTen) {
        // 10th slot: guaranteed character (10% Saber, 90% Base)
        const isSaber = Math.random() < 0.1;
        if (isSaber) {
          const existing = newCharacters.find(c => c.id === 'saber');
          if (existing) {
            existing.shards += 10;
            results.push({ type: 'character', item: { ...SABER }, isDuplicate: true });
          } else {
            const newChar = { ...SABER, equipment: { shoes: null, hat: null, armor: null, ring: null, belt: null, artifact: null } };
            newCharacters.push(newChar);
            results.push({ type: 'character', item: newChar, isDuplicate: false });
          }
          newPity = 0;
        } else {
          const template = BASE_CHARACTERS[Math.floor(Math.random() * BASE_CHARACTERS.length)];
          const existing = newCharacters.find(c => c.id === template.id);
          if (existing) {
            existing.shards += 10;
            results.push({ type: 'character', item: createBaseCharacter(template), isDuplicate: true });
          } else {
            const newChar = createBaseCharacter(template);
            newCharacters.push(newChar);
            results.push({ type: 'character', item: newChar, isDuplicate: false });
          }
        }
      } else {
        // Non-guaranteed slot
        const isSaberPity = newPity >= 50;
        const isSaberLuck = Math.random() < 0.0001; // 0.01%

        if (isSaberPity || isSaberLuck) {
          const existing = newCharacters.find(c => c.id === 'saber');
          if (existing) {
            existing.shards += 10;
            results.push({ type: 'character', item: { ...SABER }, isDuplicate: true });
          } else {
            const newChar = { ...SABER, equipment: { shoes: null, hat: null, armor: null, ring: null, belt: null, artifact: null } };
            newCharacters.push(newChar);
            results.push({ type: 'character', item: newChar, isDuplicate: false });
          }
          newPity = 0;
        } else {
          const rarity = rollEquipmentRarity();
          const eq = generateEquipment(rarity);
          newInventory.push(eq);
          results.push({ type: 'equipment', item: eq, isDuplicate: false });
        }
      }
    }

    set({
      currency: state.currency - cost,
      inventory: newInventory,
      characters: newCharacters,
      pityCounter: newPity,
      gachaResults: results,
    });
  },

  addPvpStar: () => set((s) => {
    const newStars = s.pvpStars + 1;
    if (newStars >= 5) {
      return { pvpRank: Math.min(s.pvpRank + 1, 5), pvpStars: 0 };
    }
    return { pvpStars: newStars };
  }),
  syncSupabase: async () => { /* Placeholder for sync */ }
}),
{
  name: 'fern-game-store'
}
));

export function getCharacterTotalStats(char: GameCharacter) {
  const eq = char.equipment;
  const bonus = { hp: 0, speed: 0, armor: 0, dmg: 0 };
  Object.values(eq).forEach((item) => {
    if (item) {
      bonus.hp += item.stats.hp || 0;
      bonus.speed += item.stats.speed || 0;
      bonus.armor += item.stats.armor || 0;
      bonus.dmg += item.stats.dmg || 0;
    }
  });
  return {
    hp: char.baseStats.hp + bonus.hp,
    speed: char.baseStats.speed + bonus.speed,
    armor: Math.min(char.baseStats.armor + bonus.armor, 1500),
    dmg: char.baseStats.dmg + bonus.dmg,
  };
}

export function calculateCP(char: GameCharacter) {
  const stats = getCharacterTotalStats(char);
  return Math.floor(stats.hp * 0.5 + stats.dmg * 8 + stats.speed * 20 + stats.armor * 1.5) * char.stars;
}

export function getStarUpgradeInfo(stars: number): string | null {
  if (stars >= 1 && stars < 2) return 'Tiếp: ★2 - Skill 2 tăng lên 70% kích hoạt';
  if (stars >= 2 && stars < 4) return 'Tiếp: ★4 - Skill 3 chỉ cần 2 Darkness Stack';
  if (stars >= 4 && stars < 6) return 'Tiếp: ★6 - Skill 3 bỏ qua 100% Giáp';
  if (stars >= 6) return '★6 MAX - Skill 3 bỏ qua 100% Giáp';
  return null;
}

export const STAR_BONUSES = [
  { stars: 2, desc: 'Skill 2 trigger chance: 50% → 70%' },
  { stars: 4, desc: 'Skill 3 chỉ cần 2 Darkness Stacks' },
  { stars: 6, desc: 'Skill 3 bỏ qua 100% Giáp địch' },
];
