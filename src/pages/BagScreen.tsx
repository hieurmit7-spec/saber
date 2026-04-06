import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Footprints, HardHat, Shield, Disc, GripHorizontal, Sparkles } from "lucide-react";
import { useInventory, useMaterials, usePlayer } from "@/hooks/usePlayerData";
import { EquipmentIcon } from "@/components/game/EquipmentIcon";

export default function BagScreen() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('fern_user_id') || '';
  const { data: player } = usePlayer(userId);
  const { data: inventory, isLoading: invLoading } = useInventory(userId);
  const { data: materials, isLoading: matsLoading } = useMaterials(userId);
  const [filter, setFilter] = useState<'all' | 'shoes' | 'hat' | 'armor' | 'ring' | 'belt' | 'artifact' | 'materials'>('all');

  const isLoading = invLoading || matsLoading;

  if (isLoading) return <div className="w-full h-screen bg-black text-white flex items-center justify-center">Loading Bag...</div>;

  const filteredItems = filter === 'materials' 
    ? (materials || []).map(m => {
        const id = m.material_id;
        if (id === 'magic_stone') {
          return {
            id,
            name: 'Đá Đột Phá',
            type: 'material',
            rarity: 'rainbow',
            amount: m.amount,
            isMagicStone: true
          };
        }
        const lvMatch = id.match(/lv(\d+)/);
        const lv = lvMatch ? parseInt(lvMatch[1]) : 1;
        const rarity = lv >= 6 ? 'rainbow' : lv >= 5 ? 'red' : lv >= 4 ? 'purple' : lv >= 3 ? 'orange' : 'blue';
        
        return {
          id,
          name: `Đá Nâng Cấp Lv.${lv}`,
          type: 'material',
          rarity,
          amount: m.amount,
          lv
        };
      })
    : (inventory || []).filter((eq: any) => filter === 'all' || eq.type === filter);

  return (
    <div className="w-full h-screen bg-black text-white font-sans overflow-hidden py-12 px-8">
      <div className="flex justify-between items-center mb-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="hover:bg-white/10 uppercase tracking-widest text-xs font-bold">
          <ChevronLeft className="w-5 h-5 mr-2" /> Trở Về
        </Button>
        <h1 className="text-4xl font-black italic tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-600">
          GLOBAL INVENTORY
        </h1>
        <div className="flex gap-4">
          <div className="bg-zinc-900 border border-amber-500/20 px-4 py-2 flex items-center gap-2">
            <img src="/icon rpg/coin.png" className="w-4 h-4 object-contain" alt="Coin" />
            <span className="text-amber-500 font-black">{player?.coins?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-8 custom-scrollbar pb-2">
        {['all', 'shoes', 'hat', 'armor', 'ring', 'belt', 'artifact', 'materials'].map((f) => (
          <button 
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-6 py-2 border text-xs font-bold uppercase tracking-widest transition-colors ${
              filter === f ? 'bg-amber-500 text-black border-amber-500' : 'border-white/20 text-zinc-400 hover:text-white'
            }`}
          >
            {f === 'all' ? 'Tất cả' : f === 'materials' ? 'Nguyên Liệu' : f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-6 gap-4 max-h-[80vh] overflow-y-auto custom-scrollbar pr-4 pb-32">
        {filteredItems.length === 0 ? (
          <div className="col-span-6 py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-sm bg-zinc-950/50 border border-dashed border-white/5">
            Không tìm thấy vật phẩm nào trong kho...
          </div>
        ) : filteredItems.map((eq: any, i: number) => {
          const rarityStyles = (rarity: string) => {
            switch (rarity) {
              case 'rainbow': return 'border-indigo-400/50 bg-indigo-950/20 shadow-[0_0_15px_rgba(99,102,241,0.1)] text-indigo-400';
              case 'black':   return 'border-zinc-500/50 bg-zinc-900/20 text-zinc-300';
              case 'red':     return 'border-red-500/50 bg-red-950/20 text-red-500';
              case 'orange':  return 'border-amber-500/50 bg-amber-950/20 text-amber-500';
              case 'purple':  return 'border-purple-500/50 bg-purple-950/20 text-purple-500';
              case 'blue':    return 'border-blue-500/50 bg-blue-950/20 text-blue-500';
              case 'green':   return 'border-emerald-500/50 bg-emerald-950/20 text-emerald-500';
              default:        return 'border-white/5 bg-zinc-950/50 text-zinc-400';
            }
          };
          const rStyle = eq.type === 'material' ? 'border-white/5 bg-zinc-950/50 text-amber-500' : rarityStyles(eq.rarity);
          
          return (
            <div key={`${eq.id}-${i}`} className={`border p-4 hover:border-white/20 transition-all animate-in zoom-in group relative ${rStyle}`} style={{ animationDelay: `${i * 20}ms` }}>
              <div className="w-16 h-16 mb-4 shrink-0 flex items-center justify-center relative mx-auto">
                {eq.type === 'material' ? (
                  <div className={`w-12 h-12 rounded-sm flex items-center justify-center border-2 ${eq.rarity === 'rainbow' ? 'border-amber-500/30 bg-purple-900/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'border-white/10 bg-white/5'}`}>
                    <img src={eq.isMagicStone ? "/icon rpg/magic_stone.png" : `/icon rpg/lv${eq.lv}_stone.png`} className="w-8 h-8 object-contain animate-pulse" alt={eq.name} />
                  </div>
                ) : (
                  <EquipmentIcon type={eq.type} level={eq.level || 0} size="md" />
                )}
                {eq.level > 0 && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] px-1.5 font-black rounded-sm shadow-[0_0_10px_rgba(245,158,11,0.5)] z-30">
                    +{eq.level}
                  </div>
                )}
              </div>
              <div className="text-xs font-black uppercase truncate">{eq.name}</div>
              <div className="text-[10px] opacity-60 mt-1 uppercase tracking-widest font-bold">
                {eq.type === 'material' ? `Số lượng: ${eq.amount}` : eq.typeName}
              </div>
              {eq.type !== 'material' && (
                <div className="mt-3 text-[10px] flex flex-col gap-1 opacity-80">
                  {eq.stats?.hp > 0 && <span className="text-green-400 font-bold">+{eq.stats.hp} HP</span>}
                  {eq.stats?.dmg > 0 && <span className="text-red-400 font-bold">+{eq.stats.dmg} DMG</span>}
                  {eq.stats?.armor > 0 && <span className="text-blue-400 font-bold">+{eq.stats.armor} GIÁP</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
