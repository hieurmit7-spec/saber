import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Star, Shield, Sparkles, ArrowUpCircle, Sword, Zap, Brain, Crosshair } from "lucide-react";
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
  REALM_DATA,
  STAT_BONUS_TABLE,
  STAT_SCALE_FACTORS,
  getEquipCP
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

  if (charsLoading || invLoading) return <div className="w-full h-screen bg-zinc-950 flex items-center justify-center text-amber-500 font-display text-2xl tracking-[1em] animate-pulse">KHỞI TẠO LINH HỒN...</div>;
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

  const getRequiredShards = (currentStar: number) => 20 + (currentStar - 1) * 5;

  const handleUpgrade = () => {
    if (!activeChar || !activeChar.isUnlocked) return;
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

  return (
    <div className="w-full h-screen bg-[#050505] text-white relative font-sans overflow-hidden selection:bg-amber-500/30">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* Top Header Navigation */}
      <div className="absolute top-0 left-0 w-full p-6 z-30 flex justify-between items-center border-b border-white/5 bg-black/40 backdrop-blur-md">
        <button onClick={() => navigate('/')} className="group flex items-center gap-3 text-zinc-500 hover:text-white transition-all">
          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-amber-500/50 group-hover:bg-amber-500/10">
            <ChevronLeft className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Hành Trình</span>
        </button>

        <div className="flex items-center gap-4">
          <ResourceBadge icon="/icon rpg/coin.png" value={player?.coins || 0} color="amber" />
          <ResourceBadge label="KC" value={player?.kc_balance || 0} color="blue" />
        </div>
      </div>

      <div className="flex h-full relative z-10 pt-20">
        {/* Left Sidebar: Character Roster */}
        <div className="w-72 flex flex-col gap-2 border-r border-white/5 p-6 overflow-y-auto custom-scrollbar bg-black/20">
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            <h2 className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.4em]">Đội Hình Hiện Có</h2>
          </div>
          {FULL_CHARACTERS.map(c => (
             <CharacterListItem 
               key={c.id} 
               char={c} 
               isActive={selectedCharId === c.id} 
               onClick={() => setSelectedCharId(c.id)} 
             />
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 relative flex flex-col">
          
          {/* BACKGROUND CHARACTER DISPLAY */}
          <div className="flex-1 flex items-center justify-center relative pointer-events-none mb-12">
             <div className="w-[600px] h-full relative flex items-center justify-center pt-10">
                
                {/* FLOATING STARS ABOVE HEAD - Precise Centering */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-auto animate-float z-30" style={{ animationDelay: '0.5s' }}>
                   <div className="bg-zinc-950/40 backdrop-blur-md px-8 py-2 rounded-full border border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                      <StarDisplay tier={currentTier} stars={activeChar.stars} />
                   </div>
                </div>

                {/* Spirit Halo - Behind Character */}
                <div className="absolute inset-0 flex items-center justify-center -z-10 overflow-hidden">
                   <div className="w-[450px] h-[450px] bg-amber-500/5 blur-[120px] rounded-full animate-pulse" />
                   <div className="absolute w-[300px] h-[300px] border border-amber-500/10 rounded-full animate-[spin_20s_linear_infinite]" />
                </div>

                <div className="relative h-full flex items-center justify-center">
                   {/* Radial Mask to hide GIF square edges */}
                   <div className="h-full relative flex items-center justify-center" style={{ maskImage: 'radial-gradient(circle, black 60%, transparent 95%)', WebkitMaskImage: 'radial-gradient(circle, black 60%, transparent 95%)' }}>
                      {activeChar.videoAvatar ? (
                        <img 
                          src={activeChar.videoAvatar} 
                          className="h-[95%] object-contain mix-blend-screen opacity-100 brightness-110 contrast-[1.1] saturate-[1.2] drop-shadow-[0_0_80px_rgba(245,158,11,0.2)] transition-all duration-1000 animate-float" 
                          alt={activeChar.name}
                        />
                      ) : (
                        <div className="text-zinc-900 text-9xl font-black uppercase blur-[1px] opacity-20">{activeChar.name}</div>
                      )}
                   </div>
                </div>
                
                {/* Sacred Rune Circle - Multi-layered Base */}
                <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 w-96 h-20 -z-10">
                   <div className="absolute inset-0 bg-amber-500/10 blur-[50px] rounded-[50%] animate-pulse" />
                   <div className="absolute inset-x-0 bottom-0 top-1/2 border border-amber-500/20 rounded-[50%] scale-110 opacity-30" />
                   <div className="absolute inset-x-8 bottom-2 top-1/2 border border-amber-500/40 rounded-[50%] animate-[spin_10s_linear_infinite]" />
                   <div className="absolute inset-x-12 bottom-4 top-1/2 border-2 border-dashed border-amber-500/20 rounded-[50%] animate-[spin_15s_linear_reverse_infinite]" />
                </div>
             </div>

             {/* Equipment Slots Over Sprite */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[800px] flex justify-between px-10">
                   <div className="flex flex-col gap-16 pointer-events-auto">
                      <EquipSlot label="LINH KHÍ" item={activeChar.equipment.artifact} slot="artifact" onSelect={setShowEquipSelect} onUpgrade={setUpgradeTarget} activeCharId={activeChar.id} />
                      <EquipSlot label="NHẪN THẦN" item={activeChar.equipment.ring} slot="ring" onSelect={setShowEquipSelect} onUpgrade={setUpgradeTarget} activeCharId={activeChar.id} />
                      <EquipSlot label="ĐAI LỖ" item={activeChar.equipment.belt} slot="belt" onSelect={setShowEquipSelect} onUpgrade={setUpgradeTarget} activeCharId={activeChar.id} />
                   </div>
                   <div className="flex flex-col gap-16 pointer-events-auto items-end">
                      <EquipSlot side="right" label="MŨ BẢO" item={activeChar.equipment.hat} slot="hat" onSelect={setShowEquipSelect} onUpgrade={setUpgradeTarget} activeCharId={activeChar.id} />
                      <EquipSlot side="right" label="GIÁP THÂN" item={activeChar.equipment.armor} slot="armor" onSelect={setShowEquipSelect} onUpgrade={setUpgradeTarget} activeCharId={activeChar.id} />
                      <EquipSlot side="right" label="GIÀY THẦN" item={activeChar.equipment.shoes} slot="shoes" onSelect={setShowEquipSelect} onUpgrade={setUpgradeTarget} activeCharId={activeChar.id} />
                   </div>
                </div>
             </div>
          </div>

          {/* BOTTOM HUD ZONE: Realm & CP */}
          <div className="p-12 pt-0 flex justify-between items-end relative z-20 pointer-events-none">
             {/* Realm Panel */}
             <div className="bg-zinc-950/80 backdrop-blur-2xl border border-white/5 p-6 rounded-[32px] pointer-events-auto shadow-2xl relative overflow-hidden group min-w-[300px]">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-amber-800" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Đạo Pháp Cảnh Giới</span>
                </div>
                <div className={`text-xs font-black uppercase tracking-[0.2em] mb-1 ${realmStage.color}`}>{realmStage.label}</div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-amber-600 uppercase tracking-widest">{realmTitle}</div>
                
                {activeChar.level >= levelCap && activeChar.realm_rank < REALM_DATA.length - 1 && (
                  <button 
                    onClick={() => setShowBreakthroughModal(true)}
                    className="mt-6 w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[10px] tracking-[0.3em] rounded-xl transition-all animate-pulse active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  >
                    PHÁ QUYẾT ĐẦU CƠ
                  </button>
                )}
             </div>

             {/* Combat Power Core */}
             <div className="flex flex-col items-center pointer-events-auto">
                <div className="relative">
                   {/* Decorative Aura */}
                   <div className="absolute inset-[-40px] bg-amber-500/10 blur-[50px] rounded-full animate-pulse" />
                   
                   <div className="relative z-10 bg-zinc-950/90 border-2 border-amber-500/30 px-12 py-4 rounded-[40px] backdrop-blur-3xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] flex flex-col items-center min-w-[340px]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-amber-500/50" />
                        <span className="text-[9px] font-black text-amber-500/80 uppercase tracking-[0.8em]">Tổng Lực Chiến</span>
                        <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-amber-500/50" />
                      </div>
                      <div className="flex items-center gap-6">
                        <Sword className="w-8 h-8 text-amber-500/50 animate-[bounce_2s_infinite]" />
                        <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-600 tabular-nums italic tracking-tighter filter drop-shadow-[0_4px_10px_rgba(0,0,0,1)]">
                          {cp.toLocaleString()}
                        </span>
                        <Zap className="w-8 h-8 text-amber-500/50 animate-pulse" />
                      </div>
                   </div>
                   <div className="mt-4 w-48 h-1.5 bg-amber-500/20 blur-sm rounded-full mx-auto" />
                </div>
             </div>
          </div>
        </div>

        {/* Right Sidebar: Attributes & Upgrades */}
        <div className="w-[360px] flex flex-col gap-6 p-8 overflow-y-auto custom-scrollbar bg-black/40 border-l border-white/5">
           {/* Level & Shard Progress */}
           <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl flex flex-col gap-6 relative overflow-hidden">
              <div className="flex justify-between items-end">
                 <div>
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Cấp Độ Tu Luyện</span>
                    <div className="text-2xl font-black italic">Lv. {activeChar.level} <span className="text-zinc-600 text-xs font-normal">/ {levelCap}</span></div>
                 </div>
                 <div className="text-right">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Nguyên Thần</span>
                    <div className="text-2xl font-black text-amber-500">
                      {activeChar.shards} <span className="text-zinc-600 text-xs font-normal">/ {getRequiredShards(activeChar.stars)}</span>
                    </div>
                 </div>
              </div>

              {/* EXP Progress */}
              <div className="space-y-1.5">
                 <div className="flex justify-between text-[8px] font-black tracking-widest uppercase text-zinc-500">
                    <span>Exp Tiến Trình</span>
                    <span>{Math.round((activeChar.exp / getRequiredExp(activeChar.level)) * 100)}%</span>
                 </div>
                 <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-amber-600 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-1000" style={{ width: `${Math.min(100, (activeChar.exp / getRequiredExp(activeChar.level)) * 100)}%` }} />
                 </div>
              </div>
           </div>

           {/* Core Growth Buttons */}
           <div className="flex flex-col gap-3">
              {(() => {
                const levelCost = Math.floor(Math.pow(activeChar.level, 1.2) * 800 + 500);
                const lvX10 = Math.min(10, levelCap - activeChar.level);
                let totalX10 = 0;
                for (let i = 0; i < lvX10; i++) totalX10 += Math.floor(Math.pow(activeChar.level + i, 1.2) * 800 + 500);
                
                return (
                  <div className="space-y-3">
                    <button 
                      disabled={activeChar.level >= levelCap || (player?.coins || 0) < levelCost || upgradeLevelMutation.isPending || !activeChar.isUnlocked}
                      onClick={() => upgradeLevelMutation.mutate({ characterId: activeChar.id, newLevel: activeChar.level + 1, cost: levelCost })}
                      className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-20 text-black font-black uppercase tracking-widest py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98]"
                    >
                      {upgradeLevelMutation.isPending ? 'NÂNG CẤP...' : `Thăng Cấp (${levelCost.toLocaleString()})`}
                    </button>
                    {lvX10 > 1 && (
                       <button 
                         disabled={(player?.coins || 0) < totalX10 || upgradeLevelMutation.isPending || !activeChar.isUnlocked}
                         onClick={() => upgradeLevelMutation.mutate({ characterId: activeChar.id, newLevel: activeChar.level + lvX10, cost: totalX10 })}
                         className="w-full bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-10 text-white font-black uppercase tracking-widest py-3 text-[10px] rounded-xl transition-all"
                       >
                         Thăng Cấp x{lvX10} ({totalX10.toLocaleString()})
                       </button>
                    )}
                  </div>
                );
              })()}

              <button 
                disabled={activeChar.stars >= 46 || activeChar.shards < getRequiredShards(activeChar.stars) || upgradeStarMutation.isPending || !activeChar.isUnlocked}
                onClick={handleUpgrade}
                className="w-full border-2 border-amber-500/50 hover:bg-amber-500/10 disabled:opacity-20 text-amber-500 font-black uppercase tracking-widest py-5 rounded-2xl transition-all"
              >
                Nâng Sao
              </button>
           </div>

           {/* Stats Overview */}
           <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-1 h-4 bg-amber-500" />
                 <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Thông Số Cốt Lõi</h3>
              </div>
              <div className="space-y-4">
                 <ModernStat icon={<img src="/icon rpg/damage.png" className="w-5 h-5 object-contain" alt="Atk" />} label="Sát Thương" val={totalStats.dmg} base={activeChar.baseStats.dmg} />
                 <ModernStat icon={<img src="/icon rpg/shield.png" className="w-5 h-5 object-contain" alt="Def" />} label="Phòng Ngự" val={totalStats.armor} base={activeChar.baseStats.armor} />
                 <ModernStat icon={<img src="/icon rpg/hearts.png" className="w-5 h-5 object-contain" alt="HP" />} label="Sinh Mệnh" val={totalStats.hp} base={activeChar.baseStats.hp} />
                 <ModernStat icon={<img src="/icon rpg/speed.png" className="w-5 h-5 object-contain" alt="Spd" />} label="Tốc Độ" val={totalStats.speed} base={activeChar.baseStats.speed} />
              </div>

              {/* Star Bonuses Display */}
              <div className="mt-8">
                 <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5 pb-2 mb-3">Mô Tả Đột Phá Bậc Sẹo</div>
                 <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {(STAR_BONUSES_MAP[activeChar.id] || []).map(b => (
                       <div key={b.stars} className={`flex gap-3 text-[10px] transition-all ${activeChar.stars >= b.stars ? 'text-zinc-200' : 'text-zinc-700'}`}>
                          <span className={`font-black min-w-[32px] ${activeChar.stars >= b.stars ? 'text-amber-500' : ''}`}>★{b.stars}</span>
                          <span>{b.desc}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Overlays */}
      {showEquipSelect && <EquipSelectDialog activeChar={activeChar} FULL_CHARACTERS={FULL_CHARACTERS} item={showEquipSelect} onSelect={handleEquip} onClose={() => setShowEquipSelect(null)} inventory={inventory} />}
      {upgradeTarget && <EquipmentUpgradeModal equipment={upgradeTarget} onClose={() => setUpgradeTarget(null)} />}
      {showBreakthroughModal && <BreakthroughModal activeChar={activeChar} player={player} materials={materials} onClose={() => setShowBreakthroughModal(false)} mutation={breakthroughMutation} realmTitle={realmTitle} />}
    </div>
  );
}

// Sub-components for cleaner codebase

function CharacterListItem({ char, isActive, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`group w-full text-left p-3 rounded-2xl transition-all border-2 relative overflow-hidden ${isActive ? 'bg-amber-500 border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10'}`}
    >
      <div className="flex flex-col gap-1 relative z-10">
        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-black/60' : 'text-zinc-500'}`}>{char.id}</span>
        <span className={`text-sm font-black uppercase tracking-tight ${isActive ? 'text-black' : 'text-zinc-200'}`}>{char.name}</span>
      </div>
      {!char.isUnlocked && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
          <span className="text-[8px] font-black uppercase tracking-wider text-white/40">CHƯA SỞ HỮU</span>
        </div>
      )}
    </button>
  );
}

function ResourceBadge({ icon, label, value, color }: any) {
  return (
    <div className="bg-zinc-950/80 border border-white/5 px-4 py-2 rounded-xl flex items-center gap-3 shadow-xl">
       {icon ? <img src={icon} className="w-4 h-4 object-contain" alt="Icon" /> : <div className={`w-4 h-4 rounded-full flex items-center justify-center text-black text-[7px] font-black bg-${color}-500 shadow-[0_0_10px_rgba(var(--${color}),0.5)]`}>{label}</div>}
       <span className={`text-sm font-black tabular-nums ${color === 'amber' ? 'text-amber-500' : 'text-blue-400'}`}>{value.toLocaleString()}</span>
    </div>
  );
}

function StarDisplay({ tier, stars }: any) {
  const [min, max] = tier.range;
  const countInTier = max - min + 1;
  const activeInTier = stars - min + 1;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1.5">
        {Array.from({ length: countInTier }).map((_, i) => {
          const isActive = i < activeInTier;
          let color = tier.color || '#fff';
          if (tier.colors) color = tier.colors[i % tier.colors.length];
          return (
            <Star key={i} className="w-5 h-5 transition-all duration-700" style={{ color: isActive ? color : '#1f2937', fill: isActive ? color : 'transparent', filter: isActive ? `drop-shadow(0 0 8px ${color})` : 'none'}} />
          );
        })}
      </div>
      <span className="text-[9px] font-black tracking-[0.4em] uppercase" style={{ color: tier.color || '#fff' }}>[{tier.label}] {activeInTier}/{countInTier}</span>
    </div>
  );
}

function ModernStat({ icon, label, val, base }: any) {
  const bonus = val - Math.floor(base);
  return (
    <div className="flex justify-between items-center group">
       <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">{icon}</div>
          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{label}</span>
       </div>
       <div className="text-right">
          <span className="text-lg font-black italic">{val.toLocaleString()}</span>
          {bonus > 0 && <span className="text-[10px] text-green-500 ml-2 font-black">+{bonus.toLocaleString()}</span>}
       </div>
    </div>
  );
}

function EquipSlot({ label, item, slot, onSelect, onUpgrade, side = 'left', activeCharId, className }: any) {
  const getQualityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'text-zinc-500',
      uncommon: 'text-green-500',
      rare: 'text-blue-500',
      epic: 'text-purple-500',
      orange: 'text-amber-500',
      legendary: 'text-amber-500',
      red: 'text-red-500',
      rainbow: 'text-indigo-400'
    };
    return colors[rarity?.toLowerCase()] || 'text-zinc-400';
  };

  const getRarityClass = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'rainbow': return 'border-indigo-400/50 bg-indigo-950/20 shadow-indigo-500/30';
      case 'mythic':  
      case 'red':     return 'border-red-500/50 bg-red-950/20 shadow-red-500/10';
      case 'legendary':
      case 'orange':  return 'border-amber-500/50 bg-amber-950/20 shadow-amber-500/10';
      case 'epic':    
      case 'purple':  return 'border-purple-500/50 bg-purple-950/20 shadow-purple-500/10';
      case 'rare':    
      case 'blue':    return 'border-blue-500/50 bg-blue-950/20 shadow-blue-500/10';
      case 'uncommon':
      case 'green':   return 'border-emerald-500/50 bg-emerald-950/20';
      default:        return 'border-white/5 bg-black/40 hover:border-white/20';
    }
  };

  const rClass = item ? getRarityClass(item.rarity) : 'border-white/5 bg-black/40 hover:border-white/20';

  return (
    <div className={`flex gap-4 items-center group ${side === 'right' ? 'flex-row-reverse text-right' : 'text-left'} ${className || ""}`}>
      <button 
        onClick={() => onSelect({ charId: activeCharId, slot })}
        className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all relative overflow-hidden shadow-2xl ${rClass}`}
      >
        <EquipmentIcon type={item?.type || slot} level={item?.level || 0} rarity={item?.rarity} size="md" className={item ? "" : "opacity-10 grayscale"} />
        {item && item.level > 0 && <div className="absolute top-1 right-1 bg-amber-500 text-black text-[10px] px-1 font-black rounded-sm shadow-md">+{item.level}</div>}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-[8px] text-zinc-600 uppercase font-black tracking-widest mb-1">{label}</div>
        <button 
          onClick={() => onSelect({ charId: activeCharId, slot })} 
          className={`text-xs font-black truncate max-w-[120px] hover:text-amber-500 transition-colors uppercase italic block ${item ? getQualityColor(item.rarity) : 'text-zinc-500'}`}
        >
          {item ? item.name : 'VÔ CHỦ'}
        </button>
        {item && (
           <div className="flex items-center gap-3 mt-2">
              <button onClick={() => onUpgrade(item)} className="text-amber-500/50 hover:text-amber-500 transition-colors">
                <ArrowUpCircle className="w-4 h-4" />
              </button>
              <div className="text-[8px] font-black text-amber-500/40 uppercase">CP: {item.cp?.toLocaleString() || item.combat_power?.toLocaleString() || '0'}</div>
           </div>
        )}
      </div>
    </div>
  );
}

function BreakthroughModal({ activeChar, player, materials, onClose, mutation, realmTitle }: any) {
  const nextRealm = REALM_DATA[activeChar.realm_rank + 1];
  if (!nextRealm) return null;
  const stoneInInv = materials?.find((m: any) => m.material_id === 'magic_stone')?.amount || 0;
  const hasStone = stoneInInv >= nextRealm.costStone;
  const hasKC = (player?.kc_balance || 0) >= nextRealm.costKC;

  return (
    <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl flex items-center justify-center z-[110] animate-in fade-in duration-500">
      <div className="w-[500px] bg-zinc-950 border border-amber-500/20 p-10 rounded-[40px] text-center shadow-[0_0_100px_rgba(245,158,11,0.1)] relative overflow-hidden">
        <Sparkles className="w-16 h-16 text-amber-400 mx-auto mb-6 animate-pulse" />
        <h3 className="text-3xl font-black text-white uppercase mb-2 tracking-tighter">PHÁ GIỚI TIÊN MA</h3>
        <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-12">Từ {realmTitle} tới {nextRealm.name}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-10">
           <ResourceReq label="ĐÁ ĐỘT PHÁ" icon="/icon rpg/magic_stone.png" current={stoneInInv} req={nextRealm.costStone} has={hasStone} />
           <ResourceReq label="KIM CƯƠNG" current={player?.kc_balance || 0} req={nextRealm.costKC} has={hasKC} isKC />
        </div>

        <div className="flex gap-4">
           <button onClick={onClose} className="flex-1 py-4 border border-white/10 rounded-2xl text-zinc-500 hover:text-white transition-all uppercase font-black text-[10px]">Lùi Bước</button>
           <button 
             disabled={!hasStone || !hasKC || mutation.isPending}
             onClick={() => {
                const success = Math.random() <= nextRealm.successRate;
                mutation.mutate({ characterId: activeChar.id, costStone: nextRealm.costStone, costKC: nextRealm.costKC, success }, {
                   onSuccess: () => {
                      if (success) { toast.success(`ĐỘT PHÁ THÀNH CÔNG! Chào mừng ${nextRealm.name}!`); onClose(); }
                      else { toast.error("THẤT BẠI! Tâm ma xâm chiếm, tiêu hao tài nguyên."); }
                   }
                });
             }}
             className="flex-[2] py-4 bg-amber-500 text-black rounded-2xl uppercase font-black text-[10px] hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
           >
             {mutation.isPending ? 'ĐANG PHÁ GIỚI...' : 'TIẾN HÀNH ĐỘT PHÁ'}
           </button>
        </div>
      </div>
    </div>
  );
}

function ResourceReq({ label, icon, current, req, has, isKC }: any) {
  return (
    <div className={`p-4 rounded-2xl bg-white/5 border ${has ? 'border-white/10' : 'border-red-900/50'} flex flex-col items-center gap-2`}>
       {icon ? <img src={icon} className="w-6 h-6 object-contain" alt="Req" /> : <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-black text-[6px] font-black italic">KC</div>}
       <span className="text-[8px] text-zinc-600 font-black uppercase text-center mt-1">{label}</span>
       <div className={`text-sm font-black ${has ? 'text-white' : 'text-red-500'}`}>{current.toLocaleString()} / {req.toLocaleString()}</div>
    </div>
  );
}

function EquipSelectDialog({ activeChar, FULL_CHARACTERS, item: select, onSelect, onClose, inventory }: any) {
  const getItemPower = (eq: any) => getEquipCP(eq);

  const matchingItems = (inventory || [])
    .filter((eq: any) => eq.type === select.slot && !FULL_CHARACTERS.some((c: any) => c.isUnlocked && c.id !== select.charId && Object.values(c.equipment).some((e: any) => e?.id === eq.id)))
    .sort((a: any, b: any) => getItemPower(b) - getItemPower(a));

  const getQualityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'text-zinc-500',
      uncommon: 'text-green-500',
      rare: 'text-blue-500',
      epic: 'text-purple-500',
      orange: 'text-amber-500',
      legendary: 'text-amber-500',
      red: 'text-red-500',
      rainbow: 'text-indigo-400'
    };
    return colors[rarity?.toLowerCase()] || 'text-zinc-400';
  };

  const getRarityClass = (rarity: string) => {
    switch (rarity) {
      case 'rainbow': return 'border-indigo-400 bg-indigo-950/40 shadow-[inset_0_0_20px_rgba(129,140,248,0.2)] text-indigo-400';
      case 'red':     return 'border-red-500 bg-red-950/40 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)] text-red-500';
      case 'orange':  return 'border-amber-500 bg-amber-950/40 shadow-[inset_0_0_20px_rgba(245,158,11,0.2)] text-amber-500';
      case 'purple':  return 'border-purple-500 bg-purple-950/40 shadow-[inset_0_0_20px_rgba(168,85,247,0.2)] text-purple-500';
      case 'blue':    return 'border-blue-500 bg-blue-950/40 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)] text-blue-500';
      case 'green':   return 'border-emerald-500 bg-emerald-950/40 shadow-[inset_0_0_20px_rgba(16,185,129,0.2)] text-emerald-500';
      default:        return 'border-white/10 bg-zinc-950/50 text-zinc-400';
    }
  };

  return (
    <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl flex items-center justify-center z-[120] p-12 gap-8 animate-in zoom-in-95 duration-300">
      <div className="w-[1000px] h-[90vh] bg-[#0a0a0a] border border-white/10 p-12 rounded-[60px] flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 blur-[120px] -mr-32 -mt-32 rounded-full" />
        
        <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
          <div className="flex items-center gap-6">
             <div className="w-1.5 h-12 bg-amber-500 rounded-full" />
             <div className="flex flex-col">
               <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[1em] mb-1 leading-none opacity-50">Equipment Inventory</span>
               <h3 className="text-4xl font-black uppercase text-white leading-none tracking-tighter italic">
                 {select.slot?.toUpperCase()} <span className="text-amber-500/80">• TRANG PHỤC</span>
               </h3>
             </div>
          </div>
          <button onClick={onClose} className="group relative px-10 py-3 overflow-hidden rounded-2xl transition-all">
             <div className="absolute inset-0 bg-white/5 group-hover:bg-amber-500/10 border border-white/10 group-hover:border-amber-500/50 transition-all" />
             <span className="relative z-10 text-zinc-500 group-hover:text-white uppercase font-black text-[11px] tracking-[0.3em]">Hồi Quy</span>
          </button>
        </div>

        <div className="grid grid-cols-8 gap-3 overflow-y-auto pr-3 custom-modal-scrollbar flex-1 pb-6">
          {matchingItems.length === 0 && (
             <div className="col-span-8 flex flex-col items-center justify-center py-40 opacity-20">
                <div className="text-6xl mb-4">🏺</div>
                <div className="text-sm font-black uppercase tracking-[1em]">KHO TRỐNG</div>
             </div>
          )}
          {matchingItems.map((eq: any) => {
            const power = getItemPower(eq);
            const rClass = getRarityClass(eq.rarity);
            const isEquipped = activeChar.equipment[select.slot]?.id === eq.id;

            return (
              <button 
                key={eq.id} 
                onClick={() => onSelect(eq.id)} 
                className={`relative group aspect-square border-[1.5px] ${rClass} rounded-2xl flex items-center justify-center transition-all hover:scale-110 hover:z-40 active:scale-95 shadow-2xl overflow-hidden bg-black/40 backdrop-blur-sm`}
              >
                {/* Subtle Inner Highlight */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Currently Equipped Indicator */}
                {isEquipped && (
                  <div className="absolute inset-0 bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl animate-pulse z-0" />
                )}

                <div className="relative z-10 scale-100 group-hover:scale-110 transition-transform duration-300">
                   <EquipmentIcon type={eq.type} level={eq.level || 0} rarity={eq.rarity} size="sm" />
                </div>

                {/* Overlays: Level */}
                {eq.level > 0 && (
                  <div className="absolute top-1 right-1 bg-amber-500 text-black text-[8px] px-1.5 py-0.5 font-black rounded-md shadow-lg z-20 border border-amber-300/30">
                    +{eq.level}
                  </div>
                )}
                
                {/* Overlays: Power */}
                <div className="absolute bottom-1 inset-x-1 bg-zinc-950/80 backdrop-blur-md py-0.5 rounded-lg text-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-20 border border-white/10">
                   <span className="text-[7px] font-black text-amber-500 tabular-nums">
                      {Math.floor(power).toLocaleString()}
                   </span>
                </div>

                {/* Tooltip on Hover */}
                <div className="absolute inset-x-0 top-0 hidden group-hover:flex items-center justify-center pointer-events-none z-30">
                   <div className={`bg-zinc-900 shadow-2xl px-2 py-0.5 rounded-b-md text-[7px] font-black uppercase text-center w-full truncate border-x border-b border-white/20 ${getQualityColor(eq.rarity)}`}>
                      {eq.name}
                   </div>
                </div>
              </button>
            );
          })}
        </div>
        
        <button 
          onClick={() => onSelect(null)} 
          className="mt-12 py-6 bg-red-950/20 text-red-500 hover:bg-red-500/10 hover:text-red-400 uppercase font-black text-[11px] tracking-[0.8em] border border-red-500/20 rounded-[30px] transition-all shadow-xl active:scale-95"
        >
          Gỡ Vật Phẩm Đang Dùng
        </button>
      </div>

      <style>{`
        .custom-modal-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-modal-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
        .custom-modal-scrollbar::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.2); border-radius: 10px; transition: all 0.3s; }
        .custom-modal-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(245,158,11,0.4); }
      `}</style>
    </div>
  );
}
