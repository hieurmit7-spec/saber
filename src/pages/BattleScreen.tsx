import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FastForward, Play, AlertCircle } from "lucide-react";
import { useGameStore, GameCharacter } from "@/stores/gameStore";
import { toast } from "sonner";

// Basic structure for a combat entity
interface CombatEntity {
  id: string; // unique field id
  baseId: string; // character id
  name: string;
  isEnemy: boolean;
  maxHp: number;
  hp: number;
  speed: number;
  dmg: number;
  armor: number;
  heat: number; // 0 to 100, specific to Saber
  position: number; // 0 to 4 (Front 0,1; Back 2,3,4)
  state: 'idle' | 'attacking' | 'hurt' | 'dead';
  stars: number;
  customSkill?: any;
}

const ENEMY_MOCK: CombatEntity[] = [
  { id: 'e1', baseId: 'slime', name: 'Slime', isEnemy: true, maxHp: 500, hp: 500, speed: 60, dmg: 100, armor: 100, heat: 0, position: 0, state: 'idle', stars: 1 },
  { id: 'e2', baseId: 'goblin', name: 'Goblin', isEnemy: true, maxHp: 800, hp: 800, speed: 75, dmg: 150, armor: 200, heat: 0, position: 2, state: 'idle', stars: 1 },
];

