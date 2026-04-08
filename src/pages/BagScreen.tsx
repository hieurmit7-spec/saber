import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trash2, CheckCircle2, Circle, Filter, SortDesc } from "lucide-react";
import { useInventory, useMaterials, usePlayer, useDeleteEquipments, usePlayerCharacters } from "@/hooks/usePlayerData";
import { EquipmentIcon } from "@/components/game/EquipmentIcon";
import { toast } from "sonner";

export default function BagScreen() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('fern_user_id') || '';
  const { data: player } = usePlayer(userId);
  const { data: inventory, isLoading: invLoading } = useInventory(userId);
  const { data: dbChars } = usePlayerCharacters(userId);
  const { data: materials, isLoading: matsLoading } = useMaterials(userId);
  const deleteMutation = useDeleteEquipments(userId);
  
  const [filter, setFilter] = useState<'all' | 'shoes' | 'hat' | 'armor' | 'ring' | 'belt' | 'artifact' | 'materials'>('all');
  const [activeRarityFilter, setActiveRarityFilter] = useState<string | null>(null);
  const [isTrashMode, setIsTrashMode] = useState(false);
  const [selectedForTrash, setSelectedForTrash] = useState<string[]>([]);

  const isLoading = invLoading || matsLoading;

  // Helper: Calculate Combat Power for sorting
  const getItemPower = (eq: any) => {
    if (!eq || !eq.stats) return 0;
    return (eq.stats.hp || 0) * 0.4 + 
           (eq.stats.dmg || 0) * 10 + 
           (eq.stats.armor || 0) * 2 + 
           (eq.stats.speed || 0) * 25 + 
           (eq.level || 0) * 100;
  };

  // Identify equipped items
  const equippedIds = useMemo(() => {
    const ids = new Set<string>();
    if (dbChars) {
      dbChars.forEach((c: any) => {
        if (c.equip_shoes_id) ids.add(c.equip_shoes_id);
        if (c.equip_hat_id) ids.add(c.equip_hat_id);
        if (c.equip_armor_id) ids.add(c.equip_armor_id);
        if (c.equip_ring_id) ids.add(c.equip_ring_id);
        if (c.equip_belt_id) ids.add(c.equip_belt_id);
        if (c.equip_artifact_id) ids.add(c.equip_artifact_id);
      });
    }
    return ids;
  }, [dbChars]);

  const filteredAndSortedItems = useMemo(() => {
    if (filter === 'materials') {
      return (materials || []).map(m => {
        const id = m.material_id;
        if (id === 'magic_stone') {
          return { id, name: 'Đá Đột Phá', type: 'material', rarity: 'rainbow', amount: m.amount, isMagicStone: true };
        }
        const lvMatch = id.match(/lv(\d+)/);
        const lv = lvMatch ? parseInt(lvMatch[1]) : 1;
        const rarity = lv >= 6 ? 'rainbow' : lv >= 5 ? 'red' : lv >= 4 ? 'purple' : lv >= 3 ? 'orange' : 'blue';
        return { id, name: `Đá Nâng Cấp Lv.${lv}`, type: 'material', rarity, amount: m.amount, lv };
      });
    }

    let items = (inventory || []).filter((eq: any) => {
      const matchesType = filter === 'all' || eq.type === filter;
      const matchesRarity = !activeRarityFilter || eq.rarity === activeRarityFilter;
      return matchesType && matchesRarity;
    });

    // Sort by Combat Power descending
    return items.sort((a, b) => getItemPower(b) - getItemPower(a));
  }, [inventory, materials, filter, activeRarityFilter]);

  if (isLoading) return <div className="w-full h-screen bg-black text-white flex items-center justify-center">Loading Bag...</div>;

  const toggleTrashSelection = (id: string, isEquipped: boolean) => {
    if (isEquipped) {
      toast.error("Không thể tiêu hủy trang bị đang mặc!");
      return;
    }
    setSelectedForTrash(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllByRarityBulk = (rarity: string) => {
    const targets = (inventory || [])
      .filter((eq: any) => eq.rarity === rarity && !equippedIds.has(eq.id))
      .map((eq: any) => eq.id);
    
    setSelectedForTrash(prev => {
      const otherRarities = prev.filter(id => {
        const item = inventory.find((it: any) => it.id === id);
        return item?.rarity !== rarity;
      });
      return [...otherRarities, ...targets];
    });
  };

  const deselectAllByRarityBulk = (rarity: string) => {
    setSelectedForTrash(prev => prev.filter(id => {
      const item = inventory.find((it: any) => it.id === id);
      return item?.rarity !== rarity;
    }));
  };

  const handleBulkDelete = () => {
    if (selectedForTrash.length === 0) return;
    if (window.confirm(`Bạn có chắc muốn tiêu hủy ${selectedForTrash.length} trang bị đã chọn? Hành động này không thể hoàn tác.`)) {
      deleteMutation.mutate(selectedForTrash, {
        onSuccess: () => {
          setSelectedForTrash([]);
          setIsTrashMode(false);
        }
      });
    }
  };

  const isRaritySelectedBulk = (rarity: string) => {
    const unequippedOfRarity = (inventory || []).filter((eq: any) => eq.rarity === rarity && !equippedIds.has(eq.id));
    if (unequippedOfRarity.length === 0) return false;
    return unequippedOfRarity.every((eq: any) => selectedForTrash.includes(eq.id));
  };

  const rarities = ['white', 'green', 'blue', 'purple', 'gold', 'orange', 'red', 'black', 'rainbow'];

  return (
    <div className="w-full h-screen bg-black text-white font-sans overflow-hidden py-12 px-8">
      <div className="flex justify-between items-center mb-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="hover:bg-white/10 uppercase tracking-widest text-xs font-bold">
          <ChevronLeft className="w-5 h-5 mr-2" /> Trở Về
        </Button>
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-black italic tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-600">
            GLOBAL INVENTORY
          </h1>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">
            <SortDesc className="w-3 h-3" /> Tự động sắp xếp theo Lực Chiến
          </div>
        </div>
        <div className="flex gap-4">
          <Button 
            variant={isTrashMode ? "destructive" : "outline"} 
            onClick={() => {
              setIsTrashMode(!isTrashMode);
              if (!isTrashMode) setActiveRarityFilter(null);
            }}
            className="border-white/10 text-xs font-bold uppercase tracking-widest"
          >
            <Trash2 className="w-4 h-4 mr-2" /> {isTrashMode ? 'Hủy Bỏ' : 'Tiêu Hủy Hàng Loạt'}
          </Button>
          <div className="bg-zinc-900 border border-amber-500/20 px-4 py-2 flex items-center gap-2">
            <img src="/icon rpg/coin.png" className="w-4 h-4 object-contain" alt="Coin" />
            <span className="text-amber-500 font-black">{player?.coins?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>

      {!isTrashMode && (
        <div className="flex flex-col gap-4 mb-8">
           {/* Type Filter */}
           <div className="flex gap-2 custom-scrollbar pb-1">
            {['all', 'shoes', 'hat', 'armor', 'ring', 'belt', 'artifact', 'materials'].map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-5 py-2 border text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  filter === f ? 'bg-amber-500 text-black border-amber-500' : 'border-white/10 text-zinc-500 hover:text-white'
                }`}
              >
                {f === 'all' ? 'Tất cả' : f === 'materials' ? 'Nguyên Liệu' : f}
              </button>
            ))}
          </div>

          {/* Rarity Filter (Normal View) */}
          {filter !== 'materials' && (
            <div className="flex gap-2 border-t border-white/5 pt-4">
              <span className="text-[10px] font-black text-zinc-600 uppercase self-center mr-2">Lọc phẩm chất:</span>
              <button 
                onClick={() => setActiveRarityFilter(null)}
                className={`px-3 py-1 border text-[9px] font-bold uppercase transition-all ${
                  activeRarityFilter === null ? 'bg-zinc-200 text-black border-zinc-200' : 'border-white/5 text-zinc-500'
                }`}
              >
                Tất cả
              </button>
              {rarities.map(r => (
                <button 
                  key={r}
                  onClick={() => setActiveRarityFilter(r)}
                  className={`px-3 py-1 border text-[9px] font-bold uppercase transition-all ${
                    activeRarityFilter === r ? 'bg-white text-black border-white' : 'border-white/5 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isTrashMode && (
        <div className="bg-zinc-950/50 border border-red-500/20 p-6 mb-8 flex flex-wrap gap-4 items-center animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-red-500 mr-4">
            <Filter className="w-4 h-4" /> Tự động chọn tiêu hủy:
          </div>
          {rarities.filter(r => r !== 'rainbow' && r !== 'black').map(r => {
             const selected = isRaritySelectedBulk(r);
             return (
               <button 
                 key={r}
                 onClick={() => selected ? deselectAllByRarityBulk(r) : selectAllByRarityBulk(r)}
                 className={`px-4 py-1.5 border text-[10px] font-black uppercase tracking-tighter transition-all ${
                   selected ? 'bg-red-500 text-white border-red-500' : 'border-white/10 text-zinc-500 hover:border-white/30'
                 }`}
               >
                 {r}
               </button>
             );
          })}
          <div className="ml-auto flex items-center gap-6">
            <div className="text-xs font-black uppercase tracking-widest">Đã chọn: <span className="text-red-500">{selectedForTrash.length}</span></div>
            <Button 
              disabled={selectedForTrash.length === 0 || deleteMutation.isPending}
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs px-8 py-4 h-auto shadow-[0_0_20px_rgba(220,38,38,0.3)]"
            >
              {deleteMutation.isPending ? 'Đang tiêu hủy...' : 'XÁC NHẬN TIÊU HỦY'}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-6 gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-4 pb-32">
        {filteredAndSortedItems.length === 0 ? (
          <div className="col-span-6 py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-sm bg-zinc-950/50 border border-dashed border-white/5">
            Không tìm thấy vật phẩm nào...
          </div>
        ) : filteredAndSortedItems.map((eq: any, i: number) => {
          const isEquipped = equippedIds.has(eq.id);
          const isSelected = selectedForTrash.includes(eq.id);
          const itemPower = getItemPower(eq);
          
          const rarityStyles = (rarity: string) => {
            switch (rarity) {
              case 'rainbow': return 'border-indigo-400/50 bg-indigo-950/20 shadow-[0_0_15px_rgba(99,102,241,0.1)] text-indigo-400';
              case 'black':   return 'border-zinc-500/50 bg-zinc-900/20 text-zinc-300';
              case 'red':     return 'border-red-500/50 bg-red-950/20 text-red-500';
              case 'gold':    return 'border-amber-400/50 bg-amber-950/20 text-amber-400 font-bold';
              case 'orange':  return 'border-amber-500/50 bg-amber-950/20 text-amber-500';
              case 'purple':  return 'border-purple-500/50 bg-purple-950/20 text-purple-500';
              case 'blue':    return 'border-blue-500/50 bg-blue-950/20 text-blue-500';
              case 'green':   return 'border-emerald-500/50 bg-emerald-950/20 text-emerald-500';
              default:        return 'border-white/5 bg-zinc-950/50 text-zinc-400';
            }
          };
          const rStyle = eq.type === 'material' ? 'border-white/5 bg-zinc-950/50 text-amber-500' : rarityStyles(eq.rarity);
          
          return (
            <div 
              key={`${eq.id}-${i}`} 
              onClick={() => isTrashMode && eq.type !== 'material' && toggleTrashSelection(eq.id, isEquipped)}
              className={`border p-4 transition-all animate-in zoom-in group relative ${rStyle} ${
                isTrashMode && eq.type !== 'material' 
                  ? (isEquipped ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer hover:border-red-500/50') 
                  : 'hover:border-white/20'
              } ${isSelected ? 'ring-2 ring-red-500 border-red-500 bg-red-950/10' : ''}`} 
              style={{ animationDelay: `${i * 10}ms` }}
            >
              {isTrashMode && eq.type !== 'material' && !isEquipped && (
                <div className="absolute top-2 left-2 z-40">
                  {isSelected ? <CheckCircle2 className="w-5 h-5 text-red-500 fill-black" /> : <Circle className="w-5 h-5 text-zinc-700" />}
                </div>
              )}

              {isEquipped && (
                <div className="absolute top-2 left-2 z-40 bg-zinc-800 text-[8px] font-black uppercase px-1 rounded-sm border border-white/10 text-zinc-400">
                  E
                </div>
              )}

              <div className="w-16 h-16 mb-4 shrink-0 flex items-center justify-center relative mx-auto">
                {eq.type === 'material' ? (
                  <div className={`w-12 h-12 rounded-sm flex items-center justify-center border-2 ${eq.rarity === 'rainbow' ? 'border-amber-500/30 bg-purple-900/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'border-white/10 bg-white/5'}`}>
                    <img src={eq.isMagicStone ? "/icon rpg/magic_stone.png" : `/icon rpg/lv${eq.lv}_stone.png`} className="w-8 h-8 object-contain animate-pulse" alt={eq.name} />
                  </div>
                ) : (
                  <EquipmentIcon type={eq.type} level={eq.level || 0} rarity={eq.rarity} size="md" />
                )}
                {eq.level > 0 && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] px-1.5 font-black rounded-sm shadow-[0_0_10px_rgba(245,158,11,0.5)] z-30">
                    +{eq.level}
                  </div>
                )}
              </div>
              <div className="text-xs font-black uppercase truncate mb-1">{eq.name}</div>
              <div className="flex items-center justify-between">
                <span 
                  className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm"
                  style={{ 
                    backgroundColor: { white: '#1e293b', green: '#064e3b', blue: '#1e3a8a', purple: '#581c87', gold: '#78350f', orange: '#7c2d12', red: '#7f1d1d', black: '#000', rainbow: '#4338ca' }[eq.rarity as string] || '#000',
                    color: { white: '#94a3b8', green: '#34d399', blue: '#60a5fa', purple: '#a855f7', gold: '#fbbf24', orange: '#fb923c', red: '#ef4444', black: '#fff', rainbow: '#fff' }[eq.rarity as string] || '#fff'
                  }}
                >
                  {{ white: 'Trắng', green: 'Lục', blue: 'Lam', purple: 'Tím', gold: 'Vàng', orange: 'Cam', red: 'Đỏ', rainbow: 'Phổ Quang', black: 'Huyền Thiết' }[eq.rarity as string] || eq.rarity}
                </span>
                <div className="text-[9px] text-zinc-500 font-bold tracking-tighter uppercase font-mono">CP: {itemPower.toLocaleString()}</div>
              </div>
              
              {eq.type !== 'material' && (
                <div className="mt-3 text-[10px] flex flex-col gap-1 opacity-80 font-mono">
                  {eq.stats?.hp > 0 && <span className="text-green-400">+{eq.stats.hp} HP</span>}
                  {eq.stats?.dmg > 0 && <span className="text-red-400">+{eq.stats.dmg} DMG</span>}
                  {eq.stats?.armor > 0 && <span className="text-blue-400">+{eq.stats.armor} DEF</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
