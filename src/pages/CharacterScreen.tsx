import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Star, Footprints, HardHat, Shield, Disc, GripHorizontal, Sparkles } from "lucide-react";
import { useHydratedCharacters, useInventory, useEquipItem, useUpgradeStar } from "@/hooks/usePlayerData";
import { getCharacterTotalStats, calculateCP, Equipment, STAR_BONUSES_MAP } from "@/stores/gameStore";
import { toast } from "sonner";
import { ArrowUpCircle } from "lucide-react";
import EquipmentUpgradeModal from "@/components/game/EquipmentUpgradeModal";

export default function CharacterScreen() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('fern_user_id') || '';
  
  const { data: inventory, isLoading: invLoading } = useInventory(userId);
  const { characters: FULL_CHARACTERS, isLoading: charsLoading } = useHydratedCharacters(userId);
  const { mutate: equipItem } = useEquipItem(userId);
  const { mutate: upgradeStar } = useUpgradeStar(userId);

  const [selectedCharId, setSelectedCharId] = useState('saber');
  const [showEquipSelect, setShowEquipSelect] = useState<{ charId: string; slot: string } | null>(null);
  const [upgradeTarget, setUpgradeTarget] = useState<Equipment | null>(null);

  const activeChar = FULL_CHARACTERS.find(c => c.id === selectedCharId);

  if (charsLoading || invLoading) return <div className="w-full h-screen bg-black flex items-center justify-center text-white">Loading Archive...</div>;
  
  // Debug inventory log
  if (inventory) {
    console.log("INVENTORY DATA:", inventory.length, "items found.");
  }

  const handleEquip = (eqId: string | null) => {
    if (!showEquipSelect) return;
    equipItem({ characterId: showEquipSelect.charId, slot: showEquipSelect.slot, equipmentId: eqId });
    setShowEquipSelect(null);
  };

  const SHARD_REQUIREMENTS: Record<number, number> = {
    2: 20, 3: 40, 4: 50, 5: 80, 6: 100
  };

  const handleUpgrade = () => {
    if (!activeChar || !activeChar.isUnlocked) return;
    if (activeChar.stars >= 6) return;
    const required = SHARD_REQUIREMENTS[activeChar.stars + 1];
    if (activeChar.shards >= required) {
      upgradeStar({ 
        characterId: activeChar.id, 
        newStar: activeChar.stars + 1, 
        remainShards: activeChar.shards - required 
      });
    } else {
      toast.error('Không đủ mảnh để nâng cấp!');
    }
  };



  if (!activeChar) return null;

  const totalStats = activeChar.isUnlocked ? getCharacterTotalStats(activeChar as any) : activeChar.baseStats;
  const cp = activeChar.isUnlocked ? calculateCP(activeChar as any) : 0;
  const isSaber = activeChar.id === 'saber';
  const showUpgradeReq = activeChar.stars < 6;
  const reqShards = activeChar.stars < 6 ? SHARD_REQUIREMENTS[activeChar.stars + 1] : 0;

  return (
    <div className="w-full h-screen bg-black text-white relative font-sans overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10" />
        <div className="absolute w-full h-full bg-[url('https://c4.wallpaperflare.com/wallpaper/500/442/354/outrun-vaporwave-hd-wallpaper-preview.jpg')] bg-cover bg-center mix-blend-overlay opacity-30 grayscale" />
      </div>

      <div className="absolute top-0 left-0 w-full p-8 z-20 flex justify-between">
        <button onClick={() => navigate('/')} className="text-zinc-500 hover:text-white uppercase tracking-widest text-xs font-bold transition-colors flex items-center">
          <ChevronLeft className="w-4 h-4 mr-2" /> Trở Về
        </button>
      </div>

      <div className="flex h-full relative z-10 p-16 pb-8 pt-24 gap-12 max-w-7xl mx-auto">
        {/* Left Column: List */}
        <div className="w-64 flex flex-col gap-4 border-r border-white/10 pr-8">
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
            <p className="text-amber-500 tracking-[0.4em] text-sm uppercase mt-2">Chiến lực: {cp.toLocaleString()}</p>
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
              <EquipSlot 
                label="Vũ khí" 
                item={activeChar.equipment.artifact} 
                slotType="artifact"
                onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'artifact' })} 
                onUpgrade={setUpgradeTarget}
              />
              <EquipSlot 
                label="Phụ kiện" 
                item={activeChar.equipment.ring} 
                slotType="ring"
                onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'ring' })} 
                onUpgrade={setUpgradeTarget}
              />
              <EquipSlot 
                label="Thắt Lưng" 
                item={activeChar.equipment.belt} 
                slotType="belt"
                onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'belt' })} 
                onUpgrade={setUpgradeTarget}
              />
            </div>
            <div className={`flex flex-col gap-12 pointer-events-auto items-end ${!activeChar.isUnlocked ? 'opacity-20 pointer-events-none' : ''}`}>
              <EquipSlot 
                label="Mũ" 
                item={activeChar.equipment.hat} 
                slotType="hat"
                onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'hat' })} 
                onUpgrade={setUpgradeTarget}
              />
              <EquipSlot 
                label="Áo Giáp" 
                item={activeChar.equipment.armor} 
                slotType="armor"
                onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'armor' })} 
                onUpgrade={setUpgradeTarget}
              />
              <EquipSlot 
                label="Giày" 
                item={activeChar.equipment.shoes} 
                slotType="shoes"
                onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'shoes' })} 
                onUpgrade={setUpgradeTarget}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Upgrade */}
        <div className="w-80 flex flex-col gap-8 ml-8">
          <div className="bg-zinc-950/50 backdrop-blur-md border border-white/10 p-6 flex items-center justify-between">
            <div className="flex">
              {Array.from({length: 6}).map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < activeChar.stars ? 'text-amber-500 fill-amber-500' : 'text-zinc-800'}`} />
              ))}
            </div>
            <div className="text-right">
               <div className="text-xs text-zinc-500 uppercase tracking-widest">Shards</div>
               <div className="text-lg font-bold">
                 <span className={activeChar.shards >= reqShards && showUpgradeReq ? "text-green-400" : "text-amber-400"}>{activeChar.shards}</span>
                 {showUpgradeReq ? ` / ${reqShards}` : ' / MAX'}
               </div>
            </div>
          </div>

          <button 
            disabled={!showUpgradeReq || activeChar.shards < reqShards || !activeChar.isUnlocked}
            onClick={handleUpgrade}
            className="w-full bg-transparent border border-amber-500 hover:bg-amber-500/10 text-amber-500 font-bold uppercase tracking-widest py-4 text-sm transition-colors disabled:opacity-20 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-600"
          >
            Nâng Cấp Sao
          </button>
          
          <button 
            onClick={() => navigate('/abilities')}
            className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold uppercase tracking-widest py-3 text-xs transition-colors"
          >
            Thông Tin Data
          </button>

          <div className="flex flex-col gap-2 mt-4 px-3 py-3 bg-white/5 border border-white/10">
             <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Mô tả Cấp Sao</h3>
             {(STAR_BONUSES_MAP[activeChar.id] || []).length > 0 ? (
               <div className="text-xs text-zinc-300 space-y-1">
                 {STAR_BONUSES_MAP[activeChar.id].map(b => (
                   <div key={b.stars}>
                     <span className={`font-bold min-w-[24px] inline-block mr-1 ${
                       activeChar.stars >= b.stars ? 'text-amber-400' : 'text-zinc-600'
                     }`}>★{b.stars}</span>
                     <span className={activeChar.stars >= b.stars ? 'text-zinc-200' : 'text-zinc-600'}>{b.desc}</span>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-xs text-zinc-500 italic">Nhân vật này chưa có mô tả đột phá.</div>
             )}
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <h3 className="text-xs text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2 mb-2">Thông Số Cốt Lõi</h3>
            <StatRow label="Điểm Sinh Mệnh" val={totalStats.hp} base={activeChar.baseStats.hp} />
            <StatRow label="Tốc Độ Di Chuyển" val={totalStats.speed} base={activeChar.baseStats.speed} />
            <StatRow label="Phòng Ngự" val={totalStats.armor} base={activeChar.baseStats.armor} />
            <StatRow label="Sát Thương" val={totalStats.dmg} base={activeChar.baseStats.dmg} />
          </div>
        </div>
      </div>

      {/* Equipment Selector Dialog */}
      {showEquipSelect && (() => {
        const filteredInventory = (inventory || []).filter((eq: any) => 
          eq.type === showEquipSelect.slot && 
          !FULL_CHARACTERS.some((c: any) => 
            c.isUnlocked && 
            c.id !== showEquipSelect.charId && 
            Object.values(c.equipment).some((e: any) => e?.id === eq.id)
          )
        );

        return (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 animate-in fade-in gap-6">
            {/* Left: Inventory Selection */}
            <div className="w-[600px] h-[85vh] max-h-[700px] bg-zinc-950 border border-white/10 p-8 shadow-2xl flex flex-col">
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold uppercase tracking-widest">KHO LƯU TRỮ VẬT PHẨM</h3>
                <button className="text-zinc-500 hover:text-white uppercase tracking-widest text-xs" onClick={() => setShowEquipSelect(null)}>ĐÓNG</button>
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {filteredInventory.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-zinc-600 tracking-widest uppercase text-sm">
                    Không tìm thấy vật phẩm tương thích ({showEquipSelect.slot})
                  </div>
                )}
                {filteredInventory
                  .sort((a: any, b: any) => {
                    const getEqScore = (eq: any) => {
                      let score = 0;
                      if (eq.rarity === 'rainbow') score += 100000;
                      else if (eq.rarity === 'black') score += 10000;
                      else if (eq.rarity === 'red') score += 1000;
                      else if (eq.rarity === 'orange') score += 100;
                      else if (eq.rarity === 'blue') score += 10;
                      score += (eq.stats?.hp || 0) + (eq.stats?.dmg || 0) * 2 + (eq.stats?.speed || 0) * 3 + (eq.stats?.armor || 0);
                      return score;
                    };
                    return getEqScore(b) - getEqScore(a);
                  })
                  .map((eq: any) => {
                    const isEquippedByMe = activeChar.equipment[eq.type as keyof typeof activeChar.equipment]?.id === eq.id;
                    return (
                      <button 
                        key={eq.id} 
                        onClick={() => handleEquip(eq.id)}
                        className={`text-left p-4 bg-zinc-950/80 border transition-colors hover:bg-zinc-900 ${
                           isEquippedByMe ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 
                           eq.rarity === 'rainbow' ? 'border-indigo-500/50 hover:border-indigo-400' :
                           eq.rarity === 'black' ? 'border-zinc-500/50 hover:border-zinc-400 bg-zinc-900' :
                           eq.rarity === 'red' ? 'border-red-500/50 hover:border-red-400' :
                           eq.rarity === 'orange' ? 'border-amber-500/50 hover:border-amber-400' :
                           'border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                          <div className="flex items-center gap-3">
                             <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center border border-white/10 ${
                               eq.rarity === 'rainbow' ? 'bg-gradient-to-tr from-red-500 via-emerald-500 to-indigo-500 text-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' :
                               eq.rarity === 'black' ? 'bg-zinc-950 text-white border-zinc-500 shadow-[0_0_5px_rgba(255,255,255,0.2)]' :
                               eq.rarity === 'red' ? 'bg-red-900 text-red-100 border-red-500' :
                               eq.rarity === 'orange' ? 'bg-amber-900 text-amber-100 border-amber-500' :
                               eq.rarity === 'blue' ? 'bg-blue-900 text-blue-100 border-blue-500' : 'bg-zinc-800 text-zinc-300'
                             }`}>
                               {eq.type === 'shoes' ? <Footprints className="w-4 h-4" /> :
                                eq.type === 'hat' ? <HardHat className="w-4 h-4" /> :
                                eq.type === 'armor' ? <Shield className="w-4 h-4" /> :
                                eq.type === 'ring' ? <Disc className="w-4 h-4" /> :
                                eq.type === 'belt' ? <GripHorizontal className="w-4 h-4" /> :
                                <Sparkles className="w-4 h-4" />}
                             </div>
                             <span className={`text-xs font-bold uppercase truncate max-w-[140px] ${
                               eq.rarity === 'rainbow' ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-emerald-400 to-indigo-400' :
                               eq.rarity === 'red' ? 'text-red-400' :
                               eq.rarity === 'orange' ? 'text-amber-400' :
                               eq.rarity === 'black' ? 'text-zinc-400' : 
                               eq.rarity === 'blue' ? 'text-blue-400' : 'text-zinc-300'
                             }`}>{eq.name}</span>
                          </div>
                          {isEquippedByMe && <span className="text-[9px] text-amber-500 tracking-widest uppercase ml-2 border border-amber-500 px-1 py-0.5 bg-amber-500/10">Đã trang bị</span>}
                        </div>
                        <div className="text-[10px] text-zinc-500 mb-2 uppercase tracking-tighter">
                          {eq.type_name || eq.typeName}
                        </div>
                        <div className="grid grid-cols-2 gap-y-1 text-zinc-400 text-xs">
                          {eq.stats?.hp > 0 && <span className="text-green-400 flex justify-between pr-2 border-r border-white/5">HP: <span>+{eq.stats.hp}</span></span>}
                          {eq.stats?.dmg > 0 && <span className="text-red-400 flex justify-between pl-2">DMG: <span>+{eq.stats.dmg}</span></span>}
                          {eq.stats?.armor > 0 && <span className="text-blue-400 flex justify-between pr-2 border-r border-white/5">ARMOR: <span>+{eq.stats.armor}</span></span>}
                          {eq.stats?.speed > 0 && <span className="text-zinc-300 flex justify-between pl-2">SPEED: <span>+{eq.stats.speed}</span></span>}
                        </div>
                      </button>
                    );
                  })}
              </div>
              <button onClick={() => handleEquip(null)} className="w-full mt-6 py-4 block bg-red-950/30 text-red-500 uppercase tracking-widest text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors shrink-0">
                Gỡ bỏ trang bị
              </button>
            </div>
            
            {/* Right: Upgrade Panel */}
            <div className="w-[500px] h-[85vh] max-h-[700px]">
              {activeChar.equipment[showEquipSelect.slot as keyof typeof activeChar.equipment] ? (
                <EquipmentUpgradeModal 
                  inline 
                  equipment={activeChar.equipment[showEquipSelect.slot as keyof typeof activeChar.equipment] as Equipment}
                />
              ) : (
                <div className="w-full h-full bg-zinc-950 border border-white/10 flex items-center justify-center text-zinc-600 font-bold uppercase tracking-widest text-sm text-center px-8">
                  Hãy trang bị vật phẩm<br/>để có thể cường hóa
                </div>
              )}
            </div>
          </div>
        );
      })()}
      {upgradeTarget && (
        <EquipmentUpgradeModal 
          equipment={upgradeTarget} 
          onClose={() => setUpgradeTarget(null)} 
        />
      )}
    </div>
  );
}

function StatRow({ label, val, base }: { label: string, val: number, base: number }) {
  const bonus = val - base;
  return (
    <div className="flex justify-between items-end border-b border-white/5 pb-1">
      <span className="text-zinc-400 text-sm">{label}</span>
      <div className="text-right">
        <span className="text-lg font-bold">{val}</span>
        {bonus > 0 && <span className="text-green-500 text-xs ml-2">+{bonus}</span>}
      </div>
    </div>
  );
}

function EquipSlot({ label, item, slotType, onClick, onUpgrade }: { label: string, item: any, slotType: string, onClick: () => void, onUpgrade: (eq: Equipment) => void }) {
  const renderIcon = (isEquipped: boolean) => {
    const iconClass = isEquipped ? "w-8 h-8 drop-shadow-md" : "w-6 h-6 opacity-30 group-hover:opacity-100 transition-opacity text-white";
    if (slotType === 'shoes') return <Footprints className={iconClass} />;
    if (slotType === 'hat') return <HardHat className={iconClass} />;
    if (slotType === 'armor') return <Shield className={iconClass} />;
    if (slotType === 'ring') return <Disc className={iconClass} />;
    if (slotType === 'belt') return <GripHorizontal className={iconClass} />;
    return <Sparkles className={iconClass} />;
  };

  return (
    <div className="flex gap-4 items-center group">
      <button onClick={onClick} className={`w-16 h-16 border flex items-center justify-center transition-all ${
        item 
         ? (item.rarity === 'rainbow' ? 'border-indigo-400 bg-indigo-950/50 shadow-[0_0_15px_rgba(99,102,241,0.3)] text-indigo-400' :
            item.rarity === 'black' ? 'border-zinc-500 bg-zinc-950 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 
            item.rarity === 'red' ? 'border-red-500 bg-red-950/50 text-red-500' : 
            item.rarity === 'orange' ? 'border-amber-500 bg-amber-950/50 text-amber-500' : 
            'border-blue-500 bg-blue-950/50 text-blue-500')
         : 'border-white/10 bg-black hover:border-white/30'
      }`}>
        {renderIcon(!!item)}
      </button>
      <div className="text-left flex-1 min-w-0">
        <div className="text-[10px] text-zinc-500 tracking-widest uppercase mb-1">{label}</div>
        <div className="flex items-center gap-2">
          <button onClick={onClick} className="text-sm font-bold truncate max-w-[100px] hover:text-amber-400 transition-colors">
            {item ? item.name : 'Trống'}
          </button>
          {item && <span className="text-[10px] font-black text-amber-500 shrink-0">+{item.level || 0}</span>}
        </div>
      </div>
      {item && (
        <button 
          onClick={(e) => { e.stopPropagation(); onUpgrade(item); }}
          className="p-2 text-zinc-600 hover:text-amber-500 transition-colors"
          title="Cường Hóa"
        >
          <ArrowUpCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
