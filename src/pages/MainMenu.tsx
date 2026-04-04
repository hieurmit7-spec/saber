import { useNavigate } from "react-router-dom";
import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/button";
import { Calendar, Backpack, Star } from "lucide-react";

export default function MainMenu() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen overflow-hidden relative bg-black font-sans">
      {/* Background Video Flipped */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute w-full h-full object-cover z-0"
        style={{ transform: "scaleX(-1)" }}
      >
        <source src="/videos/spring-bg.mp4" type="video/mp4" />
      </video>

      {/* Top UI */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between z-10 pointer-events-none">
        
        {/* Top Left: Quest Tracker */}
        <div className="space-y-4 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10 max-w-xs shadow-lg">
            <h3 className="text-amber-400 font-bold mb-1 flex items-center gap-1">
              <Star className="w-4 h-4" /> Main Quest
            </h3>
            <p className="text-zinc-200 text-sm">Defeat 3 enemies in PvE</p>
            <div className="w-full bg-zinc-800 h-1.5 mt-2 rounded-full overflow-hidden">
              <div className="bg-amber-500 w-1/3 h-full" />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pointer-events-auto items-start">
          <Button variant="ghost" className="bg-black/50 text-white hover:bg-black/80 border border-white/10 shrink-0">
            <Calendar className="w-5 h-5" />
          </Button>
          <Button onClick={() => navigate('/bag')} variant="ghost" className="bg-black/50 text-white hover:bg-black/80 border border-white/10 shrink-0">
            <Backpack className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Main Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-6 z-10">
        <Button 
          size="lg" 
          onClick={() => navigate('/character')}
          className="h-16 px-8 rounded-full bg-gradient-to-t from-zinc-900 to-zinc-700 border-2 border-zinc-600 text-xl font-bold shadow-2xl hover:scale-105 transition-transform"
        >
          Character
        </Button>
        <Button 
          size="lg" 
          onClick={() => navigate('/battle')}
          className="h-16 px-8 rounded-full bg-gradient-to-t from-red-900 to-red-600 border-2 border-red-500 text-xl font-bold shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:scale-105 transition-transform"
        >
          Battle
        </Button>
        <Button 
          size="lg" 
          onClick={() => navigate('/gacha')}
          className="h-16 px-8 rounded-full bg-gradient-to-t from-amber-900 to-amber-600 border-2 border-amber-500 text-xl font-bold shadow-[0_0_20px_rgba(217,119,6,0.4)] hover:scale-105 transition-transform"
        >
          Gacha
        </Button>
      </div>
    </div>
  );
}
