import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Swords, Globe, Users } from "lucide-react";

export default function BattleMenu() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen overflow-hidden relative bg-zinc-950 font-sans text-white p-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="text-white hover:bg-white/20">
          <ChevronLeft className="mr-2 w-6 h-6" /> Back to Main Menu
        </Button>
        <h1 className="text-4xl font-black tracking-widest text-red-500 uppercase">
          Select Game Mode
        </h1>
        <div className="w-32" />
      </div>

      {/* 3 Game Modes Grid */}
      <div className="grid grid-cols-3 gap-8 h-[70vh]">
        
        {/* STORY PvE */}
        <div 
          onClick={() => navigate('/pve')}
          className="group relative flex flex-col justify-end p-8 rounded-2xl border border-zinc-800 bg-black cursor-pointer overflow-hidden transition-all hover:scale-105 hover:border-amber-500 shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-amber-900/90 to-transparent z-10" />
          <img src="/videos/spring-bg.mp4" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-60 transition-opacity" />
          <div className="relative z-20">
            <Swords className="w-16 h-16 text-amber-500 mb-4" />
            <h2 className="text-4xl font-black text-amber-400 mb-2">STORY (PvE)</h2>
            <p className="text-zinc-300">Vượt ải, tiêu diệt Boss, cày Genesis Cores và KC.</p>
          </div>
        </div>

        {/* PRIVATE MATCH */}
        <div 
          onClick={() => navigate('/pvp-private')}
          className="group relative flex flex-col justify-end p-8 rounded-2xl border border-zinc-800 bg-black cursor-pointer overflow-hidden transition-all hover:scale-105 hover:border-blue-500 shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 to-transparent z-10" />
          <div className="relative z-20">
            <Users className="w-16 h-16 text-blue-500 mb-4" />
            <h2 className="text-4xl font-black text-blue-400 mb-2">PRIVATE MATCH</h2>
            <p className="text-zinc-300">Giao đấu trực tiếp với bạn bè qua Phòng Bí Mật (Mã Code 6 số).</p>
          </div>
        </div>

        {/* RANKED ARENA */}
        <div 
          onClick={() => navigate('/pvp-ranked')}
          className="group relative flex flex-col justify-end p-8 rounded-2xl border border-zinc-800 bg-black cursor-pointer overflow-hidden transition-all hover:scale-105 hover:border-red-500 shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-red-900/90 to-transparent z-10" />
          <div className="relative z-20">
            <Globe className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-4xl font-black text-red-400 mb-2">RANKED ARENA</h2>
            <p className="text-zinc-300">Leo Rank, Matchmaking toàn sever, săn thưởng mùa giải.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