export default function BattleScreen() {
  const navigate = useNavigate();
  const characters = useGameStore((s) => s.characters);
  
  // Setup phase
  const [isSetup, setIsSetup] = useState(true);
  const [playerTeam, setPlayerTeam] = useState<(GameCharacter | null)[]>([null, null, null, null, null]);
  const [selectedRosterId, setSelectedRosterId] = useState<string | null>(null);

  // Combat State
  const [combatants, setCombatants] = useState<CombatEntity[]>([]);
  const [turnOrder, setTurnOrder] = useState<string[]>([]);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [speedMult, setSpeedMult] = useState(1);
  const [isCastingUlt, setIsCastingUlt] = useState(false);
  const [ultText, setUltText] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSetupSlotClick = (index: number) => {
    if (selectedRosterId) {
      const char = characters.find(c => c.id === selectedRosterId);
      if (!char) return;
      const newTeam = [...playerTeam];
      // remove char from other slot if exists
      const existingIdx = newTeam.findIndex(c => c?.id === selectedRosterId);
      if (existingIdx !== -1) newTeam[existingIdx] = null;
      newTeam[index] = char;
      setPlayerTeam(newTeam);
      setSelectedRosterId(null);
    } else {
      const newTeam = [...playerTeam];
      newTeam[index] = null;
      setPlayerTeam(newTeam);
    }
  };

  const startBattle = () => {
    if (!playerTeam.some(c => c !== null)) {
      return toast.error("Cần ít nhất 1 nhân vật ra trận!");
    }
    
    const players: CombatEntity[] = playerTeam.map((c, idx) => {
      if (!c) return null;
      return {
        id: `p_${idx}`,
        baseId: c.id,
        name: c.name,
        isEnemy: false,
        maxHp: c.baseStats.hp,
        hp: c.baseStats.hp,
        speed: c.baseStats.speed,
        dmg: c.baseStats.dmg,
        armor: c.baseStats.armor,
        heat: 0,
        position: idx,
        state: 'idle',
        stars: c.stars,
        customSkill: c.id === 'saber' ? (c as any).custom_skill_3 : undefined // Wait, custom_skill_3 should come from db, we will mock for now
      };
    }).filter(Boolean) as CombatEntity[];

    const allCombatants = [...players, ...ENEMY_MOCK];
    const initialTurnOrder = [...allCombatants].sort((a,b) => b.speed - a.speed).map(c => c.id);
    
    setCombatants(allCombatants);
    setTurnOrder(initialTurnOrder);
    setIsSetup(false);
  };

  const executeTurn = () => {
    if (isSetup || isCastingUlt || combatants.length === 0) return;
    
    // Check win/loss
    const alivePlayers = combatants.filter(c => !c.isEnemy && c.hp > 0);
    const aliveEnemies = combatants.filter(c => c.isEnemy && c.hp > 0);
    if (alivePlayers.length === 0) {
      toast.error("Thất bại!");
      navigate('/');
      return;
    }
    if (aliveEnemies.length === 0) {
      toast.success("Chiến thắng! +100 KC +1 Genesis Core");
      useGameStore.getState().addCurrency(100);
      navigate('/');
      return;
    }

    const currentId = turnOrder[currentTurnIdx];
    const currentEntity = combatants.find(c => c.id === currentId);
    if (!currentEntity || currentEntity.hp <= 0) {
      advanceTurn();
      return;
    }

    // Logic AI: Sẽ đánh ngẫu nhiên 1 mục tiêu phe địch
    const targets = currentEntity.isEnemy ? alivePlayers : aliveEnemies;
    const target = targets[Math.floor(Math.random() * targets.length)];

    // SABER ULTIMATE CHECK
    if (currentEntity.baseId === 'saber' && currentEntity.heat >= 100) {
      castAlberUltimate(currentEntity);
      return; // Turn ends inside ultimate logic
    }

    // Normal Attack (Skill 1 - 200 dmg for Saber, base dmg for others)
    const baseDamage = currentEntity.baseId === 'saber' ? 200 : currentEntity.dmg;
    // apply arbitrary armor mitigation
    const finalDmg = Math.max(1, Math.floor(baseDamage * (1 - (target.armor / (target.armor + 1000)))));

    // Apply Damage
    setTimeout(() => {
      handleDamage(target.id, finalDmg);
      advanceTurn();
    }, 1000 / speedMult);
  };

  const advanceTurn = () => {
    setCurrentTurnIdx((prev) => (prev + 1) % turnOrder.length);
  };

  const handleDamage = (targetId: string, dmg: number) => {
    setCombatants(prev => prev.map(c => {
      if (c.id !== targetId) return c;
      const newHp = Math.max(0, c.hp - dmg);
      let newHeat = c.heat;
      if (c.baseId === 'saber') {
        const hpLostPct = (dmg / c.maxHp) * 100;
        const heatMultiplier = c.stars >= 4 ? 2 : 1.5;
        newHeat = Math.min(100, c.heat + (hpLostPct * heatMultiplier));
      }
      return { ...c, hp: newHp, heat: newHeat };
    }));
  };

  const castAlberUltimate = (saberObj: CombatEntity) => {
    setIsCastingUlt(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = false; // "WITH SOUND"
      videoRef.current.play();
    }
  };

  const finishUltimate = () => {
    setIsCastingUlt(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.muted = true;
    }

    setCombatants(prev => {
      const saber = prev.find(c => c.baseId === 'saber' && !c.isEnemy);
      if (!saber) return prev;
      
      let nextState = [...prev];
      
      // MOCK JSON APPLY: Ideally parsed from `saber.customSkill`
      // Assuming { skillName: "Fire Heal", damageMultiplier: 300, healPercentage: 20, aoe: true }
      const mockCustomSkill = {
        skillName: 'Genesis AI: Fire Slash',
        damageMultiplier: 250,
        healPercentage: 10,
        aoe: false
      };

      setUltText(`Saber casted ${mockCustomSkill.skillName}!`);
      setTimeout(() => setUltText(""), 2000);

      // Reset Heat
      nextState = nextState.map(c => c.baseId === 'saber' ? { ...c, heat: 0 } : c);

      // Heal
      if (mockCustomSkill.healPercentage) {
        const healAmt = (saber.maxHp * mockCustomSkill.healPercentage) / 100;
        nextState = nextState.map(c => c.id === saber.id ? { ...c, hp: Math.min(c.maxHp, c.hp + healAmt) } : c);
      }

      // Dmg
      const dmgAmt = (saber.dmg * mockCustomSkill.damageMultiplier) / 100;
      if (mockCustomSkill.aoe) {
        nextState = nextState.map(c => c.isEnemy ? { ...c, hp: Math.max(0, c.hp - dmgAmt) } : c);
      } else {
        const aliveEnemies = nextState.filter(c => c.isEnemy && c.hp > 0);
        if (aliveEnemies.length > 0) {
          const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
          nextState = nextState.map(c => c.id === target.id ? { ...c, hp: Math.max(0, c.hp - dmgAmt) } : c);
        }
      }

      return nextState;
    });

    advanceTurn();
  };

  // Run turn loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isSetup && !isCastingUlt) {
      timer = setTimeout(() => {
        executeTurn();
      }, 1000 / speedMult);
    }
    return () => clearTimeout(timer);
  }, [currentTurnIdx, isSetup, isCastingUlt, speedMult, combatants]);


  return (
    <div className="w-full h-screen bg-zinc-950 font-sans text-white overflow-hidden relative">
      {!isSetup && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <Button 
            variant="outline" 
            className="bg-black/50 border-white/20"
            onClick={() => setSpeedMult(m => m === 1 ? 3 : 1)}
          >
            <FastForward className="mr-2" /> x{speedMult}
          </Button>
        </div>
      )}

      <div className="absolute top-4 left-4 z-20">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ChevronLeft /> Bỏ Cuộc
        </Button>
      </div>

      {isSetup ? (
        // SETUP SCREEN
        <div className="flex flex-col items-center justify-center h-full pt-16">
          <h1 className="text-3xl font-bold mb-8 text-amber-500">Chuẩn Bị Giao Tranh</h1>
          
          <div className="flex gap-8 w-full max-w-5xl px-4">
            {/* Roster Selection */}
            <div className="w-1/3 bg-zinc-900 border border-zinc-800 rounded-lg p-4 h-96 overflow-y-auto">
              <h3 className="text-zinc-400 mb-4 text-center">Danh Sách Tướng</h3>
              <div className="space-y-2">
                {characters.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => setSelectedRosterId(c.id)}
                    className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${selectedRosterId === c.id ? 'bg-amber-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                  >
                    <div className="w-10 h-10 bg-black rounded-full overflow-hidden border-2 border-amber-500">
                      {c.id === 'saber' && <img src="/videos/saber-avatar.gif" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <div className="font-bold">{c.name}</div>
                      <div className="text-xs text-zinc-300">HP: {c.baseStats.hp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid 5-slot */}
            <div className="w-2/3 flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 rounded-lg p-8 relative">
              <h3 className="absolute top-4 left-1/2 -translate-x-1/2 text-zinc-500">Đội Hình Của Bạn</h3>
              
              <div className="grid grid-cols-2 gap-4 w-64 mb-4">
                <GridSlot index={0} char={playerTeam[0]} onClick={handleSetupSlotClick} active={!!selectedRosterId} />
                <GridSlot index={1} char={playerTeam[1]} onClick={handleSetupSlotClick} active={!!selectedRosterId} />
              </div>
              <div className="grid grid-cols-3 gap-4 w-96">
                <GridSlot index={2} char={playerTeam[2]} onClick={handleSetupSlotClick} active={!!selectedRosterId} />
                <GridSlot index={3} char={playerTeam[3]} onClick={handleSetupSlotClick} active={!!selectedRosterId} />
                <GridSlot index={4} char={playerTeam[4]} onClick={handleSetupSlotClick} active={!!selectedRosterId} />
              </div>

              <Button size="lg" className="mt-8 bg-amber-600 hover:bg-amber-500 w-64 font-bold text-lg" onClick={startBattle}>
                <Play className="mr-2" /> XUẤT TRẬN
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // BATTLE ARENA SCREEN
        <div className="relative w-full h-full flex flex-col items-center bg-[url('/battle-bg-placeholder.jpg')] bg-cover bg-center">
          <div className="absolute inset-0 bg-black/40" />

          {ultText && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-5xl font-black text-amber-500 drop-shadow-[0_0_20px_rgba(0,0,0,1)] animate-pulse">
              {ultText}
            </div>
          )}
          
          {/* Top vs Bottom Arena */}
          <div className="w-full max-w-4xl h-full flex flex-col relative z-10 pt-24 pb-12">
            
            {/* Enemy Grid (Top) */}
            <div className="flex-1 flex flex-col items-center justify-start gap-4">
              <CombatGrid row={[2,3,4]} combatants={combatants.filter(c => c.isEnemy)} />
              <CombatGrid row={[0,1]} combatants={combatants.filter(c => c.isEnemy)} />
            </div>

            {/* Divider */}
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent my-8" />

            {/* Player Grid (Bottom) */}
            <div className="flex-1 flex flex-col items-center justify-end gap-4">
              <CombatGrid row={[0,1]} combatants={combatants.filter(c => !c.isEnemy)} />
              <CombatGrid row={[2,3,4]} combatants={combatants.filter(c => !c.isEnemy)} />
            </div>

          </div>
        </div>
      )}

      {/* Ultimate Video Cutscene Overlay */}
      <div className={`absolute inset-0 z-50 bg-black transition-opacity duration-500 ${isCastingUlt ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          onEnded={finishUltimate}
        >
          <source src="/videos/banner-ulti.mp4" type="video/mp4" />
        </video>
      </div>

    </div>
  );
}

// Sub-components

function GridSlot({ index, char, onClick, active }: { index: number, char: GameCharacter|null, onClick: (i: number) => void, active: boolean }) {
  return (
    <div 
      onClick={() => onClick(index)}
      className={`w-28 h-28 border-2 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
        char ? 'border-amber-500 bg-black/50' : 
        active ? 'border-amber-500/50 border-dashed bg-amber-500/10 hover:bg-amber-500/20' : 'border-zinc-700 bg-zinc-800'
      }`}
    >
      {char ? (
        <div className="flex flex-col items-center">
          {char.id === 'saber' ? (
             <img src="/videos/saber-avatar.gif" className="w-12 h-12 rounded-full border-2 border-amber-500 mb-1" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-zinc-700 mb-1 border-2 border-zinc-500" />
          )}
          <span className="text-xs font-bold text-amber-500">{char.name}</span>
        </div>
      ) : (
        <span className="text-zinc-600 font-bold">Slot</span>
      )}
    </div>
  );
}

function CombatGrid({ row, combatants }: { row: number[], combatants: CombatEntity[] }) {
  if (!combatants.some(c => row.includes(c.position))) return <div className="h-28" />; // Placeholder spacing

  return (
    <div className={`flex gap-4 ${row.length === 2 ? 'w-64 justify-center' : 'w-96 justify-center'}`}>
      {row.map(pos => {
        const c = combatants.find(x => x.position === pos);
        if (!c) return <div key={pos} className="w-28 h-28" />;

        const isDead = c.hp <= 0;
        const hpPct = Math.max(0, (c.hp / c.maxHp) * 100);

        return (
          <div key={c.id} className={`w-28 flex flex-col items-center transition-all ${isDead ? 'opacity-20 saturate-0' : 'opacity-100 hover:scale-105'}`}>
            
            {/* Title / Info */}
            <span className={`text-xs font-bold mb-1 ${c.isEnemy ? 'text-red-400' : 'text-blue-400'}`}>
              {c.name}
            </span>

            {/* Avatar block */}
            <div className={`w-20 h-20 rounded-xl mb-2 flex items-center justify-center border-2 bg-zinc-800 shadow-xl ${
              c.isEnemy ? 'border-red-500/50' : 'border-blue-500/50'
            }`}>
              {c.baseId === 'saber' && !isDead ? (
                <img src="/videos/saber-avatar.gif" className="w-full h-full object-cover rounded-lg" />
              ) : (
                 <div className="text-2xl">{c.isEnemy ? '👹' : '😎'}</div>
              )}
            </div>

            {/* HP Bar */}
            <div className="w-full bg-zinc-800 h-2 rounded-sm overflow-hidden mb-1 border border-black relative">
              <div 
                className="h-full bg-red-600 transition-all duration-300" 
                style={{ width: `${hpPct}%` }}
              />
            </div>

            {/* HEAT BAR ONLY FOR SABER */}
            {c.baseId === 'saber' && (
              <div className="w-full bg-zinc-900 h-1.5 rounded-sm overflow-hidden border border-black relative shadow-[0_0_5px_rgba(234,88,12,0.5)]">
                <div 
                  className="h-full bg-orange-500 transition-all duration-300" 
                  style={{ width: `${c.heat}%`, boxShadow: c.heat >= 100 ? '0 0 10px #f97316' : 'none' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
