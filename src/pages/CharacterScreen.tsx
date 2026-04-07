import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Star, Footprints, HardHat, Shield, Disc, GripHorizontal, Sparkles, ArrowUpCircle, ChevronUp, ChevronDown } from "lucide-react";
import { useHydratedCharacters, useInventory, useEquipItem, useUpgradeStar, useUpgradeLevel, usePlayer, useMaterials, useBreakthrough } from "@/hooks/usePlayerData";
import { 
  getCharacterTotalStats, 
  calculateCP, 
  Equipment, 
  STAR_BONUSES_MAP, 
  getStarTier, 
  getRealmTitle, 
  getRealmStage, 
  getLevelCap,
  getRequiredExp,
  REALM_DATA
} from "@/stores/gameStore";
import { toast } from "sonner";
import EquipmentUpgradeModal from "@/components/game/EquipmentUpgradeModal";
import { EquipmentIcon } from "@/components/game/EquipmentIcon";

export default function CharacterScreen() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('fern_user_id') || '';
  
  const { data: player } = usePlayer(userId);
  const { data: inventory, isLoading: invLoading } = useInventory(userId);
  const { data: materials } = useMaterials(userId);
  const { characters: FULL_CHARACTERS, isLoading: charsLoading } = useHydratedCharacters(userId);
  const { mutate: equipItem } = useEquipItem(userId);
  const upgradeStarMutation = useUpgradeStar(userId);
  const upgradeLevelMutation = useUpgradeLevel(userId);
  const breakthroughMutation = useBreakthrough(userId);

  const [selectedCharId, setSelectedCharId] = useState('saber');
  const [showEquipSelect, setShowEquipSelect] = useState<{ charId: string; slot: string } | null>(null);
  const [upgradeTarget, setUpgradeTarget] = useState<Equipment | null>(null);
  const [showBreakthroughModal, setShowBreakthroughModal] = useState(false);

  const activeChar = FULL_CHARACTERS.find(c => c.id === selectedCharId);

  if (charsLoading || invLoading) return <div className="w-full h-screen bg-black flex items-center justify-center text-white">Loading Archive...</div>;
  
  if (!activeChar) return null;

  const totalStats = activeChar.isUnlocked ? getCharacterTotalStats(activeChar as any) : activeChar.baseStats;
  const cp = activeChar.isUnlocked ? calculateCP(activeChar as any, totalStats as any) : 0;
  const currentTier = getStarTier(activeChar.stars);
  const realmTitle = getRealmTitle(activeChar.realm_rank);
  const realmStage = getRealmStage(activeChar.realm_rank);
  const levelCap = getLevelCap(activeChar.realm_rank);

  const handleEquip = (eqId: string | null) => {
    if (!showEquipSelect) return;
    equipItem({ characterId: showEquipSelect.charId, slot: showEquipSelect.slot, equipmentId: eqId });
    setShowEquipSelect(null);
  };

  // New Shard Requirement Logic: Base 20 + 5 per star upgrade
  const getRequiredShards = (currentStar: number) => 20 + (currentStar - 1) * 5;

  const handleUpgrade = () => {
    if (!activeChar || !activeChar.isUnlocked) return;
    if (activeChar.stars >= 46) {
      toast.info('Đã đạt đỉnh phong Thất Sắc 5 Sao!');
      return;
    }
    const required = getRequiredShards(activeChar.stars);
    if (activeChar.shards >= required) {
      upgradeStarMutation.mutate({ 
        characterId: activeChar.id, 
        newStar: activeChar.stars + 1, 
        remainingShards: activeChar.shards - required 
      });
    } else {
      toast.error(`Cần ${required} mảnh để đột phá!`);
    }
  };

  const renderStars = () => {
    // Show current tier range stars
    const [min, max] = currentTier.range;
    const countInTier = max - min + 1;
    const activeInTier = activeChar.stars - min + 1;

    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex gap-1">
          {Array.from({ length: countInTier }).map((_, i) => {
            const isActive = i < activeInTier;
            let starColor = currentTier.color || '#white';
            
            // Handle multi-color tiers
            if (currentTier.colors) {
              starColor = currentTier.colors[i % currentTier.colors.length];
            }

            return (
              <Star 
                key={i} 
                className={`w-5 h-5 transition-all duration-500`} 
                style={{ 
                  color: isActive ? starColor : '#1f2937', 
                  fill: isActive ? starColor : 'transparent',
                  filter: isActive ? `drop-shadow(0 0 5px ${starColor})` : 'none'
                }} 
              />
            );
          })}
        </div>
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: currentTier.color || '#fff' }}>
          {currentTier.label} {activeInTier}/{countInTier}
        </span>
      </div>
    );
  };

  return (
    <div className="w-full h-screen bg-black text-white relative font-sans overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10" />
        <div className="absolute w-full h-full bg-[url('https://c4.wallpaperflare.com/wallpaper/500/442/354/outrun-vaporwave-hd-wallpaper-preview.jpg')] bg-cover bg-center mix-blend-overlay opacity-30 grayscale" />
      </div>

      <div className="absolute top-0 left-0 w-full p-8 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => navigate('/')} className="text-zinc-500 hover:text-white uppercase tracking-widest text-xs font-bold transition-colors flex items-center">
          <ChevronLeft className="w-4 h-4 mr-2" /> Trở Về
        </button>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-zinc-950/50 border border-white/10 px-4 py-2 rounded-lg">
             <img src="/icon rpg/coin.png" className="w-4 h-4 object-contain" alt="Coin" />
             <span className="text-sm font-black text-amber-500 tabular-nums">
               {player?.coins?.toLocaleString() || 0}
             </span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-950/50 border border-white/10 px-4 py-2 rounded-lg">
             <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-black text-[8px] font-black italic shadow-[0_0_10px_rgba(59,130,246,0.5)]">KC</div>
             <span className="text-sm font-black text-blue-400 tabular-nums">
               {player?.kc_balance?.toLocaleString() || 0}
             </span>
          </div>
        </div>
      </div>

      <div className="flex h-full relative z-10 p-16 pb-8 pt-24 gap-12 max-w-7xl mx-auto">
        {/* Left Column: List */}
        <div className="w-64 flex flex-col gap-4 border-r border-white/10 pr-8 overflow-y-auto custom-scrollbar">
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest font-bold border-b border-white/5 pb-2">Danh sách</h2>
          {FULL_CHARACTERS.map(c => (
            <button 
              key={c.id} 
              onClick={() => setSelectedCharId(c.id)}
              className={`text-left text-sm uppercase tracking-wider py-3 border-l-2 transition-all ${selectedCharId === c.id ? 'border-amber-500 text-white pl-4' : 'border-transparent text-zinc-500 pl-2 hover:pl-4 hover:text-zinc-300'}`}
            >
              {c.name} {!c.isUnlocked && '(Chưa có)'}
            </button>
          ))}
        </div>

        {/* Center: Visual & Equipment */}
        <div className="flex-1 flex flex-col items-center relative">
          <div className="absolute top-0 flex flex-col items-center">
            <h1 className="text-7xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              {activeChar.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs font-bold uppercase tracking-widest ${realmStage.color}`}>{realmStage.label}</span>
              <span className="w-1 h-1 bg-zinc-700 rounded-full" />
              <span className="text-amber-500 font-display text-xl uppercase tracking-widest">{realmTitle}</span>
            </div>
            <p className="text-zinc-500 tracking-[0.4em] text-[10px] uppercase mt-1">Chiến lực: {cp.toLocaleString()}</p>
          </div>

          <div className="w-[400px] h-[500px] mt-24 relative flex items-center justify-center pointer-events-none">
            {activeChar.videoAvatar ? (
              <img 
                src={activeChar.videoAvatar} 
                className="h-full object-cover mix-blend-screen opacity-90 filter contrast-125 rounded-3xl" 
                alt={activeChar.name}
              />
            ) : (
                <div className="text-zinc-700 text-6xl font-black uppercase blur-[2px]">{activeChar.name}</div>
            )}
          </div>

          {/* Equipment Slots Around Character */}
          <div className="absolute top-48 w-[600px] flex justify-between pointer-events-none">
            {!activeChar.isUnlocked && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-auto">
                <div className="bg-black/80 border border-white/10 px-6 py-3 text-center">
                  <div className="text-2xl mb-1">🔒</div>
                  <div className="text-xs text-zinc-400 uppercase tracking-widest">Chưa sở hữu</div>
                </div>
              </div>
            )}
            <div className={`flex flex-col gap-12 pointer-events-auto ${!activeChar.isUnlocked ? 'opacity-20 pointer-events-none' : ''}`}>
              <EquipSlot label="Vũ khí" item={activeChar.equipment.artifact} slotType="artifact" onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'artifact' })} onUpgrade={setUpgradeTarget} />
              <EquipSlot label="Phụ kiện" item={activeChar.equipment.ring} slotType="ring" onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'ring' })} onUpgrade={setUpgradeTarget} />
              <EquipSlot label="Thắt Lưng" item={activeChar.equipment.belt} slotType="belt" onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'belt' })} onUpgrade={setUpgradeTarget} />
            </div>
            <div className={`flex flex-col gap-12 pointer-events-auto items-end ${!activeChar.isUnlocked ? 'opacity-20 pointer-events-none' : ''}`}>
              <EquipSlot side="right" label="Mũ" item={activeChar.equipment.hat} slotType="hat" onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'hat' })} onUpgrade={setUpgradeTarget} />
              <EquipSlot side="right" label="Áo Giáp" item={activeChar.equipment.armor} slotType="armor" onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'armor' })} onUpgrade={setUpgradeTarget} />
              <EquipSlot side="right" label="Giày" item={activeChar.equipment.shoes} slotType="shoes" onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'shoes' })} onUpgrade={setUpgradeTarget} />
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Upgrade */}
        <div className="w-80 flex flex-col gap-8 ml-8 overflow-y-auto custom-scrollbar pr-2 h-full">
          <div className="bg-zinc-950/50 backdrop-blur-md border border-white/10 p-6 flex flex-col gap-4">
            {renderStars()}
            
            <div className="flex justify-between items-center border-t border-white/5 pt-4">
               <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Cấp Độ</div>
                  <div className="text-lg font-bold text-white">Lv. {activeChar.level} <span className="text-zinc-600 text-xs font-normal">/ {levelCap}</span></div>
               </div>
               <div className="text-right">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Mảnh</div>
                  <div className="text-lg font-bold">
                    <span className={activeChar.shards >= getRequiredShards(activeChar.stars) ? "text-green-400" : "text-amber-400"}>{activeChar.shards}</span>
                    <span className="text-zinc-600 text-xs"> / {getRequiredShards(activeChar.stars)}</span>
                  </div>
               </div>
            </div>

            {/* Exp Bar */}
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
               <div 
                 className="h-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)] transition-all duration-700" 
                 style={{ width: `${Math.min(100, (activeChar.exp / getRequiredExp(activeChar.level)) * 100)}%` }}
               />
            </div>
            <div className="text-[8px] text-zinc-600 text-right font-mono tracking-tighter uppercase">
               EXP {activeChar.exp.toLocaleString()} / {getRequiredExp(activeChar.level).toLocaleString()}
            </div>
          </div>

          <div className="flex flex-col gap-3">
             {(() => {
               const levelCost = Math.floor(Math.pow(activeChar.level, 1.2) * 800 + 500);
               
               // Calculate x10 cost and gain
               const levelsToGainX10 = Math.min(10, levelCap - activeChar.level);
               let totalCostX10 = 0;
               for (let i = 0; i < levelsToGainX10; i++) {
                 totalCostX10 += Math.floor(Math.pow(activeChar.level + i, 1.2) * 800 + 500);
               }

               return (
                 <div className="flex flex-col gap-3">
                   <button 
                     disabled={activeChar.level >= levelCap || (player?.coins || 0) < levelCost || upgradeLevelMutation.isPending || !activeChar.isUnlocked}
                     onClick={() => upgradeLevelMutation.mutate({ characterId: activeChar.id, newLevel: activeChar.level + 1, cost: levelCost })}
                     className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest py-4 text-sm transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-95"
                   >
                     {upgradeLevelMutation.isPending ? 'Đang thăng cấp...' : `Thăng Cấp (${levelCost.toLocaleString()} Vàng)`}
                   </button>
                   
                   {levelsToGainX10 > 1 && (
                     <button 
                       disabled={(player?.coins || 0) < totalCostX10 || upgradeLevelMutation.isPending || !activeChar.isUnlocked}
                       onClick={() => upgradeLevelMutation.mutate({ characterId: activeChar.id, newLevel: activeChar.level + levelsToGainX10, cost: totalCostX10 })}
                       className="w-full bg-zinc-950/50 border border-amber-500/20 hover:bg-amber-500/5 text-amber-500 font-bold uppercase tracking-[0.15em] py-3 text-[10px] transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
                     >
                       {upgradeLevelMutation.isPending ? '...' : `Thăng Cấp x${levelsToGainX10} (${totalCostX10.toLocaleString()} Vàng)`}
                     </button>
                   )}
                 </div>
               );
             })()}

             {activeChar.level >= levelCap && activeChar.realm_rank < REALM_DATA.length - 1 && (
                <button 
                  disabled={breakthroughMutation.isPending || !activeChar.isUnlocked}
                  onClick={() => setShowBreakthroughModal(true)}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest py-4 text-sm transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse"
                >
                  Đột Phá Cảnh Giới
                </button>
             )}

             <button 
               disabled={activeChar.stars >= 6 || activeChar.shards < getRequiredShards(activeChar.stars) || upgradeStarMutation.isPending || !activeChar.isUnlocked}
               onClick={handleUpgrade}
               className="w-full bg-transparent border border-amber-500 hover:bg-amber-500/10 text-amber-500 font-bold uppercase tracking-widest py-4 text-sm transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-600 shadow-[0_0_15px_rgba(245,158,11,0.1)] active:scale-95"
             >
               Nâng Sao
             </button>
          </div>
          
          <button onClick={() => navigate('/abilities')} className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold uppercase tracking-widest py-3 text-xs transition-colors">
            Thông Tin Data
          </button>

          <div className="mt-4 px-3 py-3 bg-white/5 border border-white/10 relative group">
            <div className="flex justify-between items-center mb-1 border-b border-white/5 pb-1">
              <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest">Mô tả Đột phá</h3>
              <div className="flex flex-col -space-y-1">
                <ChevronUp className="w-3 h-3 text-amber-500/50" />
                <ChevronDown className="w-3 h-3 text-amber-500/50" />
              </div>
            </div>
            
            <div className="relative">
              {/* Custom Track Background for Visuals */}
              <div className="absolute right-0 top-0 bottom-0 w-[10px] bg-black/40 rounded-full border-l border-white/5 pointer-events-none" />
              
              <div className="flex flex-col gap-2 max-h-[100px] overflow-y-auto custom-scrollbar pr-3 mt-2 scroll-smooth">
                 {(STAR_BONUSES_MAP[activeChar.id] || []).length > 0 ? (
                   <div className="text-xs text-zinc-300 space-y-1">
                     {STAR_BONUSES_MAP[activeChar.id].map(b => (
                       <div key={b.stars} className="flex gap-2">
                         <span className={`font-bold min-w-[32px] inline-block ${activeChar.stars >= b.stars ? 'text-amber-400' : 'text-zinc-600'}`}>★{b.stars}</span>
                         <span className={activeChar.stars >= b.stars ? 'text-zinc-200' : 'text-zinc-600'}>{b.desc}</span>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-xs text-zinc-500 italic">Nhân vật này chưa có mô tả đột phá.</div>
                 )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <h3 className="text-xs text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2 mb-2">Thông Số Cốt Lõi</h3>
            <StatRow label="Máu" val={totalStats.hp} base={activeChar.baseStats.hp} />
            <StatRow label="Tốc Độ" val={totalStats.speed} base={activeChar.baseStats.speed} />
            <StatRow label="Phòng Ngự" val={totalStats.armor} base={activeChar.baseStats.armor} />
            <StatRow label="Sát Thương" val={totalStats.dmg} base={activeChar.baseStats.dmg} />
          </div>
        </div>
      </div>

      {/* Equipment Selector Dialog */}
      {showEquipSelect && (() => {
        const getItemPower = (eq: any) => {
          if (!eq || !eq.stats) return 0;
          return (eq.stats.hp || 0) * 0.4 + 
                 (eq.stats.dmg || 0) * 10 + 
                 (eq.stats.armor || 0) * 2 + 
                 (eq.stats.speed || 0) * 25 + 
                 (eq.level || 0) * 100;
        };

        const filteredInventory = (inventory || [])
          .filter((eq: any) => 
            eq.type === showEquipSelect.slot && 
            !FULL_CHARACTERS.some((c: any) => 
              c.isUnlocked && 
              c.id !== showEquipSelect.charId && 
              Object.values(c.equipment).some((e: any) => e?.id === eq.id)
            )
          )
          .sort((a: any, b: any) => getItemPower(b) - getItemPower(a));

        const getRarityClass = (rarity: string) => {
          switch (rarity) {
            case 'rainbow': return 'border-indigo-400 bg-indigo-950/20 shadow-[0_0_15px_rgba(99,102,241,0.2)] text-indigo-400';
            case 'black':   return 'border-zinc-500 bg-zinc-900/20 text-zinc-300';
            case 'red':     return 'border-red-500 bg-red-950/20 text-red-500';
            case 'orange':  return 'border-amber-500 bg-amber-950/20 text-amber-500';
            case 'purple':  return 'border-purple-500 bg-purple-950/20 text-purple-500';
            case 'blue':    return 'border-blue-500 bg-blue-950/20 text-blue-500';
            case 'green':   return 'border-emerald-500 bg-emerald-950/20 text-emerald-500';
            default:        return 'border-white/10 bg-zinc-950/50 text-zinc-400';
          }
        };

        return (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 animate-in fade-in gap-6">
            <div className="w-[600px] h-[85vh] max-h-[700px] bg-zinc-950 border border-white/10 p-8 shadow-2xl flex flex-col">
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500">KHO LƯU TRỮ VẬT PHẨM</h3>
                <button className="text-zinc-500 hover:text-white uppercase tracking-widest text-xs" onClick={() => setShowEquipSelect(null)}>ĐÓNG</button>
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {filteredInventory.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-zinc-600 tracking-widest uppercase text-sm">
                    Không tìm thấy vật phẩm tương thích ({showEquipSelect.slot})
                  </div>
                )}
                {filteredInventory.map((eq: any) => {
                  const isEquippedByMe = (activeChar.equipment as any)[eq.type]?.id === eq.id;
                  const rarityClass = getRarityClass(eq.rarity);
                  const itemPower = getItemPower(eq);

                  return (
                    <button 
                      key={eq.id} 
                      onClick={() => handleEquip(eq.id)} 
                      className={`text-left p-4 transition-all hover:scale-[1.02] active:scale-95 border-2 ${isEquippedByMe ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : rarityClass}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <EquipmentIcon type={eq.type} level={eq.level || 0} rarity={eq.rarity} size="sm" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black uppercase truncate">{eq.name}</span>
                          <span className="text-[9px] opacity-70 tracking-tighter uppercase font-bold">Lực chiến: {itemPower.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-y-1 text-[10px] opacity-80">
                        {eq.stats?.hp > 0 && <span className="text-green-400">HP: +{eq.stats.hp}</span>}
                        {eq.stats?.dmg > 0 && <span className="text-red-400">DMG: +{eq.stats.dmg}</span>}
                        {eq.stats?.armor > 0 && <span className="text-blue-400">ARM: +{eq.stats.armor}</span>}
                        {eq.level > 0 && <span className="text-amber-500 col-span-2 font-black">CƯỜNG HÓA: +{eq.level}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => handleEquip(null)} className="w-full mt-6 py-4 block bg-red-950/30 text-red-500 uppercase tracking-widest text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors">Gỡ bỏ trang bị</button>
            </div>
             <div className="w-[500px] h-[85vh] max-h-[700px]">
              {activeChar.equipment[showEquipSelect.slot as keyof typeof activeChar.equipment] ? (
                <EquipmentUpgradeModal inline equipment={activeChar.equipment[showEquipSelect.slot as keyof typeof activeChar.equipment] as Equipment} />
              ) : (
                <div className="w-full h-full bg-zinc-950 border border-white/10 flex items-center justify-center text-zinc-600 font-bold uppercase tracking-widest text-sm text-center px-8">Hãy trang bị vật phẩm<br/>để có thể cường hóa</div>
              )}
            </div>
          </div>
        );
      })()}
      {upgradeTarget && <EquipmentUpgradeModal equipment={upgradeTarget} onClose={() => setUpgradeTarget(null)} />}
      
      {showBreakthroughModal && (() => {
        const nextRealm = REALM_DATA[activeChar.realm_rank + 1];
        if (!nextRealm) return null;
        
        const stoneInInv = materials?.find((m: any) => m.material_id === 'magic_stone')?.amount || 0;
        const hasStone = stoneInInv >= nextRealm.costStone;
        const hasKC = (player?.kc_balance || 0) >= nextRealm.costKC;
        const canBreakthrough = hasStone && hasKC;

        return (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[60] animate-in zoom-in duration-300">
            <div className="w-[500px] bg-zinc-950 border border-purple-500/30 p-8 shadow-[0_0_50px_rgba(168,85,247,0.2)] flex flex-col items-center">
              <div className="w-20 h-20 bg-purple-900/30 rounded-full flex items-center justify-center mb-6 border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <Sparkles className="w-10 h-10 text-purple-400 animate-pulse" />
              </div>
              
              <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-1">ĐỘT PHÁ CẢNH GIỚI</h3>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-8">Hành trình từ {realmTitle} tới {nextRealm.name}</p>

              <div className="w-full grid grid-cols-2 gap-4 mb-8">
                <div className={`p-4 border bg-zinc-900/50 flex flex-col items-center gap-2 ${hasStone ? 'border-zinc-800' : 'border-red-900/50'}`}>
                  <img src="/icon rpg/magic_stone.png" className="w-8 h-8 object-contain" alt="Stone" />
                  <div className="text-[10px] text-zinc-500 uppercase font-bold text-center">Đá Đột Phá</div>
                  <div className={`text-lg font-black ${hasStone ? 'text-white' : 'text-red-500'}`}>{stoneInInv} / {nextRealm.costStone}</div>
                </div>
                <div className={`p-4 border bg-zinc-900/50 flex flex-col items-center gap-2 ${hasKC ? 'border-zinc-800' : 'border-red-900/50'}`}>
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-black text-[10px] font-black italic shadow-[0_0_10px_rgba(59,130,246,0.5)]">KC</div>
                  <div className="text-[10px] text-zinc-500 uppercase font-bold text-center">Kim Cương</div>
                  <div className={`text-lg font-black ${hasKC ? 'text-white' : 'text-red-500'}`}>{(player?.kc_balance || 0).toLocaleString()} / {nextRealm.costKC.toLocaleString()}</div>
                </div>
              </div>

              <div className="w-full bg-zinc-900/80 border border-white/5 p-4 mb-8">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Tỷ lệ thành công</span>
                   <span className="text-amber-500 font-black text-xl">{Math.round(nextRealm.successRate * 100)}%</span>
                 </div>
                 <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all" 
                     style={{ width: `${nextRealm.successRate * 100}%` }}
                   />
                 </div>
              </div>

              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setShowBreakthroughModal(false)}
                  className="flex-1 border border-white/10 hover:bg-white/5 text-zinc-500 hover:text-white py-4 uppercase font-bold tracking-widest text-[10px] transition-all"
                >
                  Hủy Bỏ
                </button>
                <button 
                  disabled={!canBreakthrough || breakthroughMutation.isPending}
                  onClick={() => {
                    const roll = Math.random();
                    const success = roll <= nextRealm.successRate;
                    breakthroughMutation.mutate({
                      characterId: activeChar.id,
                      costStone: nextRealm.costStone,
                      costKC: nextRealm.costKC,
                      success
                    }, {
                      onSuccess: () => {
                        if (success) {
                          toast.success(`ĐỘT PHÁ THÀNH CÔNG! Chúc mừng bạn đã bước vào ${nextRealm.name}!`, {
                            duration: 5000,
                            style: { background: '#10b981', color: '#fff', border: '1px solid #059669' }
                          });
                          setShowBreakthroughModal(false);
                        } else {
                          toast.error(`ĐỘT PHÁ THẤT BẠI! Tâm ma đã xâm chiếm, tài nguyên đã tiêu hao sạch sẽ...`, {
                            duration: 5000,
                            style: { background: '#ef4444', color: '#fff', border: '1px solid #dc2626' }
                          });
                        }
                      }
                    });
                  }}
                  className="flex-[2] bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 uppercase font-black tracking-widest text-xs transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-95"
                >
                  {breakthroughMutation.isPending ? 'Đang Đột Phá...' : 'Tiến Hành Đột Phá'}
                </button>
              </div>
              
              {breakthroughMutation.isError && (
                <p className="text-red-500 text-[10px] mt-4 uppercase font-bold">Lỗi hệ thống! Hãy thử lại.</p>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function StatRow({ label, val, base }: { label: string, val: number, base: number }) {
  const bonus = val - Math.floor(base); // handle level mult floor
  return (
    <div className="flex justify-between items-end border-b border-white/5 pb-1">
      <span className="text-zinc-400 text-sm">{label}</span>
      <div className="text-right">
        <span className="text-lg font-bold">{val.toLocaleString()}</span>
        {bonus > 0 && <span className="text-green-500 text-xs ml-2">+{bonus.toLocaleString()}</span>}
      </div>
    </div>
  );
}

function EquipSlot({ label, item, slotType, onClick, onUpgrade, side = 'left' }: { label: string, item: any, slotType: string, onClick: () => void, onUpgrade: (eq: Equipment) => void, side?: 'left' | 'right' }) {
  return (
    <div className={`flex gap-4 items-center group ${side === 'right' ? 'flex-row-reverse text-right' : 'text-left'}`}>
      <button onClick={onClick} className={`w-20 h-20 border-2 flex items-center justify-center transition-all relative overflow-hidden shrink-0 ${
        item 
         ? (item.rarity === 'rainbow' ? 'border-indigo-400 bg-indigo-950/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]' :
            item.rarity === 'black'   ? 'border-zinc-500 bg-zinc-950 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 
            item.rarity === 'red'     ? 'border-red-500 bg-red-900/40' : 
            item.rarity === 'orange'  ? 'border-amber-500 bg-amber-900/40' : 
            item.rarity === 'purple'  ? 'border-purple-500 bg-purple-900/40' :
            item.rarity === 'blue'    ? 'border-blue-500 bg-blue-900/40' :
                                        'border-zinc-400 bg-zinc-900/40') // White / Default
         : 'border-white/10 bg-black hover:border-white/30'
      }`}>
        <EquipmentIcon type={item?.type || slotType} level={item?.level || 0} rarity={item?.rarity} size="md" className={item ? "" : "opacity-20 grayscale"} />
        {item && item.level > 0 && (
          <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] px-1 font-black rounded-sm z-30">
            +{item.level}
          </div>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-zinc-500 tracking-widest uppercase mb-1">{label}</div>
        <div className={`flex items-center gap-2 ${side === 'right' ? 'justify-end' : 'justify-start'}`}>
          <button onClick={onClick} className="text-sm font-bold truncate max-w-[120px] hover:text-amber-400 transition-colors uppercase">
            {item ? item.name : 'Trống'}
          </button>
        </div>
      </div>
      {item && (
        <button 
          onClick={(e) => { e.stopPropagation(); onUpgrade(item); }}
          className={`p-2 text-zinc-600 hover:text-amber-500 transition-colors ${side === 'right' ? 'mr-0' : ''}`}
          title="Cường Hóa"
        >
          <ArrowUpCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
