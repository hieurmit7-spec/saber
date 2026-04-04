import { GameCharacter, Equipment } from '@/stores/gameStore';

export const SABER: GameCharacter = {
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

export const SASUKE: GameCharacter = {
  id: 'sasuke',
  name: 'Sasuke',
  class: 'Sát thủ',
  stars: 1,
  shards: 0,
  level: 1,
  baseStats: { hp: 800, speed: 100, armor: 800, dmg: 250 },
  equipment: { shoes: null, hat: null, armor: null, ring: null, belt: null, artifact: null },
  skills: [
    {
      id: 1,
      name: 'Chidori',
      description: 'Active: Deals 250% ATK damage to 1 enemy. Generates 20 Chakra.\n[2★] Ignores 30% of enemy Armor.',
      cooldown: 0,
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



export const BASE_CHARACTERS: Omit<GameCharacter, 'equipment'>[] = [
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

export const EQUIP_NAMES: Record<Equipment['type'], string[]> = {
  shoes: ['Giày Chiến Binh', 'Giày Gió', 'Giày Thánh', 'Giày Rồng'],
  hat: ['Mũ Sắt', 'Mũ Ma Thuật', 'Mũ Hoàng Gia', 'Mũ Rồng'],
  armor: ['Giáp Da', 'Giáp Bạc', 'Giáp Vàng', 'Giáp Rồng'],
  ring: ['Nhẫn Đồng', 'Nhẫn Bạc', 'Nhẫn Ngọc', 'Nhẫn Rồng'],
  belt: ['Đai Vải', 'Đai Thép', 'Đai Ma Thuật', 'Đai Rồng'],
  artifact: ['Đá Phép', 'Ngọc Chiến', 'Pháp Bảo Cổ', 'Pháp Bảo Rồng'],
};

export const EQUIP_TYPE_NAMES: Record<Equipment['type'], string> = {
  shoes: 'Giày', hat: 'Mũ', armor: 'Giáp', ring: 'Nhẫn', belt: 'Đai', artifact: 'Pháp bảo',
};
