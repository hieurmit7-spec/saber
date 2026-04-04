import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useGameStore } from "@/stores/gameStore";

export default function AbilityScreen() {
  const navigate = useNavigate();
  const characters = useGameStore((state) => state.characters);
  const saber = characters.find(c => c.id === 'saber');

  if (!saber) return null;

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-white p-8 relative overflow-y-auto">
      <Button variant="ghost" onClick={() => navigate('/character')} className="absolute top-6 left-6 text-white hover:bg-white/20">
        <ChevronLeft className="mr-2 w-6 h-6" /> Back to Character
      </Button>

      <div className="max-w-4xl mx-auto pt-16">
        <h1 className="text-4xl font-black text-amber-500 mb-8 border-b border-white/10 pb-4">Abilities: {saber.name}</h1>
        
        <div className="grid gap-6">
          {saber.skills.map((skill) => (
            <div key={skill.id} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-zinc-800 text-xs font-bold uppercase rounded-bl-lg">
                {skill.type}
              </div>
              <h2 className="text-2xl font-bold text-blue-400 mb-2">{skill.name}</h2>
              <p className="text-zinc-300 text-lg">{skill.description}</p>
              {skill.cooldown > 0 && (
                <div className="mt-4 inline-block bg-blue-900/30 text-blue-300 text-sm px-2 py-1 rounded">
                  Cooldown: {skill.cooldown} turns
                </div>
              )}
            </div>
          ))}

          {/* Render Mock AI Genesis Skill explicitly */}
          <div className="bg-zinc-900 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)] rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-purple-900 text-xs font-bold uppercase rounded-bl-lg text-white">
              CUSTOM SKILL
            </div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">
              {(saber as any).custom_skill_3?.skillName || "Mock AI Genesis Skill"}
            </h2>
            
            {(saber as any).custom_skill_3 ? (
              <div className="space-y-2 mt-4 text-lg">
                <div className="flex bg-black/50 p-2 rounded justify-between"><span className="text-zinc-400">Damage Multiplier:</span><span className="text-red-400 font-bold">{(saber as any).custom_skill_3.damageMultiplier}%</span></div>
                <div className="flex bg-black/50 p-2 rounded justify-between"><span className="text-zinc-400">Heal Percentage:</span><span className="text-green-400 font-bold">{(saber as any).custom_skill_3.healPercentage}%</span></div>
                <div className="flex bg-black/50 p-2 rounded justify-between"><span className="text-zinc-400">Status Effect:</span><span className="text-yellow-400 uppercase font-bold">{(saber as any).custom_skill_3.statusEffect}</span></div>
                <div className="flex bg-black/50 p-2 rounded justify-between"><span className="text-zinc-400">AOE Target:</span><span className="text-blue-400 font-bold">{(saber as any).custom_skill_3.aoe ? 'Toàn Buổi' : 'Đơn Mục Tiêu'}</span></div>
              </div>
            ) : (
              <p className="text-zinc-500 mt-2">Kỹ năng này chưa được thiết lập. Hãy quay lại bảng điều khiển Character để nhập từ khóa sáng tạo Kỹ năng bằng Genesis Core.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
