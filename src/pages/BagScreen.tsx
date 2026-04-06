import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Footprints, HardHat, Shield, Disc, GripHorizontal, Sparkles } from "lucide-react";
import { useInventory, useMaterials } from "@/hooks/usePlayerData";

export default function BagScreen() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('fern_user_id') || '';
  const { data: inventory, isLoading: invLoading } = useInventory(userId);
  const { data: materials, isLoading: matsLoading } = useMaterials(userId);
  const [filter, setFilter] = useState<'all' | 'shoes' | 'hat' | 'armor' | 'ring' | 'belt' | 'artifact' | 'materials'>('all');

  const isLoading = invLoading || matsLoading;

  if (isLoading) return <div className="w-full h-screen bg-black text-white flex items-center justify-center">Loading Bag...</div>;

  const filteredItems = filter === 'materials' 
    ? (materials || []).map(m => ({
        id: m.material_id,
        name: m.material_id.includes('lv1') ? 'Đá Nâng Cấp Lv.1' : 
              m.material_id.includes('lv2') ? 'Đá Nâng Cấp Lv.2' : 
              m.material_id.includes('lv3') ? 'Đá Nâng Cấp Lv.3' : 'Đá Nâng Cấp Lv.4',
        type: 'material',
        rarity: parseInt(m.material_id.slice(-1)) > 3 ? 'purple' : 'blue',
        amount: m.amount
      }))
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
        {filteredItems.map((eq: any, i: number) => (
          <div key={eq.id} className="bg-zinc-950 border border-white/5 p-4 hover:border-white/20 transition-colors animate-in zoom-in group relative" style={{ animationDelay: `${i * 20}ms` }}>
            <div className={`w-12 h-12 mb-4 shrink-0 flex items-center justify-center rounded-sm border border-white/10 ${
              eq.rarity === 'rainbow' ? 'bg-gradient-to-tr from-red-500 via-emerald-500 to-indigo-500 shadow-[0_0_20px_rgba(255,255,255,0.5)] animate-pulse' :
              eq.rarity === 'purple' ? 'bg-purple-900/40 shadow-[0_0_15px_purple]' :
              eq.rarity === 'red' ? 'bg-red-500 shadow-[0_0_15px_red]' :
              eq.rarity === 'orange' ? 'bg-amber-500 shadow-[0_0_15px_orange]' :
              eq.rarity === 'black' ? 'bg-zinc-800' :
              eq.rarity === 'blue' ? 'bg-blue-600' : 'bg-zinc-300'
            }`}>
              {eq.type === 'shoes' ? <Footprints className="text-white w-5 h-5 opacity-75" /> :
               eq.type === 'hat' ? <HardHat className="text-white w-5 h-5 opacity-75" /> :
               eq.type === 'armor' ? <Shield className="text-white w-5 h-5 opacity-75" /> :
               eq.type === 'ring' ? <Disc className="text-white w-5 h-5 opacity-75" /> :
               eq.type === 'belt' ? <GripHorizontal className="text-white w-5 h-5 opacity-75" /> :
               <Sparkles className="text-white w-5 h-5 opacity-75" />}
            </div>
            <div className="text-xs font-bold uppercase truncate">{eq.name}</div>
            <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">
              {eq.type === 'material' ? `Số lượng: ${eq.amount}` : eq.typeName}
            </div>
            <div className="mt-3 text-[10px] flex flex-col gap-1 text-zinc-400">
              {eq.stats?.hp > 0 && <span className="text-green-400">+{eq.stats.hp} HP</span>}
              {eq.stats?.speed > 0 && <span>+{eq.stats.speed} Tốc</span>}
              {eq.stats?.armor > 0 && <span className="text-blue-400">+{eq.stats.armor} Giáp</span>}
              {eq.stats?.dmg > 0 && <span className="text-red-400">+{eq.stats.dmg} Dmg</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
