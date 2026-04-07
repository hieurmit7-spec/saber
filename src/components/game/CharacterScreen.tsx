import { useMemo } from 'react';
import { useGameStore, calculateCP, getCharacterTotalStats, STAR_BONUSES_MAP, type GameCharacter, type Equipment } from '@/stores/gameStore';
import { Star, Shield, Zap, Heart, Sword, ArrowLeft, ChevronUp } from 'lucide-react';
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
      <span className="text-sm font-bold text-foreground">{value.toLocaleString()}</span>
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
          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {matchingItems.map((item: any) => (
              <button key={item.id}
                onClick={() => { equipItem({ characterId: showEquipSelect.charId, slot: showEquipSelect.slot, equipmentId: item.id }); setShowEquipSelect(null); }}
                className={`p-2 rounded-lg border-2 ${RARITY_BORDER[item.rarity]} bg-secondary/30 flex flex-col items-center gap-1 hover:scale-105 transition-all`}>
                <EquipmentIcon type={item.type} level={item.level || 0} size="sm" />
                <span className="text-[9px] font-display text-foreground truncate w-full text-center">{item.name}</span>
                <div className="text-[8px] font-black uppercase mb-1" style={{ color: { white: '#94a3b8', blue: '#60a5fa', purple: '#a855f7', gold: '#fbbf24', orange: '#fb923c', red: '#ef4444' }[item.rarity] || '#fff' }}>
                  {{ white: 'Trắng', blue: 'Lam', purple: 'Tím', gold: 'Vàng', orange: 'Cam', red: 'Đỏ' }[item.rarity] || item.rarity}
                </div>
                <div className="text-[7px] text-muted-foreground">
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

  if (isLoading) return <div className="w-full h-screen bg-black flex items-center justify-center text-white">Loading characters...</div>;
  if (!selected || !stats) return null;

  const slots = ['shoes', 'hat', 'armor', 'ring', 'belt', 'artifact'] as const;

  return (
    <div className="relative w-full h-screen overflow-hidden flex">
      <CharacterRoster characters={charactersData} selectedId={selectedCharacterId} onSelect={selectCharacter} />

      <div className="flex-1 relative">
        {selected.id === 'saber' ? (
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src="/videos/banner-ulti.mp4" type="video/mp4" />
          </video>
        ) : (
          <div className="absolute inset-0 gradient-dark" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-background/80 z-10" />

        <div className="relative z-20 h-full flex flex-col p-4 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setCurrentScreen('main')} className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-display text-xl text-gold-bright tracking-wide">{selected.name}</h2>
              <p className="text-xs text-muted-foreground font-body">{selected.class}</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < selected.stars ? 'text-gold-bright fill-gold' : 'text-muted-foreground/30'}`} />
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-overlay/70 backdrop-blur-sm rounded-xl border border-border p-4 mb-3 max-w-xs">
            <div className="grid grid-cols-2 gap-3">
              <StatBar icon={Heart} label="HP" value={stats.hp} color="text-red-400" />
              <StatBar icon={Zap} label="Speed" value={stats.speed} color="text-blue-glow" />
              <StatBar icon={Shield} label="Armor" value={stats.armor} color="text-gold" />
              <StatBar icon={Sword} label="DMG" value={stats.dmg} color="text-orange-400" />
            </div>
          </div>

          {/* Star Upgrade Info */}
          <div className="bg-overlay/70 backdrop-blur-sm rounded-xl border border-border p-4 mb-3 max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-xs text-gold tracking-widest uppercase">Nâng sao</h3>
              {selected.shards >= 10 && selected.stars < 6 && (
                <button onClick={() => upgradeStar({ characterId: selected.id, newStar: selected.stars + 1, remainingShards: selected.shards - 10 })}
                  className="flex items-center gap-1 gradient-gold text-primary-foreground text-[10px] font-display px-2 py-1 rounded-md">
                  <ChevronUp className="w-3 h-3" /> Nâng cấp
                </button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">Mảnh: {selected.shards}/10</p>
            <div className="space-y-1.5">
              {(STAR_BONUSES_MAP[selected.id] || []).map(b => (
                <div key={b.stars} className={`flex items-center gap-2 text-[11px] ${selected.stars >= b.stars ? 'text-gold-bright' : 'text-muted-foreground/60'}`}>
                  <span className="font-display w-8">★{b.stars}</span>
                  <span className="font-body">{b.desc}</span>
                  {selected.stars >= b.stars && <span className="ml-auto text-accent text-[10px]">✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div className="bg-overlay/70 backdrop-blur-sm rounded-xl border border-border p-4 mb-3 max-w-xs">
            <h3 className="font-display text-xs text-gold tracking-widest uppercase mb-3">Trang bị</h3>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <EquipmentSlot key={slot} slot={slot} item={selected.equipment[slot]}
                  onUnequip={() => equipItem({ characterId: selected.id, slot, equipmentId: null })}
                  onEquip={() => setShowEquipSelect({ charId: selected.id, slot })}
                />
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-overlay/70 backdrop-blur-sm rounded-xl border border-border p-4 max-w-sm mb-3">
            <h3 className="font-display text-xs text-gold tracking-widest uppercase mb-3">Kỹ năng</h3>
            <div className="space-y-2">
              {selected.skills.map((skill: any) => (
                <div key={skill.id} className="flex items-start gap-3 p-2 rounded-lg bg-secondary/30">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold
                    ${skill.type === 'ultimate' ? 'gradient-gold text-primary-foreground' : 'bg-blue-deep text-blue-glow'}`}>
                    {skill.id}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{skill.name}</p>
                    <p className="text-xs text-muted-foreground">{skill.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CP */}
          <div className="mt-auto text-center pb-6">
            <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">Lực chiến</p>
            <p className="font-display text-4xl text-gold-bright font-bold drop-shadow-lg">{cp.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <EquipSelectDialog />
    </div>
  );
}
