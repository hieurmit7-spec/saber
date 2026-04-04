import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/hooks/usePlayerData";

export default function MainMenu() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('fern_user_id') || '';
  const { data: player, isLoading } = usePlayer(userId);

  if (isLoading) return <div className="w-full h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

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
          className="flex flex-col gap-2 pointer-events-auto cursor-pointer group hover:opacity-80 transition-opacity bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 bg-black border-2 border-amber-500 rounded-full flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              {player?.avatar_url && player.avatar_url !== 'default' ? (
                <img src={player.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-2xl text-amber-500">{player?.username?.substring(0, 2).toUpperCase() || 'P'}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 uppercase tracking-widest drop-shadow-lg">
                {player?.username || 'GUEST'}
              </h1>
              <p className="text-amber-400 font-bold text-xs tracking-widest mt-1">LVL {player?.pvp_rank_level || 1} • VIP</p>
            </div>
          </div>
        </div>

        <div className="flex gap-6 pointer-events-auto items-center">
          <div className="flex bg-black/40 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <span className="font-bold text-amber-400 mr-2">KC:</span>
            <span>{player?.kc_balance?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>

      {/* Main Navigation (Assymetric Modern Design) */}
      <div className="absolute bottom-16 right-16 flex flex-col gap-4 z-10 w-80">
        <h2 className="text-zinc-500 text-sm uppercase tracking-widest mb-2 border-b border-white/10 pb-2">Hệ Thống Trạm</h2>
        
        <button 
          onClick={() => navigate('/character')}
          className="group relative h-20 bg-zinc-950/80 backdrop-blur border border-white/5 hover:border-amber-500/50 overflow-hidden flex items-center px-6 transition-all ring-1 ring-white/5 hover:bg-black"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
          <span className="text-left font-black text-2xl uppercase tracking-wider text-white/80 group-hover:text-amber-400 transition-colors">Character</span>
        </button>
        
        <button 
          onClick={() => navigate('/battle')}
          className="group relative h-20 bg-zinc-950/80 backdrop-blur border border-white/5 hover:border-red-500/50 overflow-hidden flex items-center px-6 transition-all ring-1 ring-white/5 hover:bg-black"
        >
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-red-600 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
          <span className="text-left font-black text-2xl uppercase tracking-wider text-white/80 group-hover:text-red-400 transition-colors">Battle Zone</span>
        </button>

        <button 
          onClick={() => navigate('/gacha')}
          className="group relative h-20 bg-zinc-950/80 backdrop-blur border border-white/5 hover:border-purple-500/50 overflow-hidden flex items-center px-6 transition-all ring-1 ring-white/5 hover:bg-black"
        >
          <span className="text-left font-black text-2xl uppercase tracking-wider text-white/80 group-hover:text-purple-400 transition-colors">Gacha</span>
        </button>

        <div className="flex gap-4 mt-4">
          <button 
            onClick={() => navigate('/team')}
            className="flex-1 group relative h-14 bg-zinc-950/80 backdrop-blur border border-white/5 hover:border-blue-500/50 overflow-hidden flex items-center justify-center transition-all ring-1 ring-white/5 hover:bg-blue-900/20"
          >
            <span className="text-sm font-bold uppercase tracking-widest text-zinc-400 group-hover:text-blue-400 transition-colors">Tổ Đội</span>
          </button>
          <button 
            onClick={() => navigate('/leaderboard')}
            className="flex-1 group relative h-14 bg-zinc-950/80 backdrop-blur border border-white/5 hover:border-green-500/50 overflow-hidden flex items-center justify-center transition-all ring-1 ring-white/5 hover:bg-green-900/20"
          >
            <span className="text-sm font-bold uppercase tracking-widest text-zinc-400 group-hover:text-green-400 transition-colors">Xếp Hạng</span>
          </button>
        </div>
        
        <button 
          onClick={() => navigate('/bag')}
          className="group relative h-14 mt-4 bg-transparent border border-white/20 hover:bg-white/10 overflow-hidden flex items-center justify-center transition-all"
        >
          <span className="text-sm font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white">Thùng Đồ Toàn Cầu</span>
        </button>

      </div>
    </div>
  );
}
