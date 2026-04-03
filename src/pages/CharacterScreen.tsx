import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, BrainCircuit } from "lucide-react";
import { useGameStore } from "@/stores/gameStore";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function CharacterScreen() {
  const navigate = useNavigate();
  const characters = useGameStore((s) => s.characters);
  const saber = characters.find((c) => c.id === 'saber') || characters[0];
  
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAHSkill = async () => {
    const key = localStorage.getItem('OPENAI_API_KEY');
    if (!key) return toast.error("Vui lòng thiết lập OpenAI API Key ở Menu chính trước!");
    if (!aiPrompt) return toast.error("Vui lòng nhập từ khóa để tạo kỹ năng.");

    const wordCount = aiPrompt.trim().split(/\s+/).length;
    const maxWords = saber.stars >= 2 ? 2 : 1;
    if (wordCount > maxWords) {
      return toast.error(`Với cấp ${saber.stars} Sao, bạn chỉ được nhập tối đa ${maxWords} từ.`);
    }

    setIsGenerating(true);
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { "role": "system", "content": "You are a game balancer for an RPG. Generate a balanced JSON object: { skillName: string, damageMultiplier: number (0 to 600), healPercentage: number (0 to 100), statusEffect: string (e.g., 'stun', 'burn', 'none'), aoe: boolean }. Rule: If damage is high, utility/heal must be low." },
            { "role": "user", "content": `Create ultimate skill with words: ${aiPrompt}. Format output strictly as JSON.` }
          ]
        })
      });
      const data = await response.json();
      const content = data.choices[0].message.content;
      // Trích xuất JSON từ chuỗi sinh ra
      const jsonStr = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
      const skillJson = JSON.parse(jsonStr);
      
      toast.success(`Đã học kỹ năng: ${skillJson.skillName}!`);
      console.log('New Skill:', skillJson);
      setShowAIModal(false);
      setAiPrompt("");
      // Ở đây lý tưởng sẽ lưu vào db, hiện tại để mock demo trên Console.
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi kết nối AI. Kiểm tra lại API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden relative bg-black font-sans text-white">
      {/* 
        CRITICAL RULE: Center area is completely empty of characters. 
        Video 3 as the full-screen background behind the UI panels. 
      */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute w-full h-full object-cover z-0 opacity-80"
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
          <ChevronLeft className="mr-2 w-6 h-6" /> Back to Main Menu
        </Button>
        <h1 className="text-3xl font-bold tracking-widest text-amber-500 uppercase drop-shadow-md">
          Character Details
        </h1>
        <div className="w-32" /> {/* Spacer */}
      </div>

      {/* Main Content Layout */}
      <div className="absolute inset-0 pt-24 pb-8 px-8 z-10 flex">
        
        {/* Left Panel: UI and small circular icon */}
        <div className="w-96 flex flex-col gap-6 bg-black/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shrink-0">
          
          {/* Circular Video Icon mapping to Video 2 */}
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] shrink-0">
              <img 
                src="/videos/saber-avatar.gif" 
                alt="Saber Avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <h2 className="text-3xl font-black text-amber-400">{saber.name}</h2>
              <div className="flex text-yellow-500 text-lg">
                {"★".repeat(saber.stars)}{"☆".repeat(6 - saber.stars)}
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 space-y-2 border border-white/5">
            <div className="flex justify-between">
              <span className="text-zinc-400">HP</span>
              <span className="font-bold">{saber.baseStats.hp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Speed</span>
              <span className="font-bold">{saber.baseStats.speed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Armor</span>
              <span className="font-bold">{saber.baseStats.armor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">DMG</span>
              <span className="font-bold">{saber.baseStats.dmg}</span>
            </div>
          </div>

          {/* 6-slot Equipment Grid */}
          <div className="mt-2">
            <h3 className="text-sm text-zinc-400 mb-2 uppercase tracking-wide">Equipment</h3>
            <div className="grid grid-cols-2 gap-3">
              {[0,1,2,3,4,5].map((idx) => (
                <div key={idx} className="bg-white/10 border border-white/20 h-14 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
                  <span className="text-white/30 text-xs">Slot {idx+1}</span>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={() => setShowAIModal(true)}
            className="w-full mt-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-6 text-lg tracking-wide border border-purple-400/50 shadow-[0_0_20px_rgba(147,51,234,0.3)]"
          >
            <BrainCircuit className="w-5 h-5 mr-2" />
            AI Genesis Ultimate
          </Button>

        </div>

        {/* Center area is intentionally empty to show the video */}
      </div>

      {/* AI Genesis Modal */}
      {showAIModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-purple-500/50 p-8 rounded-2xl max-w-md w-full shadow-2xl relative">
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">
              Genesis Core
            </h2>
            <p className="text-zinc-400 text-sm mb-6">
              Sử dụng 1 Genesis Core. Nhập các từ khóa để AI tạo kỹ năng mới cho Saber.
              (Giới hạn từ phụ thuộc cấp Sao của Saber).
            </p>
            <Input 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder='VD: "Fire Heal Stun"'
              className="bg-black/50 border-purple-500/30 text-white placeholder:text-zinc-600 mb-6 py-6 text-lg"
              autoFocus
            />
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                disabled={isGenerating} 
                onClick={() => setShowAIModal(false)}
                className="flex-1 border-white/20 hover:bg-white/10"
              >
                Hủy
              </Button>
              <Button 
                disabled={isGenerating}
                onClick={generateAHSkill}
                className="flex-1 bg-purple-600 hover:bg-purple-500"
              >
                {isGenerating ? "Đang Khởi Tạo..." : "Truyền Năng Lượng"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
