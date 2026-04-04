import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Star } from "lucide-react";
import { useHydratedCharacters, useInventory, useEquipItem, useUpgradeStar } from "@/hooks/usePlayerData";
import { getCharacterTotalStats, calculateCP } from "@/stores/gameStore";
import { toast } from "sonner";

export default function CharacterScreen() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('fern_user_id') || '';
  
  const { data: inventory, isLoading: invLoading } = useInventory(userId);
  const { characters: FULL_CHARACTERS, isLoading: charsLoading } = useHydratedCharacters(userId);
  const { mutate: equipItem } = useEquipItem(userId);
  const { mutate: upgradeStar } = useUpgradeStar(userId);

  const [selectedCharId, setSelectedCharId] = useState('saber');
  const [showEquipSelect, setShowEquipSelect] = useState<{ charId: string; slot: string } | null>(null);

  const activeChar = FULL_CHARACTERS.find(c => c.id === selectedCharId);

  if (charsLoading || invLoading) return <div className="w-full h-screen bg-black flex items-center justify-center text-white">Loading Archive...</div>;

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
            {isSaber ? (
              <img src="/videos/saber-avatar.gif" className="h-full object-cover mix-blend-screen opacity-90 filter contrast-125 rounded-3xl" />
            ) : (
              <div className="text-zinc-700 text-6xl font-black uppercase blur-[2px]">{activeChar.name}</div>
            )}
          </div>

          {/* Equipment Slots Around Character */}
          {activeChar.isUnlocked && (
            <div className="absolute top-48 w-[600px] flex justify-between pointer-events-none">
              <div className="flex flex-col gap-12 pointer-events-auto">
                <EquipSlot 
                  label="Vũ khí" 
                  item={activeChar.equipment.artifact} 
                  onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'artifact' })} 
                />
                <EquipSlot 
                  label="Phụ kiện" 
                  item={activeChar.equipment.ring} 
                  onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'ring' })} 
                />
                <EquipSlot 
                  label="Thắt Lưng" 
                  item={activeChar.equipment.belt} 
                  onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'belt' })} 
                />
              </div>
              <div className="flex flex-col gap-12 pointer-events-auto items-end">
                <EquipSlot 
                  label="Mũ" 
                  item={activeChar.equipment.hat} 
                  onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'hat' })} 
                />
                <EquipSlot 
                  label="Áo Giáp" 
                  item={activeChar.equipment.armor} 
                  onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'armor' })} 
                />
                <EquipSlot 
                  label="Giày" 
                  item={activeChar.equipment.shoes} 
                  onClick={() => setShowEquipSelect({ charId: activeChar.id, slot: 'shoes' })} 
                />
              </div>
            </div>
          )}
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
      {showEquipSelect && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 animate-in fade-in">
           <div className="w-[600px] bg-zinc-950 border border-white/10 p-8 shadow-2xl">
             <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
               <h3 className="text-xl font-bold uppercase tracking-widest">KHO LƯU TRỮ VẬT PHẨM</h3>
               <button className="text-zinc-500 hover:text-white uppercase tracking-widest text-xs" onClick={() => setShowEquipSelect(null)}>ĐÓNG</button>
             </div>
             <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {inventory.filter((eq: any) => eq.type === showEquipSelect.slot && 
                  // Lọc những món đồ chưa được ai gắn (Hoặc đang được thằng này gắn)
                  !FULL_CHARACTERS.some((c: any) => c.isUnlocked && c.id !== showEquipSelect.charId && [c.equipment.shoes?.id, c.equipment.hat?.id, c.equipment.armor?.id, c.equipment.ring?.id, c.equipment.belt?.id, c.equipment.artifact?.id].includes(eq.id))
                ).length === 0 && (
                  <div className="col-span-2 text-center py-12 text-zinc-600 tracking-widest uppercase text-sm">Không tìm thấy vật phẩm tương thích</div>
                )}
                {inventory.filter((eq: any) => eq.type === showEquipSelect.slot && 
                  !FULL_CHARACTERS.some((c: any) => c.isUnlocked && c.id !== showEquipSelect.charId && [c.equipment.shoes?.id, c.equipment.hat?.id, c.equipment.armor?.id, c.equipment.ring?.id, c.equipment.belt?.id, c.equipment.artifact?.id].includes(eq.id))
                ).map((eq: any) => {
                  const isEquippedByMe = FULL_CHARACTERS.find((c: any) => c.id === showEquipSelect.charId)?.equipment[eq.type]?.id === eq.id;
                  return (
                    <button 
                      key={eq.id} 
                      onClick={() => handleEquip(eq.id)}
                      className={`text-left p-4 bg-zinc-900 border transition-colors hover:bg-zinc-800 ${isEquippedByMe ? 'border-amber-500' : 'border-white/5 hover:border-white/20'}`}
                    >
                      <div className="flex justify-between mb-2">
                        <span className={`text-xs font-bold uppercase ${
                          eq.rarity === 'rainbow' ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-green-500 to-blue-500' :
                          eq.rarity === 'red' ? 'text-red-500' :
                          eq.rarity === 'gold' ? 'text-amber-500' :
                          eq.rarity === 'purple' ? 'text-purple-500' : 'text-blue-500'
                        }`}>{eq.name}</span>
                        {isEquippedByMe && <span className="text-[10px] text-amber-500 tracking-widest uppercase">Equipped</span>}
                      </div>
                      <div className="text-zinc-400 text-xs flex gap-3">
                        {eq.stats.hp > 0 && <span className="text-green-400">+{eq.stats.hp} HP</span>}
                        {eq.stats.dmg > 0 && <span className="text-red-400">+{eq.stats.dmg} Dmg</span>}
                      </div>
                    </button>
                  );
                })}
             </div>
             <button onClick={() => handleEquip(null)} className="w-full mt-6 py-4 block bg-red-950/30 text-red-500 uppercase tracking-widest text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors">
               Gỡ bỏ trang bị
             </button>
           </div>
        </div>
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

function EquipSlot({ label, item, onClick }: { label: string, item: any, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex gap-4 items-center group">
       <div className={`w-16 h-16 border flex items-center justify-center transition-all ${
         item 
          ? (item.rarity === 'rainbow' ? 'border-indigo-400 bg-indigo-950/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]' :
             item.rarity === 'red' ? 'border-red-500 bg-red-950/50' : 
             item.rarity === 'gold' ? 'border-amber-500 bg-amber-950/50' : 
             item.rarity === 'purple' ? 'border-purple-500 bg-purple-950/50' : 
             'border-blue-500 bg-blue-950/50')
          : 'border-white/10 bg-black hover:border-white/30'
       }`}>
         {item ? (
           <span className="text-xs uppercase font-black text-white/50">{item.icon}</span>
         ) : (
           <span className="text-2xl font-black text-zinc-800">+</span>
         )}
       </div>
       <div className="text-left">
         <div className="text-[10px] text-zinc-500 tracking-widest uppercase mb-1">{label}</div>
         <div className="text-sm font-bold truncate max-w-[120px] group-hover:text-amber-400 transition-colors">
           {item ? item.name : 'Trống'}
         </div>
       </div>
    </button>
  );
}
