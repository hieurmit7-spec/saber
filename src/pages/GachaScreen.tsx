import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { usePlayer, useRollGacha } from "@/hooks/usePlayerData";
import { performGachaRolls } from "@/lib/gachaLogic";
import { toast } from "sonner";

export default function GachaScreen() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('fern_user_id') || '';
  
  const { data: player } = usePlayer(userId);
  const { mutate: callGachaRPC } = useRollGacha(userId);

  // Local Pity Counter (Could be synced to DB, but keep local for demo)
  const [pityCounter, setPityCounter] = useState(0);

  const [gachaResults, setGachaResults] = useState<any[] | null>(null);
  const [displayedResults, setDisplayedResults] = useState<any[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);

  const playSFX = (type: 'roll' | 'gold' | 'rainbow') => {
    try {
      const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.connect(gain);
      gain.connect(actx.destination);
      
      if (type === 'roll') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, actx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, actx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, actx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.1);
        osc.start();
        osc.stop(actx.currentTime + 0.1);
      } else if (type === 'gold' || type === 'rainbow') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, actx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, actx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, actx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.3);
        osc.start();
        osc.stop(actx.currentTime + 0.3);
      }
    } catch(e) {}
  };

  useEffect(() => {
    if (gachaResults && gachaResults.length > 0) {
      setIsRevealing(true);
      setDisplayedResults([]);
      let i = 0;
      const interval = setInterval(() => {
        const currentItem = gachaResults[i];
        if (!currentItem) {
          clearInterval(interval);
          setIsRevealing(false);
          return;
        }

        setDisplayedResults(prev => [...prev, currentItem]);
        
        if (currentItem.type === 'character' || currentItem.item.rarity === 'gold' || currentItem.item.rarity === 'red' || currentItem.item.rarity === 'rainbow') {
          playSFX('rainbow');
        } else {
          playSFX('roll');
        }

        i++;
        if (i >= gachaResults.length) {
          clearInterval(interval);
          setIsRevealing(false);
        }
      }, 300);
      return () => clearInterval(interval);
    } else {
      setDisplayedResults([]);
      setIsRevealing(false);
    }
  }, [gachaResults]);

  const handleRoll = (count: 1 | 10) => {
    if (isRevealing) return;
    const cost = count * 100;
    if (!player || player.kc_balance < cost) {
      toast.error('Không đủ kim cương!');
      return;
    }

    const { equipments, shards, results, newPity } = performGachaRolls(count, pityCounter);
    setPityCounter(newPity);
    setGachaResults(results);

    // 🔥 XÓA ZUSTAND & ĐẨY THẲNG LÊN SUPABASE RPC 🔥
    callGachaRPC({
      cost,
      equipments,
      shards
    });
  };

  const clearGachaResults = () => {
    setGachaResults(null);
  };

  return (
    <div className="w-full h-screen overflow-hidden relative bg-black font-sans text-white border border-transparent">
      <video autoPlay loop muted playsInline className="absolute w-full h-full object-cover z-0">
        <source src="/videos/banner-ulti.mp4" type="video/mp4" />
      </video>

      <div className="absolute top-0 left-0 w-full p-8 z-10 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/80 to-transparent">
        <Button variant="ghost" onClick={() => navigate('/')} className="text-white hover:bg-white/20 uppercase tracking-widest text-xs font-bold ring-1 ring-white/10">
          <ChevronLeft className="mr-2 w-4 h-4" /> TRỞ VỀ TRUNG TÂM
        </Button>
        <div className="bg-black/40 backdrop-blur-md px-6 py-2 border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex items-center gap-2">
          <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Ngân Quỹ Cốt Lõi:</span>
          <span className="text-amber-400 font-black text-xl">{player?.kc_balance?.toLocaleString() || 0}</span>
        </div>
      </div>

      <div className="absolute top-32 left-1/2 -translate-x-1/2 z-10 text-center w-full max-w-4xl">
        <h1 className="text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-amber-100 via-amber-400 to-amber-700 drop-shadow-2xl">
          SABER ARCHIVE
        </h1>
        <p className="mt-4 text-sm font-bold bg-black/40 backdrop-blur-md px-6 py-2 inline-flex border border-white/10 shadow-lg items-center gap-2">
          PITY RATE: <span className="text-amber-400 text-xl">{pityCounter}/50</span>
        </p>
      </div>

      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-8 z-10">
        <button disabled={isRevealing} onClick={() => handleRoll(1)} className="group relative w-64 h-20 bg-zinc-950/80 backdrop-blur border border-white/5 hover:border-blue-500/50 overflow-hidden flex flex-col items-center justify-center transition-all ring-1 ring-white/5 disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="font-black text-2xl uppercase tracking-wider text-blue-400 transition-colors drop-shadow-md">Roll x1</span>
          <span className="text-sm font-medium text-white/50 tracking-widest">100 KC</span>
        </button>

        <button disabled={isRevealing} onClick={() => handleRoll(10)} className="group relative w-64 h-20 bg-zinc-950/80 backdrop-blur border border-white/5 hover:border-amber-500/50 overflow-hidden flex flex-col items-center justify-center transition-all ring-1 ring-white/5 disabled:opacity-50 disabled:cursor-not-allowed">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
          <span className="font-black text-2xl uppercase tracking-wider text-amber-500 transition-colors drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">Roll x10</span>
          <span className="text-sm font-medium text-white/50 tracking-widest">1000 KC</span>
        </button>
      </div>

      {gachaResults && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl">
          <div className="w-full max-w-5xl p-8">
            <h2 className="text-5xl font-black text-center text-white mb-12 tracking-widest uppercase origin-bottom animate-in slide-in-from-bottom-5 fade-in duration-700">Protocol Results</h2>
            <div className="grid grid-cols-5 gap-6">
              {displayedResults.map((res, i) => (
                res && (
                  <div key={i} className={`h-40 rounded border flex flex-col items-center justify-center bg-zinc-950/50 backdrop-blur animate-in zoom-in duration-300 ${res.type === 'character' ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'}`}>
                    {res.type === 'character' ? (
                      <>
                        <div className="w-16 h-16 mb-3 overflow-hidden border border-amber-500/50 p-1 bg-black">
                          {res.item.id === 'saber' ? <img src="/videos/saber-avatar.gif" className="w-full h-full object-cover blur-[0.5px] saturate-150" /> : null}
                        </div>
                        <span className="font-bold text-amber-500 text-center leading-none text-sm uppercase tracking-wider">{res.item.name}</span>
                      </>
                    ) : (
                      <>
                        <div className={`w-14 h-14 mb-3 shrink-0 ${
                          res.item.rarity === 'rainbow' ? 'bg-gradient-to-tr from-red-500 via-emerald-500 to-indigo-500 shadow-[0_0_20px_rgba(255,255,255,0.5)] animate-pulse' :
                          res.item.rarity === 'red' ? 'bg-red-600 shadow-[0_0_15px_red]' :
                          res.item.rarity === 'gold' ? 'bg-amber-500 shadow-[0_0_15px_orange]' :
                          res.item.rarity === 'purple' ? 'bg-purple-600' :
                          res.item.rarity === 'blue' ? 'bg-blue-600' : 'bg-zinc-300'
                        }`} />
                        <span className="text-xs font-bold text-center px-2 line-clamp-2 leading-tight uppercase tracking-widest text-zinc-300">{res.item.name}</span>
                      </>
                    )}
                  </div>
                )
              ))}
            </div>
            
            <div className={`mt-16 text-center transition-all duration-700 ${isRevealing ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
              <button onClick={clearGachaResults} className="border border-white/20 bg-transparent text-white px-12 py-4 font-bold tracking-[0.3em] uppercase hover:bg-white/10 transition-colors text-sm">
                XÁC NHẬN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
