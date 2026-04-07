import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ArrowRightLeft, AlertTriangle, Sparkles, ReceiptText } from "lucide-react";
import { useInventory, useMaterials, usePlayer, useTransferEquipment, usePlayerCharacters } from "@/hooks/usePlayerData";
import { EquipmentIcon } from "@/components/game/EquipmentIcon";
import { toast } from "sonner";

export default function TransferScreen() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('fern_user_id') || '';
  const { data: player } = usePlayer(userId);
  const { data: inventory, isLoading: invLoading } = useInventory(userId);
  const { data: materials } = useMaterials(userId);
  const { data: dbChars } = usePlayerCharacters(userId);
  const transferMutation = useTransferEquipment(userId);

  const [sourceId, setSourceId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  
  const ticketCount = materials?.find((m: any) => m.material_id === 'transfer_ticket')?.amount || 0;

  // Equipment selection rules
  // Source must have level > 0
  // Target must be level 0 and same type (optional, but requested logic implies sharing lvl)
  
  const sourceItem = useMemo(() => inventory?.find((eq: any) => eq.id === sourceId), [inventory, sourceId]);
  const targetItem = useMemo(() => inventory?.find((eq: any) => eq.id === targetId), [inventory, targetId]);

  const equippedIds = useMemo(() => {
    const ids = new Set<string>();
    if (dbChars) {
      dbChars.forEach((c: any) => {
        ['shoes', 'hat', 'armor', 'ring', 'belt', 'artifact'].forEach(slot => {
          if (c[`equip_${slot}_id`]) ids.add(c[`equip_${slot}_id`]);
        });
      });
    }
    return ids;
  }, [dbChars]);

  const coinCost = sourceItem ? (sourceItem.level * 5000) : 0;
  const kcCost = sourceItem ? (sourceItem.level * 20) : 0;

  const handleTransfer = () => {
    if (!sourceId || !targetId) return;
    if (ticketCount < 1) return toast.error("Không đủ Vé Chuyển Hóa!");
    if ((player?.coins || 0) < coinCost) return toast.error("Không đủ Vàng!");
    if ((player?.kc_balance || 0) < kcCost) return toast.error("Không đủ Kim Cương!");

    if (window.confirm(`Xác nhận chuyển cấp +${sourceItem.level} từ ${sourceItem.name} sang ${targetItem.name}?`)) {
      transferMutation.mutate({
        sourceId,
        targetId,
        coinCost,
        kcCost,
        ticketAmount: 1
      }, {
        onSuccess: () => {
          setSourceId(null);
          setTargetId(null);
        }
      });
    }
  };

  if (invLoading) return <div className="w-full h-screen bg-black flex items-center justify-center text-white">Loading Transfer...</div>;

  return (
    <div className="w-full h-screen bg-black text-white font-sans overflow-hidden py-12 px-8 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 via-transparent to-zinc-950 z-0" />
      
      <div className="relative z-10 flex flex-col h-full max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <Button variant="ghost" onClick={() => navigate('/')} className="hover:bg-white/10 uppercase tracking-widest text-xs font-bold text-zinc-500">
            <ChevronLeft className="w-5 h-5 mr-3" /> Trở Về
          </Button>
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">
              CHUYỂN HÓA TRANG BỊ
            </h1>
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.5em] mt-2">Dịch chuyển sức mạnh cổ xưa</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-zinc-900/80 border border-white/5 px-4 py-2 flex items-center gap-2 rounded-sm shadow-xl">
                <img src="/icon rpg/ve_chuyen_hoa.png" className="w-4 h-4 object-contain" alt="Ticket" />
                <span className="text-amber-500 font-black">{ticketCount} Vé</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-11 items-center flex-1 min-h-0 mb-12">
           {/* Source Selection */}
           <div className="col-span-5 flex flex-col items-center h-full">
              <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-6">Trang bị gốc (Có cấp)</h3>
              <div className="w-full flex-1 bg-zinc-950/50 border border-dashed border-white/10 p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                {inventory?.filter((eq: any) => eq.level > 0).map(eq => (
                  <button 
                    key={eq.id}
                    onClick={() => setSourceId(eq.id === sourceId ? null : eq.id)}
                    className={`relative p-4 border transition-all text-left flex items-center gap-4 ${sourceId === eq.id ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                  >
                    <EquipmentIcon type={eq.type} level={eq.level} rarity={eq.rarity} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black uppercase truncate">{eq.name}</div>
                      <div className="text-[9px] text-amber-500 font-bold tracking-widest">CẤP: +{eq.level}</div>
                    </div>
                    {equippedIds.has(eq.id) && (
                      <div className="absolute top-2 right-2 text-[8px] bg-zinc-800 px-1 border border-white/10 text-zinc-500">MẶC</div>
                    )}
                  </button>
                ))}
                {(!inventory || inventory.filter((eq: any) => eq.level > 0).length === 0) && (
                   <div className="flex flex-col items-center justify-center h-full opacity-20 italic text-sm">Chưa có trang bị +Lv</div>
                )}
              </div>
           </div>

           {/* Transfer Arrow & Cost */}
           <div className="col-span-1 flex flex-col items-center gap-8 px-4">
              <div className="w-12 h-12 bg-amber-500 flex items-center justify-center rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                 <ArrowRightLeft className="w-6 h-6 text-black" />
              </div>
              <div className="flex flex-col items-center gap-4">
                 <div className="h-20 w-[2px] bg-gradient-to-b from-amber-500 via-zinc-800 to-transparent" />
              </div>
           </div>

           {/* Target Selection */}
           <div className="col-span-5 flex flex-col items-center h-full">
              <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-6">Trang bị nhận (Lv 0)</h3>
              <div className="w-full flex-1 bg-zinc-950/50 border border-dashed border-white/10 p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                {inventory?.filter((eq: any) => eq.level === 0 && eq.id !== sourceId).map(eq => (
                  <button 
                    key={eq.id}
                    onClick={() => setTargetId(eq.id === targetId ? null : eq.id)}
                    className={`relative p-4 border transition-all text-left flex items-center gap-4 ${targetId === eq.id ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                  >
                    <EquipmentIcon type={eq.type} level={eq.level} rarity={eq.rarity} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black uppercase truncate">{eq.name}</div>
                      <div className="text-[9px] text-zinc-500 font-bold tracking-widest">{eq.typeName}</div>
                    </div>
                  </button>
                ))}
              </div>
           </div>
        </div>

        {/* Footer Summary & Action */}
        <div className="bg-zinc-900 border border-white/10 p-8 flex justify-between items-center relative overflow-hidden shrink-0">
           <div className="flex items-center gap-12">
              <div className="flex flex-col gap-1">
                 <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                    <ReceiptText className="w-3 h-3" /> Chi phí dịch vụ
                 </span>
                 <div className="flex items-center gap-6 mt-1">
                    <div className="flex items-center gap-2">
                       <img src="/icon rpg/coin.png" className="w-4 h-4" />
                       <span className={`font-black text-sm ${(player?.coins || 0) < coinCost ? 'text-red-500' : 'text-amber-500'}`}>{coinCost.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-black text-[9px] font-black italic">KC</div>
                       <span className={`font-black text-sm ${(player?.kc_balance || 0) < kcCost ? 'text-red-500' : 'text-blue-400'}`}>{kcCost.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <img src="/icon rpg/ve_chuyen_hoa.png" className="w-4 h-4" />
                       <span className={`font-black text-sm ${ticketCount < 1 ? 'text-red-500' : 'text-white'}`}>1 Vé</span>
                    </div>
                 </div>
              </div>
              
              <div className="h-10 w-[1px] bg-white/10" />

              <div className="flex flex-col gap-1">
                 <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Tiến trình</span>
                 <div className="flex items-center gap-3 mt-1">
                   <div className={`w-3 h-3 rounded-full ${sourceId ? 'bg-green-500' : 'bg-zinc-800'}`} />
                   <div className="w-4 h-[1px] bg-zinc-800" />
                   <div className={`w-3 h-3 rounded-full ${targetId ? 'bg-green-500' : 'bg-zinc-800'}`} />
                 </div>
              </div>
           </div>

           <Button 
             disabled={!sourceId || !targetId || transferMutation.isPending}
             onClick={handleTransfer}
             className="bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-[0.2em] px-12 py-7 h-auto text-sm shadow-[0_10px_40px_rgba(245,158,11,0.2)] active:scale-95"
           >
             {transferMutation.isPending ? 'ĐANG DỊCH CHUYỂN...' : 'BẮT ĐẦU CHUYỂN HÓA'}
           </Button>

           <div className="absolute bottom-0 right-0 flex items-center gap-2 p-2 pointer-events-none opacity-20">
              <Sparkles className="w-12 h-12 text-zinc-800 rotate-45" />
           </div>
        </div>

        <div className="mt-4 flex items-center gap-3 px-4 text-zinc-600">
           <AlertTriangle className="w-4 h-4" />
           <p className="text-[9px] font-bold uppercase tracking-widest">
             Cảnh báo: Sau khi chuyển hóa, cấp cường hóa của trang bị gốc sẽ trở về +0. Trang bị nhận sẽ sở hữu toàn bộ cấp của trang bị gốc.
           </p>
        </div>
      </div>
    </div>
  );
}
