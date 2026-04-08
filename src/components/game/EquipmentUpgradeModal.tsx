import React, { useState } from 'react';
import { X, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Equipment, STAT_BONUS_TABLE, STAT_SCALE_FACTORS } from '@/stores/gameStore';
import { useMaterials, useUpgradeEquipment, usePlayer } from '@/hooks/usePlayerData';
import { toast } from 'sonner';
import { EquipmentIcon } from './EquipmentIcon';

interface UpgradeData {
  base: number;
  max: number;
  bonus: number;
}

const UPGRADE_TABLE: UpgradeData[] = [
  { base: 100, max: 100, bonus: 0 },   // +0 -> +1
  { base: 80, max: 95, bonus: 3 },   // +1 -> +2
  { base: 70, max: 90, bonus: 3 },
  { base: 60, max: 85, bonus: 3 },
  { base: 50, max: 75, bonus: 2.5 },
  { base: 40, max: 65, bonus: 2.5 },
  { base: 30, max: 55, bonus: 2 },
  { base: 25, max: 45, bonus: 2 },
  { base: 20, max: 35, bonus: 1.5 },
  { base: 15, max: 25, bonus: 1.5 },
  { base: 10, max: 18, bonus: 1 },
  { base: 8, max: 12, bonus: 0.8 },
  { base: 6, max: 8, bonus: 0.5 },
  { base: 4, max: 5, bonus: 0.3 },
  { base: 2, max: 3, bonus: 0.2 },
  { base: 1, max: 1, bonus: 0.1 },    // +15 -> +16
];

const RARITY_GOLD_MULT: Record<string, number> = {
  white: 1.0,
  green: 1.2,
  blue: 1.5,
  purple: 2.0,
  gold: 3.5,
  orange: 8.0,
  red: 20.0,
  black: 100.0,
  rainbow: 500.0
};

