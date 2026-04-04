import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, BrainCircuit, Star, ArrowUpCircle } from "lucide-react";
import { useGameStore, getCharacterTotalStats } from "@/stores/gameStore";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function CharacterScreen() {
  const navigate = useNavigate();
  const { characters, upgradeStars, inventory, equipItem, unequipItem } = useGameStore();
  
  // Use state or derived data
  const saber = characters.find((c) => c.id === 'saber') || characters[0];
  const maxWords = Math.min(4, Math.floor(saber.stars / 2) + 1); // 0-1 star = 1 word, 2-3 = 2, 4 = 3, 5-6 = 4. Wait, the prompt says: 0*: 1 word, 1*: 2 words, 3*: 3 words, 5*: 4 words. Let's make it simpler.
  const wordLimit = saber.stars === 0 ? 1 : saber.stars <= 2 ? 2 : saber.stars <= 4 ? 3 : 4; 

  const totalStats = getCharacterTotalStats(saber);

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Modal chọn trang bị
  const [equipSlot, setEquipSlot] = useState<any>(null);

  const nextCost = { 1: 20, 2: 40, 3: 50, 4: 80, 5: 100 }[saber.stars as 1|2|3|4|5] || null;

  const handleUpgradeStar = () => {
    if (!nextCost) return toast.info("Đã đạt mốc tối đa 6 Sao!");
    if (saber.shards < nextCost) return toast.error(`Không đủ mảnh (Cần ${nextCost}, đang có ${saber.shards})`);
    upgradeStars(saber.id);
    toast.success(`Nâng cấp thành công lên ${saber.stars + 1} Sao!`);
  };

  const mockAIGenesis = async (input: string) => {
    setIsGenerating(true);
    
    // Simulate delay
    await new Promise(r => setTimeout(r, 1500));

    const text = input.toLowerCase();
    let dmgMulti = 200;
    let heal = 0;
    let effect = 'none';
    let aoe = false;

    if (text.includes('fire') || text.includes('burn')) { effect = 'burn'; dmgMulti += 100; }
    if (text.includes('stun') || text.includes('freeze')) { effect = 'stun'; dmgMulti -= 50; }
    if (text.includes('heal') || text.includes('life')) { heal = 20; dmgMulti -= 100; }
    if (text.includes('all') || text.includes('aoe')) { aoe = true; dmgMulti -= 50; }
    if (text.includes('god') || text.includes('kill')) { dmgMulti += 300; heal = 0; } // limit overall power
    
    dmgMulti = Math.max(0, Math.min(600, dmgMulti)); // clamp 0-600

    const skillJson = {
      skillName: input || "Genesis Strike",
      damageMultiplier: dmgMulti,
      healPercentage: heal,
      statusEffect: effect,
      aoe: aoe
    };

    // Save to character state
    const currentChars = useGameStore.getState().characters;
    useGameStore.setState({
      characters: currentChars.map(c => 
        c.id === 'saber' ? { ...c, custom_skill_3: skillJson } : c
      )
    });

    toast.success(`Đã học kỹ năng: ${input}!`);
    setShowAIModal(false);
    setAiPrompt("");
    setIsGenerating(false);
  };

  const generateAHSkill = () => {
    if (!aiPrompt) return toast.error("Vui lòng nhập từ khóa.");
    const currentWords = aiPrompt.trim().split(/\s+/).length;
    if (currentWords > wordLimit) return toast.error(`Max ${wordLimit} từ cho cấp sao hiện tại.`);
    
    mockAIGenesis(aiPrompt);
  };

  const handleEquipSlot = (slot: string) => {
    setEquipSlot(slot);
  };

  const equipFromInventory = (item: any) => {
    equipItem(saber.id, equipSlot as any, item);
    setEquipSlot(null);
  };

  return (
    <div className="w-full h-screen overflow-hidden relative bg-black font-sans text-white">
      {/* Background */}
      <video autoPlay loop muted playsInline className="absolute w-full h-full object-cover z-0 opacity-80">
        <source src="/videos/banner-ulti.mp4" type="video/mp4" />
      </video>

      {/* Top Header - Using higher z-index and flex */}
      <div className="absolute top-0 left-0 w-full p-6 z-30 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <Button variant="ghost" onClick={() => navigate('/')} className="text-white hover:bg-white/20 pointer-events-auto">
          <ChevronLeft className="mr-2 w-6 h-6" /> Back to Main Menu
        </Button>
      </div>

      {/* Main Content Layout */}
      <div className="absolute inset-0 pt-24 pb-8 px-8 z-10 flex pointer-events-none">
        
        {/* Left Panel */}
        <div className="w-[450px] flex flex-col gap-6 bg-black/70 backdrop-blur-md p-6 rounded-2xl border border-white/10 shrink-0 pointer-events-auto overflow-y-auto">
          
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-500 shrink-0">
              <img src="/videos/saber-avatar.gif" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-black text-amber-400">{saber.name}</h2>
              <div className="flex text-yellow-500 text-lg">
                {"★".repeat(saber.stars)}{"☆".repeat(6 - saber.stars)}
              </div>
              <div className="text-sm text-zinc-400 mt-1">Shards: {saber.shards}/{nextCost || 'MAX'}</div>
            </div>
            <Button size="icon" variant="outline" className="bg-amber-600/20 border-amber-500/50 hover:bg-amber-600/50 text-amber-400" onClick={handleUpgradeStar}>
              <ArrowUpCircle />
            </Button>
          </div>

          {/* Stats */}
          <div className="bg-white/5 rounded-lg p-4 space-y-2 border border-white/5">
            <div className="flex justify-between"><span className="text-zinc-400">HP</span><span className="font-bold text-green-400">{totalStats.hp}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Speed</span><span className="font-bold text-blue-400">{totalStats.speed}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Armor</span><span className="font-bold text-purple-400">{totalStats.armor}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">DMG</span><span className="font-bold text-red-400">{totalStats.dmg}</span></div>
            
            <div className="mt-4 pt-4 border-t border-white/10">
              <span className="text-zinc-400 block text-xs mb-1">MOCK AI SKILL (SKILL 3)</span>
              <span className="font-bold text-amber-400">{(saber as any).custom_skill_3?.skillName || "Chưa có kỹ năng"}</span>
              {(saber as any).custom_skill_3 && (
                <div className="text-xs text-zinc-400 mt-1">
                  DMG: {(saber as any).custom_skill_3.damageMultiplier}% | HEAL: {(saber as any).custom_skill_3.healPercentage}% | AOE: {(saber as any).custom_skill_3.aoe ? 'Yes' : 'No'}
                </div>
              )}
            </div>
          </div>

          {/* 6-slot Equipment Grid */}
          <div>
            <h3 className="text-sm text-zinc-400 mb-2 uppercase tracking-wide">Equipment</h3>
            <div className="grid grid-cols-2 gap-3">
              {(['shoes', 'hat', 'armor', 'ring', 'belt', 'artifact'] as const).map((slot) => {
                const item = saber.equipment?.[slot];
                return (
                  <div key={slot} onClick={() => handleEquipSlot(slot)} className="bg-zinc-900 border border-white/20 h-16 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/10 relative">
                    {item ? (
                      <div className="flex flex-col items-center">
                        <span className={`text-xs font-bold text-${item.rarity === 'gold' ? 'amber' : item.rarity === 'purple' ? 'purple' : 'white'}-500`}>{item.name}</span>
                        <Button size="sm" variant="ghost" className="absolute top-0 right-0 h-4 w-4 p-0 text-red-500" onClick={(e) => { e.stopPropagation(); unequipItem(saber.id, slot); }}>x</Button>
                      </div>
                    ) : (
                      <span className="text-white/30 text-xs capitalize">{slot}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Button onClick={() => setShowAIModal(true)} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-6 text-lg border border-purple-400/50 shadow-[0_0_20px_rgba(147,51,234,0.3)]">
            <BrainCircuit className="w-5 h-5 mr-2" /> AI Genesis Ultimate
          </Button>

          <Button onClick={() => navigate('/abilities')} variant="outline" className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/20 py-6 text-lg">
            Xem Bộ Kỹ Năng (Abilities)
          </Button>
        </div>
      </div>

      {/* Equipment Select Modal */}
      {equipSlot && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 pointer-events-auto">
          <div className="bg-zinc-900 p-8 rounded-2xl w-[600px] h-[500px] flex flex-col">
            <h2 className="text-xl mb-4 font-bold">Chọn Trang Bị: {equipSlot}</h2>
            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 auto-rows-max">
              {inventory.filter(e => e.type === equipSlot).length === 0 ? (
                <div className="col-span-2 text-center text-zinc-500 mt-10">Túi trống</div>
              ) : (
                inventory.filter(e => e.type === equipSlot).map(item => (
                  <div key={item.id} onClick={() => equipFromInventory(item)} className="p-3 border border-zinc-700 bg-black rounded-lg cursor-pointer hover:border-amber-500">
                    <div className="font-bold">{item.name}</div>
                    <div className="text-xs text-green-400">DMG: {item.stats.dmg} | HP: {item.stats.hp}</div>
                  </div>
                ))
              )}
            </div>
            <Button className="mt-4" onClick={() => setEquipSlot(null)}>Đóng</Button>
          </div>
        </div>
      )}

      {/* AI Genesis Modal */}
      {showAIModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
          <div className="bg-zinc-900 border border-purple-500/50 p-8 rounded-2xl max-w-md w-full shadow-2xl relative">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">
              Genesis Core
            </h2>
            <p className="text-zinc-400 text-sm mb-6">
              Sử dụng 1 Genesis Core. Giới hạn hiện tại: {wordLimit} từ.
            </p>
            <Input 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="VD: Fire Heal"
              className="bg-black/50 border-purple-500/30 text-white mb-6 py-6 text-lg"
              autoFocus
            />
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setShowAIModal(false)} className="flex-1 hover:bg-white/10 text-black">Hủy</Button>
              <Button disabled={isGenerating} onClick={generateAHSkill} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white">
                {isGenerating ? "Hệ thống đang dịch..." : "Khai Sáng"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
