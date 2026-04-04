import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const MODES = [
  {
    key: 'pve',
    route: '/pve',
    label: 'Campaign',
    sub: 'Story PvE',
    desc: 'Vượt ải · Hạ Boss · Nhận KC & Genesis Cores',
    accent: 'amber',
    borderHover: 'hover:border-amber-500/60',
    labelColor: 'text-amber-400',
    glowColor: 'shadow-[0_0_40px_rgba(245,158,11,0.07)]',
    barColor: 'bg-amber-500',
    tag: 'PvE',
  },
  {
    key: 'private',
    route: '/pvp-private',
    label: 'Private',
    sub: 'Phòng Kín',
    desc: 'Thách đấu bạn bè · Mã phòng 6 ký tự',
    accent: 'blue',
    borderHover: 'hover:border-blue-500/60',
    labelColor: 'text-blue-400',
    glowColor: 'shadow-[0_0_40px_rgba(59,130,246,0.07)]',
    barColor: 'bg-blue-500',
    tag: 'PvP',
  },
  {
    key: 'ranked',
    route: '/pvp-ranked',
    label: 'Ranked',
    sub: 'Đấu Hạng',
    desc: 'Matchmaking toàn server · Mùa giải xếp hạng',
    accent: 'red',
    borderHover: 'hover:border-red-500/60',
    labelColor: 'text-red-400',
    glowColor: 'shadow-[0_0_40px_rgba(239,68,68,0.07)]',
    barColor: 'bg-red-500',
    tag: 'Rank',
  },
];

export default function BattleMenu() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen bg-black text-white font-sans overflow-hidden relative flex flex-col">

      {/* Subtle grid background */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Header */}
      <div className="relative z-10 pt-10 px-12 flex items-center justify-between border-b border-white/5 pb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold"
        >
          <ChevronLeft className="w-4 h-4" />
          Main Menu
        </button>

        <div className="text-center">
          <h1 className="text-xs font-black uppercase tracking-[0.5em] text-zinc-500">
            Combat Zone
          </h1>
        </div>
        <div className="w-28" />
      </div>

      {/* Mode cards */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-12 pb-12">
        <div className="w-full max-w-5xl grid grid-cols-3 gap-6">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => navigate(m.route)}
              className={`group relative flex flex-col justify-between text-left h-72 border border-white/5 bg-zinc-950/60 backdrop-blur-sm p-8 transition-all duration-300 ${m.borderHover} ${m.glowColor} hover:bg-zinc-900/60`}
            >
              {/* Top accent bar */}
              <div className={`absolute top-0 left-0 w-0 h-px ${m.barColor} group-hover:w-full transition-all duration-500`} />

              {/* Tag */}
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-black tracking-[0.4em] uppercase ${m.labelColor} opacity-60`}>
                  {m.tag}
                </span>
              </div>

              {/* Center label */}
              <div className="flex-1 flex flex-col justify-center">
                <h2 className={`text-5xl font-black uppercase tracking-tight ${m.labelColor} transition-transform group-hover:translate-x-1 duration-300`}>
                  {m.label}
                </h2>
                <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1 font-bold">
                  {m.sub}
                </p>
              </div>

              {/* Desc */}
              <p className="text-zinc-600 text-sm leading-relaxed mt-4 group-hover:text-zinc-400 transition-colors">
                {m.desc}
              </p>

              {/* Bottom accent bar */}
              <div className={`absolute bottom-0 right-0 w-0 h-px ${m.barColor} group-hover:w-full transition-all duration-500`} />
            </button>
          ))}
        </div>
      </div>

      {/* Bottom ambient gradient */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-0 pointer-events-none" />
    </div>
  );
}
