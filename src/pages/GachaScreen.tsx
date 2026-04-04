import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGameStore, GachaResult } from "@/stores/gameStore";
import { ChevronLeft } from "lucide-react";

export default function GachaScreen() {
  const navigate = useNavigate();
  const { currency, rollGacha, pityCounter, gachaResults, clearGachaResults } = useGameStore();
  const [displayedResults, setDisplayedResults] = useState<GachaResult[]>([]);
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
    } catch(e) {
      // Ignore if audiocontext fails
    }
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
        
        if (currentItem.type === 'character' || (currentItem.item as any).rarity === 'gold' || (currentItem.item as any).rarity === 'red' || (currentItem.item as any).rarity === 'rainbow') {
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
    rollGacha(count);
  };

  return (
    <div className="w-full h-screen overflow-hidden relative bg-black font-sans text-white">
      <video autoPlay loop muted playsInline className="absolute w-full h-full object-cover z-0">
        <source src="/videos/banner-ulti.mp4" type="video/mp4" />
      </video>

      <div className="absolute top-0 left-0 w-full p-6 z-10 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/80 to-transparent">
        <Button variant="ghost" onClick={() => navigate('/')} className="text-white hover:bg-white/20">
          <ChevronLeft className="mr-2 w-6 h-6" /> Back to Main Menu
        </Button>
        <div className="bg-black/50 border border-amber-500/50 px-4 py-2 rounded-full">
          KC Bẩm sinh: <span className="text-amber-400 font-black">{currency}</span>
        </div>
      </div>

      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 text-center">
        <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] border-b-4 border-amber-500/50 pb-2">
          SABER BANNER
        </h1>
        <p className="mt-2 text-xl font-bold bg-black/60 px-4 py-1 rounded-full inline-block border border-white/10">
          Pity Counter: <span className="text-amber-400">{pityCounter}/50</span>
        </p>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-8 z-10">
        <Button disabled={isRevealing} onClick={() => handleRoll(1)} className="w-48 h-16 text-xl bg-gradient-to-b from-blue-600 to-blue-900 border-2 border-blue-400">
          Roll x1 (100 KC)
        </Button>
        <Button disabled={isRevealing} onClick={() => handleRoll(10)} className="w-48 h-16 text-xl bg-gradient-to-b from-amber-500 to-red-700 border-2 border-amber-300">
          Roll x10 (1000 KC)
        </Button>
      </div>

      {gachaResults && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
          <div className="w-full max-w-4xl p-8">
            <h2 className="text-4xl font-black text-center text-amber-500 mb-8 drop-shadow-lg">Gacha Results</h2>
            <div className="grid grid-cols-5 gap-4">
              {displayedResults.map((res, i) => (
                res && (
                  <div key={i} className={`h-36 rounded-lg border-2 flex flex-col items-center justify-center bg-zinc-900 animate-in zoom-in duration-300 ${res.type === 'character' ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]' : 'border-zinc-500'}`}>
                    {res.type === 'character' ? (
                      <>
                        <div className="w-12 h-12 mb-2 rounded-full overflow-hidden border-2 border-amber-500">
                          {res.item.id === 'saber' ? <img src="/videos/saber-avatar.gif" className="w-full h-full object-cover" /> : null}
                        </div>
                        <span className="font-bold text-amber-400 text-center leading-tight">Mảnh {res.item.name}</span>
                        <span className="text-xs text-white/50 mt-1">x10</span>
                      </>
                    ) : (
                      <>
                        <div className={`w-12 h-12 mb-2 rounded-full border border-white/20 ${
                          (res.item as any).rarity === 'rainbow' ? 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500 shadow-[0_0_15px_pink]' :
                          (res.item as any).rarity === 'red' ? 'bg-red-500 shadow-[0_0_10px_red]' :
                          (res.item as any).rarity === 'gold' ? 'bg-amber-500 shadow-[0_0_10px_orange]' :
                          (res.item as any).rarity === 'purple' ? 'bg-purple-500' :
                          (res.item as any).rarity === 'blue' ? 'bg-blue-500' : 'bg-white'
                        }`} />
                        <span className="text-xs font-bold w-full text-center truncate px-1">{(res.item as any).name}</span>
                        <span className="text-[10px] text-zinc-400 mt-1 uppercase">{(res.item as any).rarity}</span>
                      </>
                    )}
                  </div>
                )
              ))}
            </div>
            
            <div className={`mt-12 text-center transition-opacity duration-300 ${isRevealing ? 'opacity-0' : 'opacity-100'}`}>
              <Button onClick={clearGachaResults} size="lg" className="w-64 font-bold tracking-widest text-lg">Xác Nhận</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
