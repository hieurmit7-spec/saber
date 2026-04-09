import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ArrowRightLeft, AlertTriangle, Sparkles, ReceiptText } from "lucide-react";
import { useInventory, useMaterials, usePlayer, useTransferEquipment, usePlayerCharacters } from "@/hooks/usePlayerData";
import { EquipmentIcon } from "@/components/game/EquipmentIcon";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { STAT_BONUS_TABLE, STAT_SCALE_FACTORS, getEquipCP } from "@/stores/gameStore";

const SLOT_LABELS: Record<string, string> = {
  shoes: 'Giày', hat: 'Mũ', armor: 'Giáp', ring: 'Nhẫn', belt: 'Đai', artifact: 'Pháp bảo',
};

export default function TransferScreen() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('fern_user_id') || '';
  const { data: player } = usePlayer(userId);
  const { data: inventory, isLoading: invLoading } = useInventory(userId);
  const { data: materials } = useMaterials(userId);
  const { data: dbChars } = usePlayerCharacters(userId);
  const transferMutation = useTransferEquipment(userId);

  const queryClient = useQueryClient();
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);

  const safeInventory = useMemo(() => Array.isArray(inventory) ? inventory : [], [inventory]);
  const safeDbChars = useMemo(() => Array.isArray(dbChars) ? dbChars : [], [dbChars]);

  const sourceItem = useMemo(() => safeInventory.find((eq: any) => eq.id === sourceId), [safeInventory, sourceId]);
  const targetItem = useMemo(() => safeInventory.find((eq: any) => eq.id === targetId), [safeInventory, targetId]);

  // Fix: Use useEffect for side-effects instead of useMemo
  useEffect(() => {
    if (sourceItem && targetItem && sourceItem.type !== targetItem.type) {
      setTargetId(null);
    }
  }, [sourceId, sourceItem, targetItem]);

  const getItemPower = (eq: any) => getEquipCP(eq);

  const getQualityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'text-zinc-400',
      uncommon: 'text-green-400',
      rare: 'text-blue-400',
      epic: 'text-purple-400',
      legendary: 'text-amber-400',
      orange: 'text-amber-400',
      mythic: 'text-red-500',
      red: 'text-red-500',
      rainbow: 'text-indigo-400'
    };
    return colors[rarity?.toLowerCase()] || 'text-white';
  };

  const getQualityBorder = (rarity: string, isSelected: boolean, activeColor: string) => {
    if (isSelected) return activeColor;
    const borders: Record<string, string> = {
      common: 'border-zinc-800',
      uncommon: 'border-green-900/30',
      rare: 'border-blue-900/30',
      epic: 'border-purple-900/30',
      legendary: 'border-amber-900/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
      orange: 'border-amber-900/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
      mythic: 'border-red-900/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
      red: 'border-red-900/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
      rainbow: 'border-indigo-900/40 shadow-[0_0_15px_rgba(129,140,248,0.1)]'
    };
    return borders[rarity?.toLowerCase()] || 'border-white/5';
  };

  const sourceList = useMemo(() => {
    return safeInventory
      .filter((eq: any) => (eq.level || 0) > 0)
      .sort((a, b) => getItemPower(b) - getItemPower(a));
  }, [safeInventory]);

  const targetList = useMemo(() => {
    return safeInventory
      .filter((eq: any) => {
        const isLv0 = (eq.level || 0) === 0;
        const isNotSource = eq.id !== sourceId;
        const matchesType = !sourceItem || eq.type === sourceItem.type;
        return isLv0 && isNotSource && matchesType;
      })
      .sort((a: any, b: any) => getItemPower(b) - getItemPower(a));
  }, [safeInventory, sourceId, sourceItem]);

  const ticketCount = Array.isArray(materials) 
    ? (materials.find((m: any) => m.material_id === 'transfer_ticket')?.amount || 0)
    : 0;

  const equippedIds = useMemo(() => {
    const ids = new Set<string>();
    safeDbChars.forEach((c: any) => {
        ['shoes', 'hat', 'armor', 'ring', 'belt', 'artifact'].forEach(slot => {
          if (c[`equip_${slot}_id`]) ids.add(c[`equip_${slot}_id`]);
        });
    });
    return ids;
  }, [safeDbChars]);

  const sourceLevel = Number(sourceItem?.level) || 0;
  const coinCost = sourceLevel * 5000;
  const kcCost = sourceLevel * 20;

  const handleTransfer = () => {
    if (!sourceId || !targetId) {
      toast.error("Vui lòng chọn cả trang bị gốc và trang bị nhận!");
      return;
    }
    
    if (!sourceItem || !targetItem) {
      toast.error("Không tìm thấy thông tin trang bị!");
      return;
    }

    if (ticketCount < 1) return toast.error("Không đủ Vé Chuyển Hóa!");
    if ((player?.coins || 0) < coinCost) return toast.error("Không đủ Vàng!");
    if ((player?.kc_balance || 0) < kcCost) return toast.error("Không đủ Kim Cương!");

    if (window.confirm(`Xác nhận chuyển cấp +${sourceItem.level} từ [${sourceItem.name}] sang [${targetItem.name}]?`)) {
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
          queryClient.invalidateQueries({ queryKey: ['inventory', userId] });
          queryClient.invalidateQueries({ queryKey: ['materials', userId] });
          queryClient.invalidateQueries({ queryKey: ['player', userId] });
          toast.success("Khởi tạo tiến trình chuyển hóa linh cốt thành công!");
        },
        onError: (err: any) => {
          toast.error("Lỗi chuyển hóa: " + (err.message || "Kết nối thất bại"));
        }
      });
    }
  };

  if (invLoading) return <div className="w-full h-screen bg-black flex items-center justify-center text-white">Loading Transfer...</div>;

  const calcEquipStat = (baseVal: number | undefined, level: number, statKey: string) => {
    if (!baseVal) return 0;
    const bonus = STAT_BONUS_TABLE[level] || 0;
    const factor = (STAT_SCALE_FACTORS as any)[statKey] || 1;
    return Math.floor(baseVal * (1 + bonus * factor));
  };

  return (
    <div className="w-full h-screen bg-[#050505] text-white relative font-sans overflow-hidden selection:bg-amber-500/30">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 via-transparent to-zinc-950 z-0" />
      
      <div className="relative z-10 flex flex-col h-full max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12 relative z-30">
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

        <div className="grid grid-cols-12 items-stretch flex-1 min-h-0 mb-12">
           {/* Source Selection */}
           <div className="col-span-5 flex flex-col items-center h-full">
              <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-6">Trang bị gốc (Có cấp)</h3>
              <div className="w-full flex-1 min-h-0 bg-zinc-950/50 border border-dashed border-white/10 p-6 flex flex-col gap-4 overflow-y-auto no-scrollbar fade-mask-y">
                {sourceList.map(eq => (
                  <button 
                    key={eq.id}
                    onClick={() => setSourceId(eq.id === sourceId ? null : eq.id)}
                    className={`relative p-4 border transition-all text-left flex items-center gap-4 ${sourceId === eq.id ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : `bg-black/40 ${getQualityBorder(eq.rarity, false, '')} hover:border-white/20`}`}
                  >
                    <EquipmentIcon type={eq.type} level={eq.level} rarity={eq.rarity} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-black uppercase truncate ${getQualityColor(eq.rarity)}`}>{eq.name}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="text-[9px] text-amber-500 font-bold tracking-widest">CẤP: +{eq.level}</div>
                        <div className="text-[8px] text-zinc-500 font-bold uppercase">CP: {getItemPower(eq).toLocaleString()}</div>
                      </div>
                    </div>
                    {equippedIds.has(eq.id) && (
                      <div className="absolute top-2 right-2 text-[8px] bg-zinc-800 px-1 border border-white/10 text-zinc-500">MẶC</div>
                    )}
                  </button>
                ))}
                {sourceList.length === 0 && (
                   <div className="flex flex-col items-center justify-center h-full opacity-20 italic text-sm">Chưa có trang bị +Lv</div>
                )}
              </div>
           </div>

           {/* Central Preview & Process */}
           <div className="col-span-2 flex flex-col items-center justify-start pt-12 h-full relative">
              {sourceId && targetId ? (
                <div className="flex flex-col items-center animate-in zoom-in duration-500">
                   <div className="group relative">
                      {/* Magical Aura around the arrow */}
                      <div className="absolute inset-[-40px] bg-amber-500/10 blur-[30px] rounded-full animate-pulse" />
                      <div className="w-16 h-16 rounded-full bg-zinc-950 border-2 border-amber-500/50 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                         <ArrowRightLeft className="w-8 h-8 text-amber-500 animate-[spin_4s_linear_infinite]" />
                      </div>
                   </div>
                   
                   {/* Level Inheritance Indicator */}
                   <div className="mt-8 flex flex-col items-center gap-2 relative z-20">
                      <div className="text-[10px] font-black text-amber-500/50 uppercase tracking-[0.3em]">Kết Quả Dự Kiến</div>
                      <div className="flex items-center gap-4">
                         <span className="text-xl font-black text-zinc-500">+{sourceItem?.level}</span>
                         <ArrowRightLeft className="w-4 h-4 text-zinc-700" />
                         <span className="text-2xl font-black text-amber-500 animate-pulse">+{sourceItem?.level}</span>
                      </div>
                   </div>

                   {/* Detailed Stat Preview Table */}
                   <div className="mt-6 w-full max-w-[200px] bg-zinc-900/80 border border-white/10 rounded-2xl p-4 space-y-2 backdrop-blur-xl shadow-2xl z-30">
                      {['hp', 'dmg', 'armor', 'speed'].map(statKey => {
                        const targetBase = targetItem?.stats?.[statKey];
                        if (!targetBase) return null;
                        
                        const currentVal = calcEquipStat(targetBase, 0, statKey);
                        const futureVal = calcEquipStat(targetBase, sourceItem?.level || 0, statKey);
                        const diff = futureVal - currentVal;

                        const labels: any = { hp: 'HP', dmg: 'ATK', armor: 'DEF', speed: 'SPD' };

                        return (
                          <div key={statKey} className="flex flex-col gap-0.5">
                             <div className="flex justify-between items-center text-[7px] font-black text-zinc-500 uppercase tracking-widest">
                                <span>{labels[statKey]}</span>
                                <span className="text-green-500">+{diff.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center bg-black/60 px-2 py-1 rounded-lg border border-white/5">
                                <span className="text-[9px] font-mono text-zinc-600">{currentVal.toLocaleString()}</span>
                                <ArrowRightLeft className="w-2.5 h-2.5 text-zinc-800" />
                                <span className="text-[10px] font-black font-mono text-white">
                                   {futureVal.toLocaleString()}
                                </span>
                             </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center opacity-10">
                   <ArrowRightLeft className="w-12 h-12 text-white" />
                   <div className="text-[8px] font-black uppercase tracking-widest mt-4">Đang Chờ...</div>
                </div>
              )}
           </div>

           {/* Target Selection */}
           <div className="col-span-5 flex flex-col items-center h-full">
              <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-6">Trang bị nhận (Lv 0)</h3>
              <div className="w-full flex-1 min-h-0 bg-zinc-950/50 border border-dashed border-white/10 p-6 pr-4 flex flex-col gap-4 overflow-y-auto no-scrollbar fade-mask-y">
                {targetList.map(eq => (
                  <button 
                    key={eq.id}
                    onClick={() => setTargetId(eq.id === targetId ? null : eq.id)}
                    className={`relative p-4 border transition-all text-left flex items-center gap-4 ${targetId === eq.id ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : `bg-black/40 ${getQualityBorder(eq.rarity, false, '')} hover:border-white/20`}`}
                  >
                    <EquipmentIcon type={eq.type} level={eq.level} rarity={eq.rarity} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-black uppercase truncate ${getQualityColor(eq.rarity)}`}>{eq.name}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="text-[9px] text-zinc-500 font-bold tracking-widest">{SLOT_LABELS[eq.type] || eq.type}</div>
                        <div className="text-[8px] text-zinc-600 font-bold uppercase">CP: {getItemPower(eq).toLocaleString()}</div>
                      </div>
                    </div>
                  </button>
                ))}
                {sourceId && targetList.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full opacity-20 italic text-sm text-center">
                    Không có {SLOT_LABELS[sourceItem?.type] || sourceItem?.type} Lv 0 trong túi đồ
                  </div>
                )}
                {!sourceId && (
                  <div className="flex flex-col items-center justify-center h-full opacity-20 italic text-sm text-center">
                    Vui lòng chọn trang bị gốc trước
                  </div>
                )}
              </div>
           </div>
        </div>

        {/* Footer Summary & Action */}
        <div className="bg-zinc-900 border border-white/10 p-8 flex justify-between items-center relative z-50 overflow-hidden shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
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
