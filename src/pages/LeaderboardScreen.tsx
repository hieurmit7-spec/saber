import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy, Swords, ChevronRight } from 'lucide-react';
import { useLeaderboard } from '@/hooks/usePlayerData';

const FRAME_STYLES: Record<string, string> = {
  none:        'border-white/20',
  gold:        'border-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.6)]',
  red_fire:    'border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]',
  blue_ice:    'border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]',
  purple_void: 'border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.7)]',
};

function PlayerAvatar({ player }: { player: any }) {
  const frameStyle = FRAME_STYLES[player.frame_url || 'none'] || FRAME_STYLES.none;
  const hasAvatar = player.avatar_url && player.avatar_url !== 'default';
  const initials = player.username.substring(0, 2).toUpperCase();

  return (
    <div className={`w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0 flex items-center justify-center bg-zinc-900 ${frameStyle}`}>
      {hasAvatar
        ? <img src={player.avatar_url} className="w-full h-full object-cover" />
        : <span className="text-xs font-black text-amber-500">{initials}</span>
      }
    </div>
  );
}

export default function LeaderboardScreen() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useLeaderboard();
  
  const [activeTab, setActiveTab] = useState<'rank' | 'power'>('power');

  if (isLoading) return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse text-zinc-500 uppercase tracking-widest text-sm">Loading Leaderboard...</div>
    </div>
  );
  if (error) return <div className="w-full h-screen bg-black flex items-center justify-center text-red-500">Error loading data.</div>;

  const currentList = activeTab === 'rank' ? data?.rankLeaderboard : data?.powerLeaderboard;

  return (
    <div className="w-full h-screen bg-zinc-950 text-white flex flex-col font-sans overflow-hidden">
      {/* Decorative Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Header */}
      <div className="p-8 pb-4 flex justify-between items-center z-10 border-b border-white/5 bg-black/80 backdrop-blur-md">
        <button onClick={() => navigate('/')} className="text-zinc-500 hover:text-white uppercase tracking-widest text-xs font-bold transition-colors flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Trở Về
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">Bảng Xếp Hạng</h1>
          <p className="text-amber-500 text-xs tracking-widest uppercase mt-1">Hall of Fame</p>
        </div>
        <div className="w-24" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center pt-8 z-10 relative">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('power')}
            className={`flex items-center gap-2 px-8 py-3 font-bold uppercase tracking-widest text-sm transition-all border ${activeTab === 'power' ? 'border-amber-500 bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-white/10 text-zinc-500 hover:text-zinc-300'}`}
          >
            <Swords className="w-4 h-4" /> Lực Chiến
          </button>
          <button
            onClick={() => setActiveTab('rank')}
            className={`flex items-center gap-2 px-8 py-3 font-bold uppercase tracking-widest text-sm transition-all border ${activeTab === 'rank' ? 'border-amber-500 bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-white/10 text-zinc-500 hover:text-zinc-300'}`}
          >
            <Trophy className="w-4 h-4" /> Bậc Hạng
          </button>
        </div>

        {/* List */}
        <div className="w-full max-w-4xl bg-black/50 border border-white/10 backdrop-blur-md flex-1 mb-12 overflow-y-auto custom-scrollbar">
          {/* Table Header */}
          <div className="sticky top-0 bg-zinc-900 border-b border-white/10 px-8 py-4 flex items-center text-xs font-bold tracking-widest uppercase text-zinc-500 shadow-md z-10">
            <div className="w-16 text-center">Hạng</div>
            <div className="flex-1 pl-2">Người Chơi</div>
            {activeTab === 'rank'
              ? <div className="w-48 text-right">Bậc Rank & Sao</div>
              : <div className="w-48 text-right">Tổng Lực Chiến</div>
            }
            <div className="w-8" />
          </div>

          <div className="flex flex-col">
            {currentList?.map((player: any, index: number) => {
              const isTop3 = index < 3;
              const rankColor = index === 0
                ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                : index === 1
                  ? 'text-zinc-300 drop-shadow-[0_0_10px_rgba(212,212,216,0.8)]'
                  : index === 2
                    ? 'text-orange-500 drop-shadow-[0_0_10px_rgba(234,88,12,0.8)]'
                    : 'text-zinc-600';

              return (
                <div
                  key={player.id}
                  onClick={() => navigate(`/profile/${player.id}`)}
                  className={`flex items-center px-8 py-3 border-b border-white/5 transition-all cursor-pointer hover:bg-amber-500/5 hover:pl-10 group ${isTop3 ? 'bg-amber-950/20' : ''}`}
                >
                  {/* Rank Number */}
                  <div className={`w-16 text-center text-xl font-black italic ${rankColor}`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 flex items-center gap-3">
                    <PlayerAvatar player={player} />
                    <div>
                      <div className={`font-bold tracking-wider text-sm ${isTop3 ? 'text-white' : 'text-zinc-300'}`}>
                        {player.username}
                      </div>
                      <div className="text-zinc-600 text-xs uppercase tracking-widest">Lv {player.pvp_rank_level}</div>
                    </div>
                  </div>

                  {/* Score */}
                  {activeTab === 'rank' ? (
                    <div className="w-48 text-right flex flex-col items-end">
                      <span className="text-red-400 font-bold uppercase tracking-widest text-sm">Rank {player.pvp_rank_level}</span>
                      <span className="text-zinc-500 text-xs">⭐ {player.pvp_stars} Sao</span>
                    </div>
                  ) : (
                    <div className="w-48 text-right">
                      <span className="text-amber-500 font-black text-lg tracking-wider">{player.combat_power?.toLocaleString() || 0}</span>
                    </div>
                  )}

                  {/* Arrow */}
                  <div className="w-8 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
              );
            })}

            {(!currentList || currentList.length === 0) && (
              <div className="py-20 text-center text-zinc-600 uppercase tracking-widest text-sm">Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
