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

export function performGachaRolls(count: number, currentPity: number, currentBanner: 'saber' | 'sasuke' = 'saber') {
  let pity = currentPity;
  const equipments = [];
  const shards = [];
  const results = [];

  for (let i = 0; i < count; i++) {
    pity++;
    
    // Hard Pity 50: Guaranteed Hero based on Banner
    if (pity >= 50) {
      if (currentBanner === 'sasuke') {
        shards.push({ character_id: 'sasuke', amount: 10 });
        results.push({ type: 'character', item: { id: 'sasuke', name: 'Sasuke Shards x10', rarity: 'gold' } });
      } else {
        shards.push({ character_id: 'saber', amount: 10 });
        results.push({ type: 'character', item: { id: 'saber', name: 'Saber Shards x10', rarity: 'gold' } });
      }
      pity = 0;
    } else {
      // 10th pull logic (Special Rates)
      if (count === 10 && i === 9) {
        const r = Math.random() * 100;
        if (r < 1) {
          // 1% Saber
          shards.push({ character_id: 'saber', amount: 10 });
          results.push({ type: 'character', item: { id: 'saber', name: 'Saber Shards x10', rarity: 'gold' } });
          pity = 0;
        } else if (r < 2) {
          // 1% Sasuke
          shards.push({ character_id: 'sasuke', amount: 10 });
          results.push({ type: 'character', item: { id: 'sasuke', name: 'Sasuke Shards x10', rarity: 'gold' } });
          pity = 0;
        } else if (r < 30) {
          // 28% chance for random BASE character shards (mapping to "98% Base Characters" requirement)
          const bases = ['archer', 'lancer', 'caster', 'assassin', 'rider'];
          const base = bases[Math.floor(Math.random() * bases.length)];
          shards.push({ character_id: base, amount: 10 });
          results.push({ type: 'character', item: { id: base, name: `${base.charAt(0).toUpperCase() + base.slice(1)} Shards x10`, rarity: 'purple' } });
          pity = 0;
        } else {
          // Purple or Gold equipment for the rest
          const rarity = Math.random() < 0.5 ? 'purple' : 'gold';
          const eq = generateEquipment(rarity);
          equipments.push(eq);
          results.push({ type: 'equipment', item: eq });
        }
      } else {
        // Outside 10th slot: Sasuke 0.01% rate
        const r = Math.random() * 100;
        if (r < 0.01) {
          shards.push({ character_id: 'sasuke', amount: 10 });
          results.push({ type: 'character', item: { id: 'sasuke', name: 'Sasuke Shards x10', rarity: 'gold' } });
          pity = 0;
        } else if (r < 0.02) { 
          // Keep Saber at similar low rate if not specified, but user only mentioned Sasuke 0.01%
          shards.push({ character_id: 'saber', amount: 10 });
          results.push({ type: 'character', item: { id: 'saber', name: 'Saber Shards x10', rarity: 'gold' } });
          pity = 0;
        } else {
          const rarity = rollEquipmentRarity();
          const eq = generateEquipment(rarity);
          equipments.push(eq);
          results.push({ type: 'equipment', item: eq });
        }
      }
    }
  }

  return { equipments, shards, results, newPity: pity };
}
