import { Equipment } from '@/stores/gameStore';
import { EQUIP_NAMES, EQUIP_TYPE_NAMES } from '@/constants/gameData';

const RARITY_MULTIPLIERS: Record<Equipment['rarity'], number> = {
  white: 1, blue: 2, purple: 3, gold: 5, red: 10, rainbow: 20
};

export function rollEquipmentRarity(): Equipment['rarity'] {
  const r = Math.random() * 100;
  if (r < 40) return 'white';
  if (r < 70) return 'blue';
  if (r < 90) return 'purple';
  if (r < 98) return 'gold';
  if (r < 99.99) return 'red';
  return 'rainbow';
}

export function generateEquipment(rarity: Equipment['rarity'], forceType?: Equipment['type']): Equipment {
  const types: Equipment['type'][] = ['shoes', 'hat', 'armor', 'ring', 'belt', 'artifact'];
  const type = forceType || types[Math.floor(Math.random() * types.length)];
  const names = EQUIP_NAMES[type];
  const mult = RARITY_MULTIPLIERS[rarity];
  const nameIndex = Math.min(Object.keys(RARITY_MULTIPLIERS).indexOf(rarity), names.length - 1);

  const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) 
    ? crypto.randomUUID() 
    : `eq-${Date.now()}-${Math.floor(Math.random()*10000)}`;
  
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

export function performGachaRolls(count: number, currentPity: number) {
  let pity = currentPity;
  const equipments = [];
  const shards = [];
  const results = [];

  for (let i = 0; i < count; i++) {
    pity++;
    
    // Hard Pity 50: random rainbow weapon or hero shards
    if (pity >= 50) {
      if (Math.random() < 0.5) {
        // Guaranteed Saber Shards hit
        shards.push({ character_id: 'saber', amount: 10 });
        results.push({ type: 'character', item: { id: 'saber', name: 'Saber (10 Shards)', rarity: 'gold' } });
      } else {
        const eq = generateEquipment('rainbow');
        equipments.push(eq);
        results.push({ type: 'equipment', item: eq });
      }
      pity = 0;
    } else {
      // 10th pull logic
      if (count === 10 && i === 9) {
        if (Math.random() < 0.1) {
          shards.push({ character_id: 'saber', amount: 10 });
          results.push({ type: 'character', item: { id: 'saber', name: 'Saber (10 Shards)', rarity: 'gold' } });
          pity = 0;
        } else {
          const r = Math.random() < 0.5 ? 'purple' : 'gold';
          const eq = generateEquipment(r);
          equipments.push(eq);
          results.push({ type: 'equipment', item: eq });
        }
      } else {
        const rarity = rollEquipmentRarity();
        const eq = generateEquipment(rarity);
        equipments.push(eq);
        results.push({ type: 'equipment', item: eq });
      }
    }
  }

  return { equipments, shards, results, newPity: pity };
}
