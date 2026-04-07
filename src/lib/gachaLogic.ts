import { Equipment } from '@/stores/gameStore';
import { EQUIP_NAMES, EQUIP_TYPE_NAMES } from '@/constants/gameData';

const RARITY_MULTIPLIERS: Record<Equipment['rarity'], number> = {
  white: 1.0,    
  green: 1.8,    
  blue: 3.5,    
  purple: 8.0,  
  gold: 20.0,    
  orange: 50.0,  
  red: 125.0,     
  black: 300.0,  
  rainbow: 750.0 
};

export function rollEquipmentRarity(): Equipment['rarity'] {
  const r = Math.random() * 100;
  if (r < 30) return 'white';
  if (r < 55) return 'green';
  if (r < 75) return 'blue';
  if (r < 88) return 'purple';
  if (r < 95) return 'gold';
  if (r < 98) return 'orange';
  if (r < 99.5) return 'red';
  if (r < 99.9) return 'black';
  return 'rainbow';
}

export function generateEquipment(rarity: Equipment['rarity'], forceType?: Equipment['type']): Equipment {
  const types: Equipment['type'][] = ['shoes', 'hat', 'armor', 'ring', 'belt', 'artifact'];
  const type = forceType || types[Math.floor(Math.random() * types.length)];
  const names = EQUIP_NAMES[type];
  const mult = RARITY_MULTIPLIERS[rarity];
  
  // Fixed Main Stat Type based on Equipment Type
  const mainStatType: keyof Equipment['stats'] = 
    (type === 'shoes') ? 'speed' :
    (type === 'armor') ? 'armor' :
    (type === 'hat' || type === 'belt') ? 'hp' : 'dmg'; // ring/artifact = dmg

  const allStatKeys: (keyof Equipment['stats'])[] = ['hp', 'speed', 'armor', 'dmg'];
  
  // Pick Sub Stats
  // Low rarity: 0-1 sub stats
  // High rarity: 2-3 sub stats
  let subStatCount = 1;
  if (rarity === 'white' || rarity === 'green') subStatCount = 1;
  else if (rarity === 'blue' || rarity === 'purple') subStatCount = 2;
  else subStatCount = 3;

  const subStats = Array.from({ length: subStatCount }).map(() => 
    allStatKeys[Math.floor(Math.random() * allStatKeys.length)]
  );

  const baseValues: Record<keyof Equipment['stats'], number> = {
    hp: 100, speed: 8, armor: 50, dmg: 35
  };

  const finalStats: Equipment['stats'] = {};
  
  // Calculate Main Stat
  finalStats[mainStatType] = Math.floor(baseValues[mainStatType] * (1.1 + Math.random() * 0.4) * mult);
  
  // Add Sub Stats
  subStats.forEach(s => {
    const val = Math.floor(baseValues[s] * (0.4 + Math.random() * 0.4) * mult);
    finalStats[s] = (finalStats[s] || 0) + val;
  });

  const nameIndex = Math.min(Object.keys(RARITY_MULTIPLIERS).indexOf(rarity), names.length - 1);
  const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) 
    ? crypto.randomUUID() 
    : `eq-${Date.now()}-${Math.floor(Math.random()*10000)}`;
  
  return {
    id: uuid,
    name: names[nameIndex] || `Trang bị ${rarity}`,
    type,
    typeName: EQUIP_TYPE_NAMES[type],
    rarity,
    level: 0,
    stats: finalStats,
    icon: type,
  };
}

export function performGachaRolls(count: number, currentPity: number, currentBanner: 'saber' | 'sasuke' | 'peter' | 'gojo' | 'frieren' = 'saber') {
  let pity = currentPity;
  const equipments = [];
  const shards = [];
  const materials = [];
  const results = [];

  for (let i = 0; i < count; i++) {
    pity++;
    
    // Hard Pity 50: Guaranteed Hero based on Banner
    if (pity >= 50) {
      shards.push({ character_id: currentBanner, amount: 10 });
      results.push({ type: 'character', item: { id: currentBanner, name: `${currentBanner.toUpperCase()} Shards x10`, rarity: 'gold' } });
      pity = 0;
    } else {
      const r = Math.random() * 100;
      
      // 3% Chance for Hero Shards (Banner specific)
      if (r < 3) {
        shards.push({ character_id: currentBanner, amount: 5 });
        results.push({ type: 'character', item: { id: currentBanner, name: `${currentBanner.toUpperCase()} Shards x5`, rarity: 'purple' } });
      } 
      // 1% Chance for Breakthrough Stone (New!)
      else if (r < 4) {
        materials.push({ material_id: `magic_stone`, amount: 1 });
        results.push({ 
          type: 'material', 
          item: { 
            id: `magic_stone`, 
            name: `Đá Đột Phá`, 
            rarity: 'rainbow',
            amount: 1 
          } 
        });
      }
      // 15% Chance for Upgrade Stones
      else if (r < 19) {
        let stoneLv = 1;
        const sr = Math.random() * 100;
        if (sr < 50) stoneLv = 1;
        else if (sr < 80) stoneLv = 2;
        else if (sr < 92) stoneLv = 3;
        else if (sr < 97) stoneLv = 4;
        else if (sr < 99.5) stoneLv = 5;
        else stoneLv = 6;

        const amount = stoneLv >= 5 ? 1 : Math.floor(Math.random() * 3) + 1;
        const rarity = stoneLv >= 6 ? 'rainbow' : stoneLv >= 5 ? 'red' : stoneLv >= 4 ? 'purple' : stoneLv >= 3 ? 'orange' : 'blue';
        
        materials.push({ material_id: `upgrade_stone_lv${stoneLv}`, amount });
        results.push({ 
          type: 'material', 
          item: { 
            id: `upgrade_stone_lv${stoneLv}`, 
            name: `Đá Nâng Cấp Lv.${stoneLv}`, 
            rarity,
            amount 
          } 
        });
      }
      // Rest is Equipment
      else {
        const rarity = rollEquipmentRarity();
        const eq = generateEquipment(rarity);
        equipments.push(eq);
        results.push({ type: 'equipment', item: eq });
      }
    }
  }

  // Aggregate identical shards to prevent DB duplicate row update crash
  const aggShards = shards.reduce((acc, curr) => {
    const existing = acc.find(s => s.character_id === curr.character_id);
    if (existing) existing.amount += curr.amount;
    else acc.push({ ...curr });
    return acc;
  }, [] as typeof shards);

  // Aggregate identical materials to prevent DB duplicate row update crash
  const aggMaterials = materials.reduce((acc, curr) => {
    const existing = acc.find(m => m.material_id === curr.material_id);
    if (existing) existing.amount += curr.amount;
    else acc.push({ ...curr });
    return acc;
  }, [] as typeof materials);

  return { equipments, shards: aggShards, materials: aggMaterials, results, newPity: pity };
}
