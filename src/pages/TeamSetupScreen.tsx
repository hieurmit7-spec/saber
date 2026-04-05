import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import { usePlayer, useHydratedCharacters, useUpdateTeamSetup } from '@/hooks/usePlayerData';
import { calculateCP } from '@/stores/gameStore';
import { toast } from 'sonner';

export default function TeamSetupScreen() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('fern_user_id') || '';
  const { data: player, isLoading: playerLoading } = usePlayer(userId);
  const { characters: ALL_CHARS, isLoading: charLoading } = useHydratedCharacters(userId);
  const { mutate: updateTeam } = useUpdateTeamSetup(userId);

  const [team, setTeam] = useState<(string | null)[]>([null, null, null, null, null]);
  const [selectSlotIdx, setSelectSlotIdx] = useState<number | null>(null);

  useEffect(() => {
    if (player && player.team_setup && Array.isArray(player.team_setup)) {
      setTeam(player.team_setup);
    }
  }, [player]);

  const unlockedChars = ALL_CHARS.filter(c => c.isUnlocked);

  const totalCP = useMemo(() => {
    return team.reduce((acc, charId) => {
      if (!charId) return acc;
      const c = ALL_CHARS.find(x => x.id === charId);
      if (c && c.isUnlocked) {
        return acc + calculateCP(c as any);
      }
      return acc;
    }, 0);
  }, [team, ALL_CHARS]);

  const handleSelectChar = (charId: string) => {
    if (selectSlotIdx === null) return;
    
    // Prevent duplicate unless swapping
    const currentIdx = team.findIndex(id => id === charId);
    let newTeam = [...team];
    
    if (currentIdx !== -1) {
      newTeam[currentIdx] = null; // Remove from old slot
    }
    newTeam[selectSlotIdx] = charId;
    setTeam(newTeam);
    setSelectSlotIdx(null);
  };

  const handleRemove = (idx: number) => {
    let newTeam = [...team];
    newTeam[idx] = null;
    setTeam(newTeam);
  };

  const handleSave = () => {
    updateTeam({ teamSetup: team, combatPower: totalCP });
  };

  if (playerLoading || charLoading) return <div className="w-full h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="w-full h-screen bg-zinc-950 text-white flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="p-8 pb-4 flex justify-between items-center z-10 border-b border-white/5 bg-black">
        <button onClick={() => navigate('/')} className="text-zinc-500 hover:text-white uppercase tracking-widest text-xs font-bold transition-colors flex items-center">
          <ChevronLeft className="w-4 h-4 mr-2" /> Trở Về
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">Tổ Đội</h1>
          <p className="text-amber-500 text-xs tracking-widest uppercase mt-1">Lực Chiến Tổng: {totalCP.toLocaleString()}</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-black transition-colors px-6 py-2 uppercase font-bold text-xs tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <Save className="w-4 h-4" /> Khóa Đội Hình
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-8">
        {/* Decorative Grid */}
        <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Team Slots */}
        <div className="flex gap-8 justify-center items-center z-10 w-full max-w-6xl">
          {team.map((charId, idx) => {
            const char = charId ? unlockedChars.find(c => c.id === charId) : null;
            return (
              <div key={idx} className="flex flex-col items-center gap-4 group">
                <div 
                  onClick={() => setSelectSlotIdx(idx)}
                  className={`w-40 h-56 border-2 transition-all cursor-pointer relative overflow-hidden bg-black flex items-center justify-center ${
                    char ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:border-amber-400' : 'border-white/10 hover:border-white/30 border-dashed'
                  }`}
                >
                  {char ? (
                    <>
                      <img 
                        src={char.videoAvatar || ''} 
                        className="absolute inset-0 w-full h-full object-cover filter brightness-75 group-hover:brightness-100 transition-all" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      {!char.videoAvatar && <div className="text-6xl absolute">😎</div>}
                      
                      <div className="absolute bottom-4 text-center w-full">
                        <div className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-1">CP: {calculateCP(char as any).toLocaleString()}</div>
                        <h3 className="font-black text-xl uppercase tracking-wider">{char.name}</h3>
                      </div>
                    </>
                  ) : (
                    <span className="text-zinc-600 text-6xl">+</span>
                  )}
                </div>
                {char && (
                  <button onClick={() => handleRemove(idx)} className="text-xs text-red-500 uppercase font-bold tracking-widest hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Hủy Bỏ
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Select Modal */}
      {selectSlotIdx !== null && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-8">
          <div className="w-full max-w-4xl">
            <div className="flex justify-between items-center mb-12 border-b border-white/10 pb-4">
              <h2 className="text-3xl font-black uppercase tracking-widest text-white">Triệu Tập Sát Thủ</h2>
              <button 
                onClick={() => setSelectSlotIdx(null)}
                className="text-zinc-500 hover:text-white uppercase font-bold tracking-widest text-sm transition-colors"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-5 gap-6">
              {unlockedChars.length === 0 && <div className="col-span-5 text-center text-zinc-500 tracking-widest uppercase">Chưa có tướng nào</div>}
              {unlockedChars.map(char => {
                const isSelected = team.includes(char.id);
                return (
                  <button
                    key={char.id}
                    onClick={() => handleSelectChar(char.id)}
                    className={`flex flex-col items-center bg-zinc-950 border transition-all hover:bg-zinc-900 overflow-hidden ${isSelected ? 'border-zinc-700 opacity-50 cursor-not-allowed' : 'border-white/10 hover:border-amber-500'}`}
                    disabled={isSelected && team[selectSlotIdx] !== char.id}
                  >
                    <div className="w-full h-32 bg-black relative flex items-center justify-center">
                      <img 
                        src={char.videoAvatar || ''} 
                        className="w-full h-full object-cover" 
                      />
                      {!char.videoAvatar && <div className="text-4xl absolute">😎</div>}
                    </div>
                    <div className="p-4 w-full text-center">
                      <span className="block text-sm font-black uppercase tracking-widest mb-1">{char.name}</span>
                      <span className="block text-[10px] text-amber-500 font-bold uppercase tracking-widest">CP: {calculateCP(char as any).toLocaleString()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
