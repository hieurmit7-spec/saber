import { useMemo } from 'react';
import { useGameStore, calculateCP, getCharacterTotalStats, STAR_BONUSES_MAP, type GameCharacter } from '@/stores/gameStore';
import { Star, Shield, Zap, Heart, Sword, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EquipmentIcon } from './EquipmentIcon';
import { useHydratedCharacters, useInventory, useEquipItem, useUpgradeStar } from '@/hooks/usePlayerData';

const SLOT_LABELS: Record<string, string> = {
  shoes: 'Giày', hat: 'Mũ', armor: 'Giáp', ring: 'Nhẫn', belt: 'Đai', artifact: 'Pháp bảo',
};

const RARITY_BORDER: Record<string, string> = {
  white: 'border-muted-foreground/30', blue: 'border-blue-glow', purple: 'border-purple-400', gold: 'border-gold-bright',
};

function CharacterRoster({ characters, selectedId, onSelect }: {
  characters: any[]; selectedId: string | null; onSelect: (id: string) => void;
}) {
  return (
    <div className="w-20 bg-dark-surface/90 border-r border-border flex flex-col items-center py-4 gap-3 overflow-y-auto custom-scrollbar">
      {characters.map((char) => (
        <button key={char.id} onClick={() => onSelect(char.id)}
          className={`relative w-14 h-14 rounded-full overflow-hidden border-2 transition-all shrink-0
            ${char.id === selectedId ? 'border-gold-bright shadow-gold scale-110' : 'border-border hover:border-muted-foreground'}`}>
          {char.id === 'saber' ? (
            <img src="/videos/saber-avatar.gif" alt="Saber" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center text-foreground font-display text-xs">{char.name[0]}</div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-overlay/80 text-center">
            <span className="text-gold text-[8px]">{'★'.repeat(char.stars)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function EquipmentSlot({ slot, item, onUnequip, onEquip }: {
  slot: string; item: any; onUnequip: () => void; onEquip: () => void;
}) {
  return (
    <div
      onClick={item ? onUnequip : onEquip}
      className={`relative w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105
        ${item ? RARITY_BORDER[item.rarity] || 'border-border' : 'border-border/50 border-dashed'} bg-secondary/50`}
      title={item ? `${item.name} (Click to unequip)` : SLOT_LABELS[slot]}
    >
      <EquipmentIcon 
        type={item?.type || slot} 
        level={item?.level || 0} 
        size="sm" 
        className={item ? '' : 'opacity-20 grayscale'} 
      />
      {item && item.level > 0 && (
        <div className="absolute -top-1 -right-1 bg-amber-500 text-black text-[7px] px-1 font-black rounded-sm z-30">
          +{item.level}
        </div>
      )}
      <span className="text-[6px] text-muted-foreground truncate w-full text-center absolute bottom-1">{item ? item.name : SLOT_LABELS[slot]}</span>
    </div>
  );
}

function StatBar({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-xs text-muted-foreground w-12">{label}</span>
      <span className="text-sm font-bold text-foreground font-mono">{value.toLocaleString()}</span>
    </div>
  );
}

function EquipSelectDialog() {
  const userId = localStorage.getItem('fern_user_id') || '';
  const { showEquipSelect, setShowEquipSelect } = useGameStore();
  const { data: inventory } = useInventory(userId);
  const { mutate: equipItem } = useEquipItem(userId);
  
  if (!showEquipSelect || !inventory) return null;

  const matchingItems = inventory.filter(e => e.type === showEquipSelect.slot);

  return (
    <Dialog open={!!showEquipSelect} onOpenChange={() => setShowEquipSelect(null)}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-gold-bright text-center">
            Chọn {SLOT_LABELS[showEquipSelect.slot]}
          </DialogTitle>
        </DialogHeader>
        {matchingItems.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">Không có vật phẩm phù hợp trong túi đồ</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
            {matchingItems.map((item: any) => (
              <button key={item.id}
                onClick={() => { equipItem({ characterId: showEquipSelect.charId, slot: showEquipSelect.slot, equipmentId: item.id }); setShowEquipSelect(null); }}
                className={`p-2 rounded-lg border-2 ${RARITY_BORDER[item.rarity]} bg-secondary/30 flex flex-col items-center gap-1 hover:scale-105 transition-all`}>
                <EquipmentIcon type={item.type} level={item.level || 0} size="sm" />
                <span className="text-[9px] font-display text-foreground truncate w-full text-center">{item.name}</span>
                <div className="text-[8px] font-black uppercase mb-1" style={{ color: { white: '#94a3b8', blue: '#60a5fa', purple: '#a855f7', gold: '#fbbf24', orange: '#fb923c', red: '#ef4444' }[item.rarity] || '#fff' }}>
                  {{ white: 'Trắng', blue: 'Lam', purple: 'Tím', gold: 'Vàng', orange: 'Cam', red: 'Đỏ' }[item.rarity] || item.rarity}
                </div>
                <div className="text-[7px] text-muted-foreground font-mono">
                  {item.stats.hp ? <span>HP+{item.stats.hp} </span> : null}
                  {item.stats.dmg ? <span>DMG+{item.stats.dmg}</span> : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CharacterScreen() {
  const userId = localStorage.getItem('fern_user_id') || '';
  const { selectedCharacterId, selectCharacter, setCurrentScreen, setShowEquipSelect } = useGameStore();
  const { characters, isLoading } = useHydratedCharacters(userId);
  const { mutate: equipItem } = useEquipItem(userId);
  const { mutate: upgradeStar } = useUpgradeStar(userId);
  
  const charactersData = (characters || []) as any[];
  const selected = charactersData.find((c) => c.id === selectedCharacterId) || charactersData[0];
  
  const stats = useMemo(() => selected ? getCharacterTotalStats(selected as GameCharacter) : null, [selected]);
  const cp = useMemo(() => selected && stats ? calculateCP(selected as GameCharacter, stats) : 0, [selected, stats]);

  if (isLoading) return <div className="w-full h-screen bg-black flex items-center justify-center text-white font-display tracking-widest animate-pulse">NHẬP THẾ...</div>;
  if (!selected || !stats) return null;

  const slots = ['shoes', 'hat', 'armor', 'ring', 'belt', 'artifact'] as const;

  return (
    <div className="relative w-full h-screen overflow-hidden flex bg-black">
      <CharacterRoster characters={charactersData} selectedId={selectedCharacterId} onSelect={selectCharacter} />

      <div className="flex-1 relative">
        {/* Cinematic Backdrop */}
        {selected.id === 'saber' ? (
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60">
            <source src="/videos/banner-ulti.mp4" type="video/mp4" />
          </video>
        ) : (
          <div className="absolute inset-0 bg-[url('/icon rpg/artifact.png')] bg-center opacity-5 mix-blend-overlay scale-150" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-black/80 z-10" />

        <div className="relative z-20 h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
          {/* Main Info Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setCurrentScreen('main')} 
                className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 active:scale-95 shadow-2xl"
              >
                <ArrowLeft className="w-7 h-7" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-5xl text-white font-black italic tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                    {selected.name}
                  </h2>
                  <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-500 font-black uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse">
                    LV.60
                  </div>
                </div>
                {/* Cultivation Realm (Tu vi) with specialized coloring */}
                <div className="text-lg font-black uppercase tracking-[0.25em] mt-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  Cảnh giới: {{ 
                    1: 'Khí Hải Thần Cung', 
                    2: 'Trúc Cơ Thiên Tầng', 
                    3: 'Kim Đan Diệu Quyết', 
                    4: 'Nguyên Anh Nhập Thánh', 
                    5: 'Hóa Thần Chi Cảnh', 
                    6: 'Luyện Hư Chân Nhân' 
                  }[selected.stars as number] || 'Phàm Trần'}
                </div>
              </div>
            </div>

            {/* Massive Combat Power (Chiến lực) */}
            <div className="flex flex-col items-end">
              <div className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500 mb-2">Total Combat Power</div>
              <div className="relative group">
                <div className="absolute inset-[-40px] bg-amber-500/20 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="flex items-center gap-4 bg-gradient-to-b from-zinc-900 to-black border border-amber-500/20 px-8 py-3 rounded-2xl backdrop-blur-3xl relative z-10 shadow-2xl">
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-100 via-amber-400 to-amber-600 italic tracking-tighter">
                    {cp.toLocaleString()}
                  </span>
                  <Sword className="w-6 h-6 text-amber-500 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8 mb-12">
            {/* Left Column: Core Stats & Skills */}
            <div className="col-span-4 space-y-6">
              {/* Star Rating Display */}
              <div className="flex items-center justify-center gap-3 bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-7 h-7 transition-all duration-500 ${
                      i < selected.stars 
                        ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] scale-110' 
                        : 'text-zinc-800 scale-90 opacity-40'
                    }`} 
                  />
                ))}
              </div>

              {/* Attributes Panel */}
              <div className="bg-zinc-950/80 backdrop-blur-2xl rounded-3xl border border-white/5 p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Shield className="w-24 h-24 text-white" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" /> Thuộc tính cơ bản
                </h3>
                <div className="grid grid-cols-1 gap-5">
                  <StatBar icon={Heart} label="HP" value={stats.hp} color="text-red-500" />
                  <StatBar icon={Sword} label="Công" value={stats.dmg} color="text-orange-500" />
                  <StatBar icon={Shield} label="Thủ" value={stats.armor} color="text-amber-500" />
                  <StatBar icon={Zap} label="Tốc" value={stats.speed} color="text-blue-500" />
                </div>
              </div>

              {/* Skills Panel */}
              <div className="bg-zinc-950/80 backdrop-blur-2xl rounded-3xl border border-white/5 p-6 shadow-2xl">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Kỹ năng bí truyền
                </h3>
                <div className="space-y-4">
                  {selected.skills.map((skill: any) => (
                    <div key={skill.id} className="group flex items-start gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/10 cursor-help">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-sm font-black shadow-inner
                        ${skill.type === 'ultimate' ? 'bg-gradient-to-br from-amber-400 to-amber-700 text-black' : 'bg-blue-600/20 text-blue-400 border border-blue-500/20'}`}>
                        {skill.id}
                      </div>
                      <div>
                        <p className="text-sm font-black text-zinc-200 group-hover:text-white transition-colors uppercase tracking-widest">{skill.name}</p>
                        <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed line-clamp-3">{skill.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Gear & Evolution */}
            <div className="col-span-8 flex flex-col gap-8">
              <div className="grid grid-cols-2 gap-8 h-full">
                {/* Equipment Array */}
                <div className="bg-zinc-950/80 backdrop-blur-2xl rounded-3xl border border-white/5 p-8 shadow-2xl flex flex-col">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-8 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Linh khí hộ thân
                  </h3>
                  <div className="grid grid-cols-3 gap-6 flex-1 items-center">
                    {slots.map((slot) => (
                      <div key={slot} className="flex flex-col items-center gap-3">
                        <EquipmentSlot 
                          slot={slot} 
                          item={selected.equipment[slot]}
                          onUnequip={() => equipItem({ characterId: selected.id, slot, equipmentId: null })}
                          onEquip={() => setShowEquipSelect({ charId: selected.id, slot })}
                        />
                        <span className="text-[9px] font-black uppercase text-zinc-600 tracking-wider font-display">{SLOT_LABELS[slot]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evolution & Breakthroughs */}
                <div className="bg-zinc-950/80 backdrop-blur-2xl rounded-3xl border border-white/5 p-8 shadow-2xl relative overflow-hidden flex flex-col">
                  <div className="absolute -bottom-10 -right-10 text-amber-500/5 rotate-12">
                     <Star className="w-48 h-48" strokeWidth={5} />
                  </div>
                  
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Đột phá cảnh giới
                    </h3>
                    <div className="px-4 py-1.5 bg-black/50 rounded-full border border-amber-500/30 text-[10px] font-black text-amber-500 shadow-lg">
                      MẢNH LINH HỒN: {selected.shards}/10
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-auto">
                    {(STAR_BONUSES_MAP[selected.id] || []).map(b => (
                      <div key={b.stars} className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-500 ${selected.stars >= b.stars ? 'bg-amber-500/10 border border-amber-500/30 blur-0' : 'bg-white/5 border border-transparent opacity-40 grayscale'}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black shadow-xl
                          ${selected.stars >= b.stars ? 'bg-amber-500 text-black rotate-0' : 'bg-zinc-800 text-zinc-500 rotate-12'}`}>
                          ★{b.stars}
                        </div>
                        <span className={`text-xs font-bold leading-tight ${selected.stars >= b.stars ? 'text-amber-100' : 'text-zinc-500'}`}>{b.desc}</span>
                        {selected.stars >= b.stars && <CheckCircle2 className="ml-auto w-5 h-5 text-amber-500 animate-in zoom-in" />}
                      </div>
                    ))}
                  </div>

                  {selected.shards >= 10 && selected.stars < 6 && (
                    <button 
                      onClick={() => upgradeStar({ characterId: selected.id, newStar: selected.stars + 1, remainingShards: selected.shards - 10 })}
                      className="w-full mt-8 py-5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black uppercase tracking-[0.3em] text-sm rounded-2xl shadow-[0_15px_40px_rgba(245,158,11,0.4)] transition-all active:scale-[0.97] hover:-translate-y-1"
                    >
                      Xác Nhận Đột Phá
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EquipSelectDialog />
    </div>
  );
}
