import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/stores/gameStore";
import { ChevronLeft } from "lucide-react";

export default function GachaScreen() {
  const navigate = useNavigate();
  const { currency, rollGacha, pityCounter, gachaResults, clearGachaResults } = useGameStore();

  const handleRoll = (count: 1 | 10) => {
    rollGacha(count);
  };

  return (
    <div className="w-full h-screen overflow-hidden relative bg-black font-sans text-white">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute w-full h-full object-cover z-0"
      >
        <source src="/videos/banner-ulti.mp4" type="video/mp4" />
      </video>

      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full p-6 z-10 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/80 to-transparent">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')} 
          className="text-white hover:bg-white/20"
        >
          <ChevronLeft className="mr-2 w-6 h-6" /> Back
        </Button>
        <div className="bg-black/50 border border-amber-500/50 px-4 py-2 rounded-full">
          KC Bẩm sinh: <span className="text-amber-400 font-black">{currency}</span>
        </div>
      </div>

      {/* Banner Title */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 text-center">
        <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] border-b-4 border-amber-500/50 pb-2">
          SABER BANNER
        </h1>
        <p className="mt-2 text-xl font-bold bg-black/60 px-4 py-1 rounded-full inline-block border border-white/10">
          Pity Counter: <span className="text-amber-400">{pityCounter}/50</span>
        </p>
      </div>

      {/* Roll Buttons */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-8 z-10">
        <Button 
          onClick={() => handleRoll(1)}
          className="w-48 h-16 text-xl tracking-wider font-bold bg-gradient-to-b from-blue-600 to-blue-900 border-2 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:scale-105"
        >
          Roll x1 (100 KC)
        </Button>
        <Button 
          onClick={() => handleRoll(10)}
          className="w-48 h-16 text-xl tracking-wider font-bold bg-gradient-to-b from-amber-500 to-red-700 border-2 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:scale-105"
        >
          Roll x10 (1000 KC)
        </Button>
      </div>

      {/* Gacha Results Modal Overlay */}
      {gachaResults && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-4xl p-8">
            <h2 className="text-4xl font-black text-center text-amber-500 mb-8 drop-shadow-lg">Gacha Results</h2>
            <div className="grid grid-cols-5 gap-4">
              {gachaResults.map((res, i) => (
                <div key={i} className={`h-32 rounded-lg border-2 flex flex-col items-center justify-center bg-zinc-900 ${res.type === 'character' ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]' : 'border-zinc-500'}`}>
                  {res.type === 'character' ? (
                    <>
                      <Star className="w-8 h-8 text-amber-500 mb-2" />
                      <span className="font-bold text-amber-400">{res.item.name}</span>
                    </>
                  ) : (
                    <>
                      <div className={`w-8 h-8 mb-2 rounded-full ${
                        (res.item as any).rarity === 'rainbow' ? 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500' :
                        (res.item as any).rarity === 'red' ? 'bg-red-500' :
                        (res.item as any).rarity === 'gold' ? 'bg-amber-500' :
                        (res.item as any).rarity === 'purple' ? 'bg-purple-500' :
                        (res.item as any).rarity === 'blue' ? 'bg-blue-500' : 'bg-white'
                      }`} />
                      <span className="text-xs text-zinc-400">{(res.item as any).rarity.toUpperCase()} EQ</span>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Button onClick={clearGachaResults} size="lg" className="w-64 font-bold">Thoát</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Temporary icon component since we are using lucide-react elsewhere
function Star(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
