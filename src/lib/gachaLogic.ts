import { Equipment } from '@/stores/gameStore';
import { EQUIP_NAMES, EQUIP_TYPE_NAMES } from '@/constants/gameData';

/**
 * ĐẠI TU CHỈ SỐ CƠ BẢN:
 * Mỗi phẩm chất có một khoảng nhân (Multiplier Range) cố định.
 * QUY TẮC: Min của phẩm chất hiện tại LUÔN LỚN HƠN Max của phẩm chất thấp hơn liền kề.
 */
const RARITY_POWER_RANGES: Record<Equipment['rarity'], { min: number, max: number }> = {
  white:   { min: 1.0,    max: 1.5 },
  green:   { min: 2.0,    max: 3.5 },
  blue:    { min: 5.0,    max: 10.0 },
  purple:  { min: 15.0,   max: 30.0 },
  gold:    { min: 50.0,   max: 100.0 },
  orange:  { min: 150.0,  max: 350.0 },
  red:     { min: 500.0,  max: 1200.0 },
  black:   { min: 2000.0, max: 5000.0 },
  rainbow: { min: 8000.0, max: 20000.0 }
};

export function rollEquipmentRarity(): Equipment['rarity'] {
  const r = Math.random() * 100;
  if (r < 45) return 'white';     // 45%
  if (r < 75) return 'green';     // 30%
  if (r < 90) return 'blue';      // 15%
  if (r < 96) return 'purple';    // 6%
  if (r < 98.7) return 'gold';    // 2.7%
  if (r < 99.7) return 'orange';  // 1%
  if (r < 99.9) return 'red';     // 0.2%
  if (r < 99.98) return 'black';  // 0.08%
  return 'rainbow';               // 0.02%
}

export function generateEquipment(rarity: Equipment['rarity'], options?: { forceType?: Equipment['type'], isGacha?: boolean }): Equipment {
  const types: Equipment['type'][] = ['shoes', 'hat', 'armor', 'ring', 'belt', 'artifact'];
  const type = options?.forceType || types[Math.floor(Math.random() * types.length)];
  const names = EQUIP_NAMES[type];
  
  const mainStatType: keyof Equipment['stats'] = 
    (type === 'shoes') ? 'speed' :
    (type === 'armor') ? 'armor' :
    (type === 'hat' || type === 'belt') ? 'hp' : 'dmg';

  const allStatKeys: (keyof Equipment['stats'])[] = ['hp', 'speed', 'armor', 'dmg'];
  
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

  const range = RARITY_POWER_RANGES[rarity];
  let minQ = range.min;
  const maxQ = range.max;

  // Đặc biệt: Trang bị rainbow từ gacha phải có chỉ số tầm trung trở lên
  if (rarity === 'rainbow' && options?.isGacha) {
    minQ = (range.min + range.max) / 2;
  }

  const finalStats: Equipment['stats'] = {};
  const rollMainMult = minQ + Math.random() * (maxQ - minQ);
  finalStats[mainStatType] = Math.floor(baseValues[mainStatType] * rollMainMult);
  
  subStats.forEach(s => {
    // Chỉ số phụ hưởng 30% - 60% giá trị multiplier của chỉ số chính
    const subMult = rollMainMult * (0.3 + Math.random() * 0.3);
    const val = Math.floor(baseValues[s] * subMult);
    finalStats[s] = (finalStats[s] || 0) + val;
  });

  const raritiesInOrder: Equipment['rarity'][] = ['white', 'green', 'blue', 'purple', 'gold', 'orange', 'red', 'black', 'rainbow'];
  const nameIndex = Math.min(raritiesInOrder.indexOf(rarity), names.length - 1);
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
    
    if (pity >= 50) {
      shards.push({ character_id: currentBanner, amount: 10 });
      results.push({ type: 'character', item: { id: currentBanner, name: `${currentBanner.toUpperCase()} Shards x10`, rarity: 'gold' } });
      pity = 0;
    } else {
      const r = Math.random() * 100;
      
      if (r < 4) {
        shards.push({ character_id: currentBanner, amount: 5 });
        results.push({ type: 'character', item: { id: currentBanner, name: `${currentBanner.toUpperCase()} Shards x5`, rarity: 'purple' } });
      } 
      else if (r < 10) {
        const stoneRoll = Math.random() * 100;
        let amount = 1;
        let rarity: Equipment['rarity'] = 'rainbow';
        
        if (stoneRoll < 1) {
          amount = 50;
          rarity = 'black';
        } else if (stoneRoll < 5) {
          amount = 10;
          rarity = 'red';
        }
        
        materials.push({ material_id: `magic_stone`, amount });
        results.push({ 
          type: 'material', 
          item: { 
            id: `magic_stone`, 
            name: `Đá Đột Phá x${amount}`, 
            rarity,
            amount 
          } 
        });
      }
      else if (r < 25) {
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
      else {
        const rarity = rollEquipmentRarity();
        const eq = generateEquipment(rarity, { isGacha: true });
        equipments.push(eq);
        results.push({ type: 'equipment', item: eq });
      }
    }
  }

  const aggShards = shards.reduce((acc, curr) => {
    const existing = acc.find(s => s.character_id === curr.character_id);
    if (existing) existing.amount += curr.amount;
    else acc.push({ ...curr });
    return acc;
  }, [] as typeof shards);

  const aggMaterials = materials.reduce((acc, curr) => {
    const existing = acc.find(m => m.material_id === curr.material_id);
    if (existing) existing.amount += curr.amount;
    else acc.push({ ...curr });
    return acc;
  }, [] as typeof materials);

  return { equipments, shards: aggShards, materials: aggMaterials, results, newPity: pity };
}