export default function EquipmentUpgradeModal({ 
  equipment, 
  onClose,
  inline = false
}: { 
  equipment: Equipment; 
  onClose?: () => void;
  inline?: boolean;
}) {
  const userId = localStorage.getItem('fern_user_id') || '';
  const { data: player } = usePlayer(userId);
  const { data: materials } = useMaterials(userId);
  const { mutate: upgrade, isPending } = useUpgradeEquipment(userId);
  
  const availableStones = (materials || [])
    .filter(m => m.material_id.startsWith('upgrade_stone_lv') && m.amount > 0)
    .map(m => parseInt(m.material_id.replace('upgrade_stone_lv', '')))
    .sort((a,b) => a - b);
    
  const [selectedStoneLv, setSelectedStoneLv] = useState(availableStones[0] || 1);
  const [stonesCount, setStonesCount] = useState(1);
  const [isUpgrading, setIsUpgrading] = useState(false);

  React.useEffect(() => {
    if (availableStones.length > 0 && !availableStones.includes(selectedStoneLv)) {
      setSelectedStoneLv(availableStones[0]);
    }
  }, [materials]);

  const currentLevel = equipment.level || 0;
  if (currentLevel >= 16) return null;

  const stoneMultiplier = Math.pow(1.6, selectedStoneLv - 1);
  const upgradeData = UPGRADE_TABLE[currentLevel];
  const rate = Math.min(upgradeData.max, (upgradeData.base * stoneMultiplier) + (stonesCount * upgradeData.bonus * stoneMultiplier));
  
  const goldCost = Math.floor((currentLevel + 1) * 1000 * (RARITY_GOLD_MULT[equipment.rarity] || 1));

  const stoneId = `upgrade_stone_lv${selectedStoneLv}`;
  const ownedStones = materials?.find(m => m.material_id === stoneId)?.amount || 0;

  const handleUpgrade = () => {
    if (stonesCount > ownedStones) return toast.error("Không đủ đá!");
    if ((player?.coins || 0) < goldCost) return toast.error("Không đủ Vàng!");
    
    setIsUpgrading(true);
    const roll = Math.random() * 100;
    const success = roll <= rate;

    upgrade({
      equipmentId: equipment.id,
      stoneId,
      stonesCount,
      success,
      goldCost
    }, {
      onSuccess: () => {
        if (success) {
          toast.success(`Cường hóa thành công! +${currentLevel + 1}`);
        } else {
          toast.error("Cường hóa thất bại!");
        }
        setIsUpgrading(false);
      },
      onError: () => setIsUpgrading(false)
    });
  };

  const previewStat = (baseVal: number | undefined, statKey: keyof typeof STAT_SCALE_FACTORS) => {
    if (!baseVal) return 0;
    const nextBonus = STAT_BONUS_TABLE[currentLevel + 1];
    return Math.floor(baseVal * (1 + nextBonus * STAT_SCALE_FACTORS[statKey]));
  };

  const currentStat = (baseVal: number | undefined, statKey: keyof typeof STAT_SCALE_FACTORS) => {
    if (!baseVal) return 0;
    const currBonus = STAT_BONUS_TABLE[currentLevel];
    return Math.floor(baseVal * (1 + currBonus * STAT_SCALE_FACTORS[statKey]));
  };

  return (
    <div className={inline ? "w-full h-full bg-zinc-950 p-8 relative flex flex-col overflow-y-auto custom-scrollbar" : "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"}>
      <div className={inline ? "w-full flex-1 flex flex-col" : "w-full max-h-[90vh] overflow-y-auto custom-scrollbar max-w-lg bg-zinc-950 border border-white/10 p-8 relative animate-in zoom-in-95 duration-200"}>
        {onClose && !inline && (
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10 bg-black/50 rounded-full p-1">
            <X className="w-6 h-6" />
          </button>
        )}

        <h2 className="text-2xl font-black uppercase tracking-widest text-white mb-8 border-b border-white/5 pb-4">
          Cường Hóa Trang Bị
        </h2>

        <div className="flex items-center gap-8 mb-12 bg-white/5 p-8 border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <EquipmentIcon type={equipment.type} level={currentLevel} rarity={equipment.rarity} size="lg" className="scale-125" />
          </div>
          <div className="relative z-10">
            <div className="text-2xl font-black text-white uppercase tracking-tighter mb-1">{equipment.name}</div>
            <div className="flex items-center gap-2 mb-4">
              <span 
                className="text-[9px] font-black uppercase px-2 py-0.5 rounded-sm"
                style={{ 
                  backgroundColor: { white: '#1e293b', green: '#064e3b', blue: '#1e3a8a', purple: '#581c87', gold: '#78350f', orange: '#7c2d12', red: '#7f1d1d', black: '#000', rainbow: '#4338ca' }[equipment.rarity] || '#000',
                  color: { white: '#94a3b8', green: '#34d399', blue: '#60a5fa', purple: '#a855f7', gold: '#fbbf24', orange: '#fb923c', red: '#ef4444', black: '#fff', rainbow: '#fff' }[equipment.rarity] || '#fff'
                }}
              >
                {{ white: 'Trắng', green: 'Lục', blue: 'Lam', purple: 'Tím', gold: 'Vàng', orange: 'Cam', red: 'Đỏ', rainbow: 'Phổ Quang', black: 'Huyền Thiết' }[equipment.rarity] || equipment.rarity}
              </span>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] opacity-70">{equipment.typeName}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-xs uppercase font-bold">Cấp hiện tại:</span>
              <span className="text-amber-500 font-black text-xl">+{currentLevel}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-12">
          {Object.entries(equipment.stats).map(([key, val]) => {
            if (!val) return null;
            const sKey = key as keyof typeof STAT_SCALE_FACTORS;
            return (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 uppercase font-bold tracking-widest">{key}</span>
                <div className="flex items-center gap-4">
                  <span className="text-white font-mono">{currentStat(val as number, sKey)}</span>
                  <ArrowRight className="w-4 h-4 text-zinc-700" />
                  <span className="text-green-500 font-black font-mono">{previewStat(val as number, sKey)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-black border border-white/5 p-6 mb-8 shrink-0">
          <div className="flex justify-between items-center mb-6">
            <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Chọn Loại Đá</div>
            <div className="text-xs text-amber-500 font-black">Sở hữu: {ownedStones} viên</div>
          </div>
          
          {availableStones.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-6">
              {availableStones.map(lv => {
                const rarityColor = lv >= 6 ? 'border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : lv >= 5 ? 'border-red-500' : lv >= 4 ? 'border-purple-500' : 'border-white/10';
                return (
                  <button 
                    key={lv}
                    onClick={() => setSelectedStoneLv(lv)}
                    className={`h-16 border-2 transition-all flex flex-col items-center justify-center p-1 gap-1 ${selectedStoneLv === lv ? 'bg-amber-500/20 ' + rarityColor : 'bg-black ' + rarityColor + ' opacity-50 hover:opacity-100'}`}
                  >
                    <img src={`/icon rpg/lv${lv}_stone.png`} className="w-6 h-6 object-contain" alt={`LV${lv}`} />
                    <span className="text-[8px] font-black uppercase">Lv{lv}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mb-6 p-4 border border-dashed border-white/10 text-center text-zinc-500 text-sm uppercase tracking-widest">
              Bạn chưa sở hữu loại đá nào. Hãy cày cuốc thêm nhé!
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 uppercase font-bold tracking-widest">Số lượng sử dụng</span>
              <input 
                type="number" 
                min={1} 
                max={Math.max(1, ownedStones)}
                value={stonesCount}
                onChange={e => setStonesCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 bg-zinc-900 border border-white/10 px-2 py-1 text-right font-mono focus:border-amber-500 outline-none"
              />
            </div>
            
            <div className="flex justify-between items-center text-xs pt-2">
              <span className="text-zinc-500 uppercase font-bold tracking-widest">Chi phí Vàng</span>
              <span className={(player?.coins || 0) < goldCost ? "text-red-500 font-bold" : "text-amber-500 font-bold"}>
                {goldCost.toLocaleString()} Vàng
              </span>
            </div>

            <div className="flex justify-between items-center bg-amber-500/10 p-3 border border-amber-500/20 mt-4">
              <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-3 h-3" /> Tỉ lệ thành công
              </span>
              <span className="text-xl font-black text-amber-500">{rate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <Button 
          disabled={isUpgrading || isPending || ownedStones < stonesCount || (player?.coins || 0) < goldCost || availableStones.length === 0}
          onClick={handleUpgrade}
          className="w-full h-16 shrink-0 bg-amber-600 hover:bg-amber-500 text-white font-black text-lg uppercase tracking-[0.3em] shadow-[0_4px_20px_rgba(245,158,11,0.3)] disabled:opacity-50 mt-auto"
        >
          {isUpgrading || isPending ? 'Đang cường hóa...' : 'CƯỜNG HÓA NGAY'}
        </Button>
      </div>
    </div>
  );
}
