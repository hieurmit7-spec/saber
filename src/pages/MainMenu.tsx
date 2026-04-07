import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/hooks/usePlayerData";
import { ShoppingBag, ArrowRightLeft, User, Shield, Swords, Sparkles, LayoutGrid, Trophy, Briefcase } from "lucide-react";

export default function MainMenu() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('fern_user_id') || '';
  const { data: player, isLoading } = usePlayer(userId);

  if (isLoading) return <div className="w-full h-screen bg-black flex items-center justify-center text-white italic tracking-widest">Đang kết nối hệ thống...</div>;

  return (
    <div className="w-full h-screen overflow-hidden relative bg-black font-sans text-white">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute w-full h-full object-cover z-0 opacity-80"
        style={{ transform: "scaleX(-1)" }}
      >
        <source src="/videos/spring-bg.mp4" type="video/mp4" />
      </video>

      {/* Top Banner UI */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-10 pointer-events-none">
        
        <div 
          onClick={() => navigate('/profile')}
          className="flex flex-col gap-2 pointer-events-auto cursor-pointer group hover:opacity-80 transition-all bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] active:scale-95"
        >
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 bg-zinc-900 border-2 border-amber-500 rounded-full flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              {player?.avatar_url && player.avatar_url !== 'default' ? (
                <img src={player.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-2xl text-amber-500">{player?.username?.substring(0, 2).toUpperCase() || 'P'}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 uppercase tracking-widest drop-shadow-lg leading-tight">
                {player?.username || 'GUEST'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-amber-500 text-black text-[8px] px-1.5 py-0.5 font-black uppercase rounded-sm">VIP</span>
                <p className="text-zinc-400 font-bold text-[10px] tracking-widest uppercase">LEVEL {player?.pvp_rank_level || 1}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pointer-events-auto items-center">
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-full pl-3 pr-5 py-2 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-black text-[9px] font-black italic">KC</div>
              <span className="font-black text-blue-400 tabular-nums text-sm">{player?.kc_balance?.toLocaleString() || 0}</span>
            </div>
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-full pl-3 pr-5 py-2 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
              <img src="/icon rpg/coin.png" className="w-4 h-4 object-contain" />
              <span className="font-black text-amber-500 tabular-nums text-sm">{player?.coins?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Left Sidebar Quick Actions */}
      <div className="absolute bottom-16 left-16 flex flex-col gap-6 z-10 w-20">
         <button 
           onClick={() => navigate('/shop')}
           className="w-16 h-16 bg-zinc-950/80 backdrop-blur border border-white/10 flex flex-col items-center justify-center group hover:bg-white hover:text-black transition-all shadow-xl"
           title="Tiệm Tổng Hợp"
         >
           <ShoppingBag className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
           <span className="text-[7px] font-black uppercase tracking-widest">Tiệm</span>
         </button>
         <button 
           onClick={() => navigate('/transfer')}
           className="w-16 h-16 bg-zinc-950/80 backdrop-blur border border-white/10 flex flex-col items-center justify-center group hover:bg-amber-500 hover:text-black transition-all shadow-xl"
           title="Chuyển Hóa"
         >
           <ArrowRightLeft className="w-6 h-6 mb-1 group-hover:rotate-180 transition-transform duration-500" />
           <span className="text-[7px] font-black uppercase tracking-widest">Chuyển</span>
         </button>
      </div>

      {/* Main Navigation (Right Panel) */}
      <div className="absolute bottom-16 right-16 flex flex-col gap-4 z-10 w-80">
        <div className="flex items-center gap-3 mb-2 border-b border-white/10 pb-2">
            <LayoutGrid className="w-4 h-4 text-zinc-500" />
            <h2 className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.4em]">Hệ Thống Trạm</h2>
        </div>
        
        <button 
          onClick={() => navigate('/character')}
          className="group relative h-20 bg-zinc-950/80 backdrop-blur border border-white/5 hover:border-amber-500/50 overflow-hidden flex items-center px-6 transition-all ring-1 ring-white/5 hover:bg-black"
        >
          <div className="absolute inset-x-0 top-0 h-[1px] bg-amber-500/50 scale-x-0 group-hover:scale-x-100 transition-transform"></div>
          <User className="w-6 h-6 mr-4 text-zinc-600 group-hover:text-amber-500 transition-colors" />
          <span className="text-left font-black text-2xl uppercase tracking-wider text-white/80 group-hover:text-amber-400 transition-colors">Tướng</span>
        </button>
        
        <button 
          onClick={() => navigate('/battle')}
          className="group relative h-20 bg-zinc-950/80 backdrop-blur border border-white/5 hover:border-red-500/50 overflow-hidden flex items-center px-6 transition-all ring-1 ring-white/5 hover:bg-black"
        >
          <Swords className="w-6 h-6 mr-4 text-zinc-600 group-hover:text-red-500 transition-colors" />
          <span className="text-left font-black text-2xl uppercase tracking-wider text-white/80 group-hover:text-red-400 transition-colors">Quyết Đấu</span>
        </button>

        <button 
          onClick={() => navigate('/gacha')}
          className="group relative h-20 bg-zinc-950/80 backdrop-blur border border-white/5 hover:border-purple-500/50 overflow-hidden flex items-center px-6 transition-all ring-1 ring-white/5 hover:bg-black"
        >
          <Sparkles className="w-6 h-6 mr-4 text-zinc-600 group-hover:text-purple-500 transition-colors" />
          <span className="text-left font-black text-2xl uppercase tracking-wider text-white/80 group-hover:text-purple-400 transition-colors">Triệu Hồi</span>
        </button>

        <div className="flex gap-4 mt-4">
          <button 
            onClick={() => navigate('/team')}
            className="flex-1 group relative h-14 bg-zinc-950/80 backdrop-blur border border-white/5 hover:border-blue-500/50 overflow-hidden flex flex-col items-center justify-center transition-all ring-1 ring-white/5 hover:bg-blue-900/20"
          >
            <Shield className="w-4 h-4 mb-1 text-zinc-600 group-hover:text-blue-400" />
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-blue-400 transition-colors">Đội Hình</span>
          </button>
          <button 
            onClick={() => navigate('/leaderboard')}
            className="flex-1 group relative h-14 bg-zinc-950/80 backdrop-blur border border-white/5 hover:border-green-500/50 overflow-hidden flex flex-col items-center justify-center transition-all ring-1 ring-white/5 hover:bg-green-900/20"
          >
            <Trophy className="w-4 h-4 mb-1 text-zinc-600 group-hover:text-green-400" />
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-green-400 transition-colors">Bảng Hạng</span>
          </button>
        </div>
        
        <button 
          onClick={() => navigate('/bag')}
          className="group relative h-14 mt-4 bg-transparent border border-white/20 hover:bg-white hover:text-black overflow-hidden flex items-center justify-center transition-all"
        >
          <Briefcase className="w-4 h-4 mr-3 opacity-60 group-hover:opacity-100" />
          <span className="text-xs font-black uppercase tracking-[0.2em]">Kho Toàn Cầu</span>
        </button>

      </div>
    </div>
  );
}
