import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ShoppingCart, Timer, ShieldAlert } from "lucide-react";
import { usePlayer, useMaterials, useBuyShopItem } from "@/hooks/usePlayerData";
import { toast } from "sonner";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  costKC: number;
  amount: number;
  type: 'shard' | 'material';
  rarity: string;
  limit: number;
  icon: string;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'saber', name: 'Mảnh Saber', description: 'Mảnh hồn của vua hiệp sĩ.', costKC: 2000, amount: 10, type: 'shard', rarity: 'gold', limit: 1, icon: '/videos/saber-avatar.gif' },
  { id: 'gojo', name: 'Mảnh Gojo', description: 'Mảnh chú thuật của kẻ mạnh nhất.', costKC: 3000, amount: 10, type: 'shard', rarity: 'rainbow', limit: 1, icon: '/videos/gojo.gif' },
  { id: 'sasuke', name: 'Mảnh Sasuke', description: 'Mảnh hận thù của tộc Uchiha.', costKC: 1500, amount: 10, type: 'shard', rarity: 'purple', limit: 1, icon: '/videos/sasuke.gif' },
  { id: 'transfer_ticket', name: 'Vé Chuyển Hóa', description: 'Dùng để chuyển cấp cường hóa giữa 2 trang bị.', costKC: 500, amount: 1, type: 'material', rarity: 'orange', limit: 5, icon: '/icon rpg/ve_chuyen_hoa.png' },
  { id: 'magic_stone', name: 'Đá Đột Phá', description: 'Đá quý dùng để đột phá cảnh giới.', costKC: 1000, amount: 1, type: 'material', rarity: 'rainbow', limit: 3, icon: '/icon rpg/magic_stone.png' },
];

export default function ShopScreen() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('fern_user_id') || '';
  const { data: player } = usePlayer(userId);
  const buyMutation = useBuyShopItem(userId);

  // Mocking limit tracking via localStorage for now
  const [purchaseCounts, setPurchaseCounts] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(`shop_limits_${userId}_${new Date().toDateString()}`);
    return saved ? JSON.parse(saved) : {};
  });

  const handleBuy = (item: ShopItem) => {
    const currentCount = purchaseCounts[item.id] || 0;
    if (currentCount >= item.limit) {
      toast.error("Đã đạt giới hạn mua trong ngày!");
      return;
    }
    if ((player?.kc_balance || 0) < item.costKC) {
      toast.error("Không đủ Kim Cương!");
      return;
    }

    buyMutation.mutate({
      itemId: item.id,
      costKC: item.costKC,
      amount: item.amount,
      itemType: item.type
    }, {
      onSuccess: () => {
        const newCounts = { ...purchaseCounts, [item.id]: currentCount + 1 };
        setPurchaseCounts(newCounts);
        localStorage.setItem(`shop_limits_${userId}_${new Date().toDateString()}`, JSON.stringify(newCounts));
      }
    });
  };

  return (
    <div className="w-full h-screen bg-black text-white font-sans overflow-hidden py-12 px-8 relative">
       {/* Decorative Background */}
       <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 via-transparent to-blue-900/20 z-0" />
       
       <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-center mb-12">
            <Button variant="ghost" onClick={() => navigate('/')} className="hover:bg-white/10 uppercase tracking-widest text-xs font-bold text-zinc-400">
              <ChevronLeft className="w-5 h-5 mr-2" /> Trở Về Trạm
            </Button>
            <div className="flex flex-col items-center">
              <h1 className="text-5xl font-black italic tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
                CHỢ ĐEN
              </h1>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-2">
                <ShoppingCart className="w-3 h-3" /> Chợ đen liên giới - Cập nhật mỗi ngày
              </div>
            </div>
            <div className="flex bg-zinc-900/80 backdrop-blur border border-blue-500/30 rounded-full px-6 py-2 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-black text-[9px] font-black italic mr-3">KC</div>
              <span className="font-black text-blue-400 tabular-nums">{player?.kc_balance?.toLocaleString() || 0}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 overflow-y-auto custom-scrollbar pb-20">
            {SHOP_ITEMS.map((item) => {
              const boughtCount = purchaseCounts[item.id] || 0;
              const isLimited = boughtCount >= item.limit;
              
              const rarityStyles = (rarity: string) => {
                switch (rarity) {
                  case 'rainbow': return 'border-indigo-500/50 bg-indigo-950/20 shadow-[0_0_30px_rgba(99,102,241,0.1)]';
                  case 'gold':    return 'border-amber-500/50 bg-amber-950/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]';
                  case 'orange':  return 'border-orange-500/50 bg-orange-950/20';
                  case 'purple':  return 'border-purple-500/50 bg-purple-950/20';
                  default:        return 'border-white/10 bg-zinc-900/30';
                }
              };

              return (
                <div 
                  key={item.id} 
                  className={`group relative flex flex-col p-6 border transition-all duration-300 ${rarityStyles(item.rarity)} ${isLimited ? 'opacity-50 grayscale' : 'hover:border-white/40 hover:translate-y-[-4px]'}`}
                >
                  <div className="absolute top-4 right-4 text-[10px] font-black uppercase text-zinc-500 flex items-center gap-1">
                    <Timer className="w-3 h-3 text-amber-500" /> LV: {boughtCount}/{item.limit}
                  </div>

                  <div className="w-24 h-24 mx-auto mb-6 relative">
                    <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full group-hover:bg-white/10 transition-colors" />
                    {item.type === 'shard' ? (
                      <img src={item.icon} className="w-full h-full object-cover rounded-xl border-2 border-white/10 relative z-10" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center relative z-10">
                         <img src={item.icon} className="w-16 h-16 object-contain" alt={item.name} />
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-black uppercase tracking-tighter text-center mb-1">{item.name}</h3>
                  <p className="text-[10px] text-zinc-500 text-center font-bold uppercase tracking-widest mb-6 h-8 line-clamp-2">{item.description}</p>
                  
                  <div className="mt-auto pt-6 border-t border-white/5">
                    <div className="flex flex-col gap-3">
                       <div className="flex justify-center items-center gap-2 mb-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-black text-[9px] font-black italic">KC</div>
                          <span className="text-xl font-black tabular-nums">{item.costKC.toLocaleString()}</span>
                       </div>
                       <Button 
                         disabled={isLimited || buyMutation.isPending}
                         onClick={() => handleBuy(item)}
                         className={`w-full py-6 font-black uppercase tracking-[0.2em] text-xs h-auto rounded-none transition-all ${
                           isLimited 
                             ? 'bg-zinc-800 text-zinc-500' 
                             : 'bg-white text-black hover:bg-amber-400 active:scale-95 shadow-[0_10px_20px_rgba(0,0,0,0.3)]'
                         }`}
                       >
                         {buyMutation.isPending ? 'Đang Mua...' : isLimited ? 'ĐÃ HẾT HÀNG' : 'MUA NGAY'}
                       </Button>
                    </div>
                  </div>

                  {isLimited && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                       <span className="bg-black/80 border border-white/20 px-6 py-2 text-xs font-black uppercase tracking-[0.5em] rotate-12">Sold Out</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-auto bg-blue-900/10 border border-blue-500/20 p-4 flex items-center gap-4 animate-pulse">
             <ShieldAlert className="w-6 h-6 text-blue-400" />
             <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">
               Lưu ý: Vật phẩm trong CHỢ ĐEN được làm mới vào lúc 00:00 mỗi ngày. Hãy tranh thủ mua sắm trước khi hết hạn!
             </p>
          </div>
       </div>
    </div>
  );
}
