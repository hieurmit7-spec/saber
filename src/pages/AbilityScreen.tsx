import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Zap, Shield, Swords } from "lucide-react";
import { useHydratedCharacters } from "@/hooks/usePlayerData";

const SKILL_ICONS: Record<string, any> = {
  active: Swords,
  passive: Shield,
  ultimate: Zap,
};

const SKILL_COLORS: Record<string, string> = {
  active: 'border-blue-500/30 bg-blue-950/20',
  passive: 'border-emerald-500/30 bg-emerald-950/20',
  ultimate: 'border-amber-500/30 bg-amber-950/20',
};

const SKILL_ACCENT: Record<string, string> = {
  active: 'text-blue-400',
  passive: 'text-emerald-400',
  ultimate: 'text-amber-400',
};

export default function AbilityScreen() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('fern_user_id') || '';
  const { characters, isLoading } = useHydratedCharacters(userId);

  const [selectedCharId, setSelectedCharId] = useState('saber');
  const activeChar = characters.find(c => c.id === selectedCharId);

  if (isLoading) return (
    <div className="w-full h-screen bg-black flex items-center justify-center text-white tracking-widest uppercase text-sm">
      Loading Ability Archive...
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-black text-white font-sans overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-white/5 px-8 py-5 flex items-center justify-between">
        <button
          onClick={() => navigate('/character')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold"
        >
          <ChevronLeft className="w-4 h-4" /> Character Archive
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.4em] text-zinc-300">
          Ability Database
        </h1>
        <div className="w-32" />
      </div>

      <div className="max-w-5xl mx-auto px-8 py-12 flex gap-12">
        {/* Character Selector */}
        <div className="w-48 shrink-0">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-4 border-b border-white/5 pb-3">Chọn tướng</p>
          <div className="flex flex-col gap-1">
            {characters.filter(c => c.isUnlocked).map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCharId(c.id)}
                className={`text-left py-2 px-3 border-l-2 text-sm uppercase tracking-wider transition-all ${
                  selectedCharId === c.id
                    ? 'border-amber-500 text-white bg-white/5'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-white/20'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Ability Detail */}
        {activeChar ? (
          <div className="flex-1">
            {/* Hero Header */}
            <div className="flex items-end gap-6 mb-12 pb-8 border-b border-white/5">
              <div className="w-20 h-20 overflow-hidden shrink-0 border border-white/10">
                {activeChar.videoAvatar ? (
                  <img src={activeChar.videoAvatar} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600 font-black text-2xl uppercase">
                    {activeChar.name[0]}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-5xl font-black uppercase tracking-widest">{activeChar.name}</h2>
                <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest">{activeChar.class} · {activeChar.stars} Sao</p>
              </div>
            </div>

            {/* Core Skills */}
            <div className="flex flex-col gap-6 mb-8">
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Kỹ năng cơ bản</p>
              {activeChar.skills.map((skill) => {
                const Icon = SKILL_ICONS[skill.type] || Swords;
                return (
                  <div
                    key={skill.id}
                    className={`border p-6 relative overflow-hidden ${SKILL_COLORS[skill.type]}`}
                  >
                    {/* Type badge */}
                    <span className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest ${SKILL_ACCENT[skill.type]}`}>
                      {skill.type}
                    </span>

                    <div className="flex items-start gap-4">
                      <div className={`p-3 border ${SKILL_COLORS[skill.type]} shrink-0`}>
                        <Icon className={`w-5 h-5 ${SKILL_ACCENT[skill.type]}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-xl font-black uppercase tracking-wider mb-2 ${SKILL_ACCENT[skill.type]}`}>
                          {skill.name}
                        </h3>
                        <p className="text-zinc-300 leading-relaxed">{skill.description}</p>
                        {skill.cooldown > 0 && (
                          <div className="mt-4 inline-flex items-center gap-2 bg-black/40 px-3 py-1 border border-white/10">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Hồi chiêu:</span>
                            <span className="text-white font-bold text-sm">{skill.cooldown} lượt</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Genesis Custom Skill */}
            {(activeChar as any).custom_skill_3 && Object.keys((activeChar as any).custom_skill_3).length > 0 && (
              <div className="mt-8">
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-4">Genesis Custom Skill</p>
                <div className="border border-white/20 bg-white/5 p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest text-white/40">
                    AI-GENESIS
                  </span>
                  <h3 className="text-xl font-black uppercase tracking-wider text-white mb-6">
                    {(activeChar as any).custom_skill_3?.skillName || "Custom Skill"}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(activeChar as any).custom_skill_3?.damageMultiplier && (
                      <div className="bg-black/40 p-4 border border-red-500/20">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Damage Multiplier</div>
                        <div className="text-2xl font-black text-red-400">{(activeChar as any).custom_skill_3.damageMultiplier}%</div>
                      </div>
                    )}
                    {(activeChar as any).custom_skill_3?.healPercentage && (
                      <div className="bg-black/40 p-4 border border-emerald-500/20">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Heal %</div>
                        <div className="text-2xl font-black text-emerald-400">{(activeChar as any).custom_skill_3.healPercentage}%</div>
                      </div>
                    )}
                    {(activeChar as any).custom_skill_3?.statusEffect && (
                      <div className="bg-black/40 p-4 border border-amber-500/20">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Status Effect</div>
                        <div className="text-lg font-black text-amber-400 uppercase">{(activeChar as any).custom_skill_3.statusEffect}</div>
                      </div>
                    )}
                    {(activeChar as any).custom_skill_3?.aoe !== undefined && (
                      <div className="bg-black/40 p-4 border border-blue-500/20">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Target</div>
                        <div className="text-lg font-black text-blue-400">{(activeChar as any).custom_skill_3.aoe ? 'Toàn Cảnh' : 'Đơn Thể'}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-600 uppercase tracking-widest text-sm">
            Chọn nhân vật để xem kỹ năng
          </div>
        )}
      </div>
    </div>
  );
}
