import { useState, useEffect, useCallback } from 'react';
import { useGameStore, type GachaResult } from '@/stores/gameStore';
import { ArrowLeft, Diamond } from 'lucide-react';

const RARITY_BORDER: Record<string, string> = {
  white: 'border-muted-foreground/40',
  blue: 'border-blue-glow shadow-blue-glow',
  purple: 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]',
  gold: 'border-gold-bright shadow-gold',
};

export function GachaScreen() {
  const { currency, pityCounter, rollGacha, gachaResults, clearGachaResults, setCurrentScreen } = useGameStore();
  const [revealIndex, setRevealIndex] = useState(-1);
  const [isRevealing, setIsRevealing] = useState(false);

  const startReveal = useCallback((results: GachaResult[]) => {
    setIsRevealing(true);
    setRevealIndex(-1);
    let i = 0;
    const interval = setInterval(() => {
      setRevealIndex(i);
      i++;
      if (i >= results.length) {
        clearInterval(interval);
        setTimeout(() => setIsRevealing(false), 500);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (gachaResults && gachaResults.length > 0) {
      const cleanup = startReveal(gachaResults);
      return cleanup;
    }
  }, [gachaResults, startReveal]);

  const handleRoll = (count: 1 | 10) => {
    clearGachaResults();
    setRevealIndex(-1);
    rollGacha(count);
  };

  const getRarityColor = (result: GachaResult) => {
    if (result.type === 'character') return 'gold';
    return (result.item as any).rarity || 'white';
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Video Background */}
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src="/videos/banner-ulti.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-background/70 z-10" />

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => { clearGachaResults(); setCurrentScreen('main'); }}
            className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-display text-2xl text-gold-bright tracking-[0.2em] drop-shadow-lg">
            SABER BANNER
          </h2>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-xs text-muted-foreground font-display">Pity: {pityCounter}/50</span>
            <div className="flex items-center gap-1.5 bg-secondary/80 rounded-full px-3 py-1.5 border border-gold/30">
              <Diamond className="w-4 h-4 text-gold-bright fill-gold/30" />
              <span className="font-display text-gold-bright font-bold">{currency.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 flex items-center justify-center px-4">
          {gachaResults && gachaResults.length > 0 ? (
            <div className="grid grid-cols-5 gap-3 max-w-2xl">
              {gachaResults.map((result, i) => {
                const revealed = i <= revealIndex;
                const rarity = getRarityColor(result);
                return (
                  <div
                    key={i}
                    className={`
                      relative w-20 h-24 sm:w-24 sm:h-28 rounded-xl border-2 flex flex-col items-center justify-center
                      transition-all duration-300 transform
                      ${revealed
                        ? `${RARITY_BORDER[rarity]} bg-card/90 scale-100 opacity-100`
                        : 'border-border/30 bg-secondary/20 scale-90 opacity-30'
                      }
                    `}
                  >
                    {revealed ? (
                      <>
                        {result.type === 'character' ? (
                          <>
                            <span className="text-2xl">⭐</span>
                            <span className="text-[10px] font-display text-gold-bright text-center mt-1">
                              {(result.item as any).name}
                            </span>
                            {result.isDuplicate && (
                              <span className="text-[8px] text-muted-foreground">+10 mảnh</span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-xl">
                              {{'shoes':'👟','hat':'🎩','armor':'🛡️','ring':'💍','belt':'🥋','artifact':'🔮'}[(result.item as any).type]}
                            </span>
                            <span className="text-[9px] font-display text-foreground text-center mt-1 px-1 truncate w-full">
                              {(result.item as any).name}
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="text-2xl opacity-20">?</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center">
              <p className="font-display text-gold/40 text-lg tracking-widest mb-2">Hãy quay ngay!</p>
            </div>
          )}
        </div>

        {/* Roll Buttons */}
        <div className="flex items-center justify-center gap-4 pb-8 px-4">
          <button
            onClick={() => handleRoll(1)}
            disabled={currency < 100 || isRevealing}
            className="gradient-gold text-primary-foreground font-display text-sm tracking-wider px-6 py-3 rounded-xl
              hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-gold"
          >
            ROLL x1 — 100 KC
          </button>
          <button
            onClick={() => handleRoll(10)}
            disabled={currency < 1000 || isRevealing}
            className="gradient-gold text-primary-foreground font-display text-sm tracking-wider px-6 py-3 rounded-xl
              hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-gold"
          >
            ROLL x10 — 1000 KC
          </button>
        </div>
      </div>
    </div>
  );
}
