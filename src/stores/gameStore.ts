import { create } from 'zustand';

// Types definition for backward compatibility
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

export const STAR_BONUSES = [
  { stars: 2, desc: 'Skill 2 trigger chance: 50% → 70%' },
  { stars: 4, desc: 'Skill 3 chỉ cần 2 Darkness Stacks' },
  { stars: 6, desc: 'Skill 3 bỏ qua 100% Giáp địch' },
];
