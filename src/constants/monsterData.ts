export interface Monster {
  id: string;
  name: string;
  hp: number;
  dmg: number;
  armor: number;
  speed: number;
  spriteDir: string;
  isBoss?: boolean;
  frameCount?: number; // Mặc định là 7 nếu không set
}

export const STAGE_1_MONSTERS: Monster[] = [
  {
    id: 'slime',
    name: 'Ma Vật Slime',
    hp: 8000,
    dmg: 300,
    armor: 100,
    speed: 50,
    spriteDir: '/icon rpg/campaign_stage1_sprite/Slime',
    frameCount: 1
  },
  {
    id: 'goblin',
    name: 'Thích Khách Goblin',
    hp: 8000,
    dmg: 600,
    armor: 50,
    speed: 90,
    spriteDir: '/icon rpg/campaign_stage1_sprite/Goblin',
    frameCount: 1
  },
  {
    id: 'bat',
    name: 'Dơi Quỷ',
    hp: 8000,
    dmg: 400,
    armor: 30,
    speed: 110,
    spriteDir: '/icon rpg/campaign_stage1_sprite/Bat',
    frameCount: 1
  },
  {
    id: 'skeleton',
    name: 'Bộ Xương Khô',
    hp: 10000,
    dmg: 500,
    armor: 200,
    speed: 60,
    spriteDir: '/icon rpg/campaign_stage1_sprite/Skeleton',
    frameCount: 7
  },
  {
    id: 'fire_spirit',
    name: 'Linh Hồn Lửa',
    hp: 9000,
    dmg: 750,
    armor: 50,
    speed: 85,
    spriteDir: '/icon rpg/campaign_stage1_sprite/Fire_Spirit',
    frameCount: 1
  },
  {
    id: 'plent',
    name: 'Cây Ma',
    hp: 12000,
    dmg: 350,
    armor: 300,
    speed: 40,
    spriteDir: '/icon rpg/campaign_stage1_sprite/Plent',
    frameCount: 1
  }
];

export const STAGE_1_BOSS: Monster = {
  id: 'boss_dragon',
  name: 'Nhện Chúa Vương',
  hp: 50000,
  dmg: 1500,
  armor: 500,
  speed: 80,
  spriteDir: '/icon rpg/campaign_stage1_sprite/Skeleton',
  isBoss: true,
  frameCount: 7
};
