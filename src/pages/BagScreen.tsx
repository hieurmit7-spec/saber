import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/stores/gameStore";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";

export default function BagScreen() {
  const navigate = useNavigate();
  const { inventory, characters } = useGameStore();
  const [tab, setTab] = useState<'shards' | 'equipments'>('equipments');

  return (
    <div className="w-full h-screen overflow-hidden relative bg-black font-sans text-white flex flex-col p-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pointer-events-auto bg-black pb-4 border-b border-white/10">
        <Button variant="ghost" onClick={() => navigate('/')} className="text-white hover:bg-white/20">
          <ChevronLeft className="mr-2 w-6 h-6" /> Back to Main Menu
        </Button>
        <h1 className="text-3xl font-bold tracking-widest text-amber-500 uppercase">
          Inventory (Túi Đồ)
        </h1>
        <div className="w-32" />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 my-6">
        <Button 
          variant={tab === 'equipments' ? 'default' : 'outline'} 
          onClick={() => setTab('equipments')}
        >
          Trang Bị ({inventory.length})
        </Button>
        <Button 
          variant={tab === 'shards' ? 'default' : 'outline'} 
          onClick={() => setTab('shards')}
        >
          Mảnh Tướng
        </Button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {tab === 'equipments' && inventory.map((item, i) => (
            <div key={i} className={`p-4 rounded-lg flex flex-col items-center justify-center border-2 border-zinc-700 bg-zinc-900 shadow-md`}>
              <div className={`w-12 h-12 rounded-full mb-2 ${
                  item.rarity === 'rainbow' ? 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500' :
                  item.rarity === 'red' ? 'bg-red-500' :
                  item.rarity === 'gold' ? 'bg-amber-500' :
                  item.rarity === 'purple' ? 'bg-purple-500' :
                  item.rarity === 'blue' ? 'bg-blue-500' : 'bg-white'
                }`} />
              <span className={`text-sm font-bold text-center`}>{item.name}</span>
              <span className="text-xs text-zinc-400 mt-1 capitalize">{item.rarity}</span>
              <div className="text-[10px] text-zinc-500 mt-2 text-center">
                DMG: {item.stats.dmg} | HP: {item.stats.hp}
              </div>
            </div>
          ))}

          {tab === 'shards' && characters.map((c) => (
            <div key={c.id} className="p-4 rounded-lg flex flex-col items-center border border-zinc-700 bg-zinc-900">
              <div className="w-12 h-12 rounded bg-zinc-800 mb-2 overflow-hidden border border-amber-500">
                {c.id === 'saber' && <img src="/videos/saber-avatar.gif" className="w-full h-full object-cover" />}
              </div>
              <span className="text-sm font-bold text-amber-500">{c.name} Shards</span>
              <span className="text-xl font-black mt-1 text-white">{c.shards}/10</span>
            </div>
          ))}

          {tab === 'equipments' && inventory.length === 0 && (
            <div className="col-span-full h-40 flex items-center justify-center text-zinc-500">
              Chưa có trang bị nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
