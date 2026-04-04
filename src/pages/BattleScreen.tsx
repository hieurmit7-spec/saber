import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FastForward, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useHydratedCharacters } from "@/hooks/usePlayerData";

interface CombatEntity {
  id: string; baseId: string; name: string; isEnemy: boolean;
  maxHp: number; hp: number; speed: number; dmg: number; armor: number;
  heat: number;          // Saber = heat bar | Sasuke = chakra bar
  shield: number;        // Sasuke Susanoo shield
  izanagiUsed: boolean;  // Sasuke 6★ once-per-battle
  position: number; state: 'idle' | 'attacking' | 'dead';
  stars: number;
}

export default function BattleScreen({ mode }: { mode: 'pve' | 'private' | 'ranked' }) {
  const navigate = useNavigate();
  const userId = localStorage.getItem('fern_user_id') || '';
  const { characters: rawCharacters } = useHydratedCharacters(userId);
  const characters = rawCharacters.filter(c => c.isUnlocked);

  // App states
  const [phase, setPhase] = useState<'select_level' | 'matchmaking' | 'prep' | 'combat'>('prep');
  const [playerTeam, setPlayerTeam] = useState<(any | null)[]>([null, null, null, null, null]);
  const [selectedRosterId, setSelectedRosterId] = useState<string | null>(null);

  // Combat details
  const [combatants, setCombatants] = useState<CombatEntity[]>([]);
  const [turnOrder, setTurnOrder] = useState<string[]>([]);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [speedMult, setSpeedMult] = useState(1);
  const [isCastingUlt, setIsCastingUlt] = useState(false);
  const [activeUltCharacter, setActiveUltCharacter] = useState<'saber' | 'sasuke' | null>(null);
  const [ultText, setUltText] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const [activeAttacker, setActiveAttacker] = useState<{ id: string, attackerPos: number, targetPos: number, isEnemy: boolean, targetIsEnemy: boolean } | null>(null);
  const [slashTargetId, setSlashTargetId] = useState<string | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<{ id: string, targetId: string, dmg: number }[]>([]);

  // PvE
  const [pveLevel, setPveLevel] = useState(1);

  // PvP Private
  const [roomCode, setRoomCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [enemyReady, setEnemyReady] = useState(false);

  // PvP Ranked
  const [matchTime, setMatchTime] = useState(0);
  const [rankStars, setRankStars] = useState(0); // mock state, should be global store

  // Init Phase
  useEffect(() => {
    if (mode === 'pve') setPhase('select_level');
    else if (mode === 'private') setPhase('matchmaking');
    else if (mode === 'ranked') {
      setPhase('matchmaking');
      findRankedMatch();
    }
  }, [mode]);

  useEffect(() => {
    let t: any;
    if (phase === 'matchmaking' && mode === 'ranked') {
      t = setInterval(() => {
        setMatchTime(prev => {
          if (prev >= 120) {
            // Secret Bot Fallback Trigger
            clearInterval(t);
            setPhase('prep');
            toast.success("Đã tìm thấy đối thủ!");
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(t);
  }, [phase, mode]);

  const findRankedMatch = () => {
    // Giả lập đưa vào queue bằng supabase realtime (bỏ qua bước push db thật để tối giản cho phía client fallback bot)
    setPhase('matchmaking');
    setMatchTime(0);
  };

  const handleJoinPrivate = () => {
    if (roomCode.length !== 6) return toast.error("Mã phòng phải 6 ký tự!");
    setPhase('prep');
    setIsHost(false);
  };

  const handleCreatePrivate = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    setIsHost(true);
    setPhase('prep');
  };

  const selectPveLevel = (lvl: number) => {
    setPveLevel(lvl);
    setPhase('prep');
  };

  const handleSetupSlotClick = (index: number) => {
    if (selectedRosterId) {
      const char = characters.find(c => c.id === selectedRosterId);
      if (!char) return;
      const newTeam = [...playerTeam];
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

  const generateEnemyTeam = (): CombatEntity[] => {
    let mult = mode === 'pve' ? pveLevel : 5;
    const list: CombatEntity[] = [];

    if (mode === 'pve' && pveLevel === 7) {
      list.push({ id: 'e0', baseId: 'boss_dragon', name: 'Nhện Chú Vương', isEnemy: true, maxHp: 5000, hp: 5000, speed: 100, dmg: 400, armor: 1000, heat: 0, shield: 0, izanagiUsed: false, position: 2, state: 'idle', stars: 6 });
      return list;
    }
    list.push({ id: 'e1', baseId: 'goblin', name: 'Thích Khách', isEnemy: true, maxHp: 500 * mult, hp: 500 * mult, speed: 80, dmg: 100 * mult, armor: 200 * mult, heat: 0, shield: 0, izanagiUsed: false, position: 0, state: 'idle', stars: 1 });
    list.push({ id: 'e2', baseId: 'slime', name: 'Ma Vật', isEnemy: true, maxHp: 800 * mult, hp: 800 * mult, speed: 60, dmg: 80 * mult, armor: 300 * mult, heat: 0, shield: 0, izanagiUsed: false, position: 2, state: 'idle', stars: 1 });
    return list;
  };

  const startBattle = () => {
    if (!playerTeam.some(c => c !== null)) return toast.error("Cần ít nhất 1 tướng!");

    if (mode === 'private') {
      if (!isReady) {
        setIsReady(true);
        toast.info("Đang chờ đối thủ...");
        // Mock sync
        setTimeout(() => {
          setEnemyReady(true);
          launchCombat();
        }, 2000);
        return;
      }
    } else {
      launchCombat();
    }
  };

  const launchCombat = () => {
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
        heat: 0,       // Saber: heat | Sasuke: chakra
        shield: 0,     // Sasuke Susanoo Shield
        position: idx,
        state: 'idle',
        stars: c.stars,
        izanagiUsed: false, // Sasuke 6★ once-per-battle
      };
    }).filter(Boolean) as CombatEntity[];

    const enemies = generateEnemyTeam();
    const allCombatants = [...players, ...enemies];
    setTurnOrder([...allCombatants].sort((a, b) => b.speed - a.speed).map(c => c.id));
    setCombatants(allCombatants);
    setPhase('combat');
  };

  const executeTurn = () => {
    if (phase !== 'combat' || isCastingUlt || combatants.length === 0) return;

    const alivePlayers = combatants.filter(c => !c.isEnemy && c.hp > 0);
    const aliveEnemies = combatants.filter(c => c.isEnemy && c.hp > 0);

    if (alivePlayers.length === 0) {
      if (mode === 'ranked') toast.error('Thất bại! -1 Sao hạng.');
      else toast.error('Đội bạn đã bị tiêu diệt!');
      setTimeout(() => navigate('/battle'), 2000);
      return;
    }
    if (aliveEnemies.length === 0) {
      if (mode === 'pve') {
        const kcReward = pveLevel * 20;
        (async () => {
          const { data } = await (supabase as any).from('players').select('kc_balance').eq('id', userId).single();
          if (data) await (supabase as any).from('players').update({ kc_balance: data.kc_balance + kcReward }).eq('id', userId);
        })();
        toast.success(`Chiến Thắng PvE! Nhận ${kcReward} KC & 1 Genesis Core.`);
      } else if (mode === 'ranked') {
        toast.success('Chiến Thắng Xếp Hạng! +1 Sao hạng.');
      } else {
        toast.success('Chiến thắng phòng kín!');
      }
      setTimeout(() => navigate('/battle'), 3000);
      return;
    }

    const currentId = turnOrder[currentTurnIdx];
    const currentEntity = combatants.find(c => c.id === currentId);
    if (!currentEntity || currentEntity.hp <= 0) {
      setCurrentTurnIdx(p => (p + 1) % turnOrder.length);
      return;
    }

    const targets = currentEntity.isEnemy ? alivePlayers : aliveEnemies;
    const target = targets[Math.floor(Math.random() * targets.length)];

    // ── SABER ULTIMATE ──
    if (currentEntity.baseId === 'saber' && !currentEntity.isEnemy && currentEntity.heat >= 100) {
      setActiveUltCharacter('saber');
      setIsCastingUlt(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = false;
        videoRef.current.playbackRate = speedMult;
        videoRef.current.play();
      }
      return;
    }

    // ── SASUKE ULTIMATE ──
    if (currentEntity.baseId === 'sasuke' && !currentEntity.isEnemy && currentEntity.heat >= 100) {
      setActiveUltCharacter('sasuke');
      setIsCastingUlt(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = false;
        videoRef.current.playbackRate = speedMult;
        videoRef.current.play();
      }
      return;
    }

    // ── NORMAL ATTACK ──
    let baseDmg = currentEntity.dmg;
    let armorPiercing = 0; // fraction of enemy armor to ignore

    if (currentEntity.baseId === 'sasuke' && currentEntity.stars >= 2) {
      armorPiercing = 0.3; // Chidori 2★: ignore 30% armor
    }

    const effectiveArmor = target.armor * (1 - armorPiercing);
    // Chidori deals 250% ATK
    const dmgMultiplier = currentEntity.baseId === 'sasuke' ? 2.5 : 1.0;
    const finalDmg = Math.max(1, Math.floor(baseDmg * dmgMultiplier * (1 - effectiveArmor / (effectiveArmor + 1000))));

    // VFX 3-Step Sequence
    setActiveAttacker({
      id: currentEntity.id,
      attackerPos: currentEntity.position,
      targetPos: target.position,
      isEnemy: currentEntity.isEnemy,
      targetIsEnemy: target.isEnemy
    });

    setTimeout(() => {
      setSlashTargetId(target.id);
      setFloatingTexts(prev => [...prev, { id: Math.random().toString(), targetId: target.id, dmg: finalDmg }]);
      setTimeout(() => setSlashTargetId(null), 150);
    }, 200 / speedMult);

    setTimeout(() => {
      // Sasuke attacker: gain 20 Chakra from Chidori
      if (currentEntity.baseId === 'sasuke' && !currentEntity.isEnemy) {
        setCombatants(prev => prev.map(c => {
          if (c.id !== currentEntity.id) return c;
          return { ...c, heat: Math.min(100, c.heat + 20) };
        }));
      }
      // Saber attacker: gain heat from attack
      if (currentEntity.baseId === 'saber' && !currentEntity.isEnemy) {
        setCombatants(prev => prev.map(c => {
          if (c.id !== currentEntity.id) return c;
          const heatGain = 15;
          return { ...c, heat: Math.min(100, c.heat + heatGain) };
        }));
      }
      handleDamage(target.id, finalDmg, currentEntity);
      setActiveAttacker(null);
      setCurrentTurnIdx(p => (p + 1) % turnOrder.length);
    }, 500 / speedMult);
  };

  const handleDamage = (targetId: string, dmg: number, attacker?: any) => {
    setCombatants(prev => prev.map(c => {
      if (c.id !== targetId) return c;

      // ── SASUKE: Sharingan Dodge ──
      if (c.baseId === 'sasuke' && !c.isEnemy) {
        const dodgeRate = c.stars >= 6 ? 0.40 : c.stars >= 2 ? 0.30 : 0.20;
        if (Math.random() < dodgeRate) {
          // Dodge success! Gain 30 Chakra
          toast(`⚡ Sasuke né tránh! +30 Chakra`, { duration: 1200 });
          return { ...c, heat: Math.min(100, c.heat + 30) };
        }
      }

      // ── SASUKE: Susanoo Shield absorbs damage ──
      let remainingDmg = dmg;
      let newShield = c.shield || 0;
      if (c.baseId === 'sasuke' && newShield > 0) {
        const absorbed = Math.min(newShield, remainingDmg);
        newShield -= absorbed;
        remainingDmg -= absorbed;

        // Shield reflect 20% if 4★
        if (c.stars >= 4 && attacker && absorbed > 0) {
          const reflectDmg = Math.floor(absorbed * 0.2);
          setCombatants(prev2 => prev2.map(a => a.id === attacker.id ? { ...a, hp: Math.max(0, a.hp - reflectDmg) } : a));
          toast(`🛡 Susanoo phản chiêu! -${reflectDmg}`, { duration: 1200 });
        }
      }

      const newHp = Math.max(0, c.hp - remainingDmg);

      // ── SASUKE 6★ IZANAGI: Death defiance ──
      if (c.baseId === 'sasuke' && newHp === 0 && c.stars >= 6 && !c.izanagiUsed) {
        toast('⚡ IZANAGI — Sasuke viết lại thực tại!', { duration: 2000 });
        return { ...c, hp: Math.floor(c.maxHp * 0.5), shield: 0, izanagiUsed: true };
      }

      // ── SABER: heat gain when hit ──
      let newHeat = c.heat;
      if (c.baseId === 'saber' && newHp > 0) {
        const pctLost = (dmg / c.maxHp) * 100;
        const heatRates = [1.5, 1.5, 2.0, 2.0, 2.5, 2.5, 3.0];
        const rate = heatRates[Math.min(c.stars, 6)] || 1.5;
        newHeat = Math.min(100, c.heat + pctLost * rate);
      } else if (c.baseId === 'saber' && newHp === 0 && c.stars === 6 && c.heat !== -1) {
        return { ...c, hp: 1, heat: -1 };
      }

      return { ...c, hp: newHp, heat: newHeat, shield: newShield };
    }));
  };

  const finishUltimate = () => {
    setIsCastingUlt(false);
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.muted = true; }

    setCombatants(prev => {
      const nextState = [...prev];

      // ── SABER ULTIMATE: Excalibur ──
      const saber = nextState.find(c => c.baseId === 'saber' && !c.isEnemy);
      if (saber && activeUltCharacter === 'saber') {
        saber.heat = saber.heat === -1 ? -1 : 0;
        setUltText('⚔ EXCALIBUR!');
        setTimeout(() => setUltText(''), 2000);
        const dmgAmt = Math.floor(saber.dmg * 4);
        nextState.forEach(c => { if (c.isEnemy) c.hp = Math.max(0, c.hp - dmgAmt); });
      }

      // ── SASUKE ULTIMATE: Susanoo ──
      const sasuke = nextState.find(c => c.baseId === 'sasuke' && !c.isEnemy);
      if (sasuke && activeUltCharacter === 'sasuke') {
        sasuke.heat = 0;
        const multByStars = sasuke.stars >= 4 ? 4.5 : 3.5;
        const dmgAmt = Math.floor(sasuke.dmg * multByStars);
        nextState.forEach(c => { if (c.isEnemy) c.hp = Math.max(0, c.hp - dmgAmt); });

        // Grant Susanoo Shield = 40% max HP
        const shieldAmt = Math.floor(sasuke.maxHp * 0.4);
        sasuke.shield = shieldAmt;
        setUltText(`⚡ SUSANOO! Shield: ${shieldAmt}`);
        setTimeout(() => setUltText(''), 2500);
      }

      return nextState;
    });
    setActiveUltCharacter(null);
    setCurrentTurnIdx(p => (p + 1) % turnOrder.length);
  };

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (phase === 'combat' && !isCastingUlt) {
      t = setTimeout(executeTurn, 1000 / speedMult);
    }
    return () => clearTimeout(t);
  }, [currentTurnIdx, phase, isCastingUlt, combatants, speedMult]);

  // Phase Renders
  if (phase === 'select_level') return (
    <div className="w-full h-screen bg-zinc-950 text-white p-8 overflow-y-auto">
      <Button variant="ghost" onClick={() => navigate('/battle')}><ChevronLeft /> Back</Button>
      <h1 className="text-4xl text-amber-500 font-bold mb-8 mt-4 text-center">CAMPAIGN STORY</h1>
      <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
        {[1, 2, 3, 4, 5, 6, 7].map(lvl => (
          <div key={lvl} onClick={() => selectPveLevel(lvl)} className={`p-6 rounded-xl border-2 cursor-pointer transition-colors ${lvl === 7 ? 'border-red-500 bg-red-950/30 hover:bg-red-900/50' : 'border-amber-600 bg-black hover:bg-amber-900/40'}`}>
            <h2 className={`text-2xl font-black ${lvl === 7 ? 'text-red-500' : 'text-amber-400'}`}>Level {lvl} {lvl === 7 ? '(BOSS)' : ''}</h2>
            <p className="text-zinc-400">Reward: {lvl * 20} KC + 1 Genesis Core</p>
          </div>
        ))}
      </div>
    </div>
  );

  if (phase === 'matchmaking' && mode === 'private') return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
      <Button className="absolute top-4 left-4" variant="ghost" onClick={() => navigate('/battle')}><ChevronLeft /> Back</Button>
      <div className="bg-black p-8 rounded-xl border border-blue-500 w-[400px]">
        <h2 className="text-2xl font-bold mb-6 text-blue-400 text-center">PRIVATE MATCH</h2>
        <Button onClick={handleCreatePrivate} className="w-full mb-4 bg-blue-600">Tạo Phòng Mới</Button>
        <div className="flex gap-2">
          <Input placeholder="Nhập Code 6 số" value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} maxLength={6} className="bg-zinc-900" />
          <Button onClick={handleJoinPrivate}>Vào Căn Cứ</Button>
        </div>
      </div>
    </div>
  );

  if (phase === 'matchmaking' && mode === 'ranked') return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-zinc-950 text-white relative">
      <video autoPlay loop muted playsInline className="absolute w-full h-full object-cover opacity-20"><source src="/videos/spring-bg.mp4" /></video>
      <div className="z-10 text-center">
        <Loader2 className="w-16 h-16 animate-spin text-red-500 mx-auto mb-4" />
        <h2 className="text-4xl font-black text-red-400">Đang Trinh Sát Đối Thủ...</h2>
        <p className="text-xl mt-4 font-mono text-zinc-300">00:{(matchTime < 10 ? '0' : '')}{matchTime}</p>
        <p className="mt-8 mb-8 text-zinc-500">Hàng chờ Rank Đồng. (Bí mật: Hệ thống tự gọi hỗ trợ nếu kẹt mạng &gt; 120s)</p>
        <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/20" onClick={() => navigate('/battle')}>
          Hủy Tìm Trận
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen bg-zinc-950 font-sans text-white overflow-hidden relative">
      {/* HUD Prep/Combat */}
      {!isCastingUlt && (
        <div className="absolute top-4 left-4 z-20 flex gap-4">
          <Button variant="ghost" onClick={() => navigate('/battle')}><ChevronLeft /> Rút Lui</Button>
          {phase === 'combat' && <Button variant="outline" className="bg-black/50" onClick={() => setSpeedMult(m => m === 1 ? 3 : 1)}><FastForward /> x{speedMult}</Button>}
        </div>
      )}

      {phase === 'prep' ? (
        <div className="flex flex-col items-center justify-center h-full pt-16">
          <h1 className="text-3xl font-bold mb-8 text-amber-500" onClick={() => setPhase('combat')}>Chiến Tướng - {mode.toUpperCase()}</h1>
          <div className="flex gap-8 w-full max-w-5xl px-4">
            <div className="w-1/3 bg-zinc-900 border border-zinc-800 rounded-lg p-4 custom-scrollbar overflow-y-auto">
              <h3 className="text-zinc-400 mb-4 text-center">Quân Đoàn</h3>
              <div className="space-y-2">
                {characters.map(c => (
                  <div key={c.id} onClick={() => setSelectedRosterId(c.id)} className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer ${selectedRosterId === c.id ? 'bg-amber-600' : 'bg-zinc-800'}`}>
                    <div className="w-10 h-10 border rounded-full overflow-hidden bg-black/40">
                      <img 
                        src={c.id === 'sasuke' ? "/videos/sasuke.gif" : c.id === 'saber' ? "/videos/saber-avatar.gif" : ""} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div><div className="font-bold">{c.name}</div><div className="text-xs">Dmg: {c.baseStats.dmg} | {"★".repeat(c.stars)}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-2/3 flex flex-col items-center bg-zinc-900 border border-zinc-800 rounded-lg p-8 relative">
              {mode === 'private' && roomCode && <div className="absolute top-2 right-2 px-3 py-1 bg-blue-900 text-white rounded">Phòng: {roomCode}</div>}
              <div className="grid grid-cols-2 gap-4 w-64 mb-4">
                {[0, 1].map(i => <div key={i} onClick={() => handleSetupSlotClick(i)} className={`w-28 h-28 border-2 rounded-xl flex items-center justify-center cursor-pointer ${playerTeam[i] ? 'border-amber-500 bg-black/50' : selectedRosterId ? 'border-amber-500/50 bg-amber-500/10' : 'border-zinc-700'}`}>{playerTeam[i]?.name || 'Slot'}</div>)}
              </div>
              <div className="grid grid-cols-3 gap-4 w-96">
                {[2, 3, 4].map(i => <div key={i} onClick={() => handleSetupSlotClick(i)} className={`w-28 h-28 border-2 rounded-xl flex items-center justify-center cursor-pointer ${playerTeam[i] ? 'border-amber-500 bg-black/50' : selectedRosterId ? 'border-amber-500/50 bg-amber-500/10' : 'border-zinc-700'}`}>{playerTeam[i]?.name || 'Slot'}</div>)}
              </div>
              <Button size="lg" className="mt-8 bg-amber-600 w-64 text-lg" onClick={startBattle}>{isReady ? 'WAITING SYNC...' : 'KHÓA ĐỘI HÌNH'}</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center h-full pt-16 bg-[url('/battle-bg-placeholder.jpg')] bg-cover relative">
          {ultText && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-6xl font-black text-amber-500 animate-pulse drop-shadow-2xl">{ultText}</div>}
          <div className="w-full flex-1 flex flex-col items-center pb-8 gap-8">
            <CombatGrid row={[2, 3, 4]} combatants={combatants.filter(c => c.isEnemy)} activeAttacker={activeAttacker} slashTargetId={slashTargetId} floatingTexts={floatingTexts} />
            <CombatGrid row={[0, 1]} combatants={combatants.filter(c => c.isEnemy)} activeAttacker={activeAttacker} slashTargetId={slashTargetId} floatingTexts={floatingTexts} />
            <div className="w-full max-w-2xl h-1 bg-red-500/30 my-4" />
            <CombatGrid row={[0, 1]} combatants={combatants.filter(c => !c.isEnemy)} activeAttacker={activeAttacker} slashTargetId={slashTargetId} floatingTexts={floatingTexts} />
            <CombatGrid row={[2, 3, 4]} combatants={combatants.filter(c => !c.isEnemy)} activeAttacker={activeAttacker} slashTargetId={slashTargetId} floatingTexts={floatingTexts} />
          </div>
        </div>
      )}

      {/* Video Overlay Ultimates */}
      <div className={`absolute inset-0 z-50 bg-black transition-opacity duration-500 ${isCastingUlt ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <video 
          key={activeUltCharacter}
          ref={videoRef} 
          className="w-full h-full object-cover" 
          onEnded={finishUltimate}
        >
          <source 
            src={activeUltCharacter === 'sasuke' ? "/videos/sasuke ultimate.mp4" : "/videos/banner-ulti.mp4"} 
            type="video/mp4" 
          />
        </video>
      </div>
    </div>
  );
}

function CombatGrid({ row, combatants, activeAttacker, slashTargetId, floatingTexts }: { row: number[], combatants: CombatEntity[], activeAttacker: any, slashTargetId: any, floatingTexts: any[] }) {
  if (!combatants.some(c => row.includes(c.position))) return <div className="h-32" />;
  return (
    <div className={`flex gap-6 ${row.length === 2 ? 'w-80 justify-center' : 'w-full max-w-2xl justify-center'}`}>
      {row.map(pos => {
        const c = combatants.find(x => x.position === pos);
        if (!c) return <div key={pos} className="w-32 h-32 relative" />;
        const hpPct = Math.max(0, (c.hp / c.maxHp) * 100);
        
        const isAttacking = activeAttacker?.id === c.id;
        let transformStyle = {};
        if (isAttacking && activeAttacker) {
          const getP = (p: number, e: boolean) => ({
            x: p === 0 ? -1 : p === 1 ? 1 : p === 2 ? -2 : p === 3 ? 0 : 2,
            y: ((p === 0 || p === 1) ? 1 : 2) * (e ? -1 : 1)
          });
          const aPos = getP(activeAttacker.attackerPos, activeAttacker.isEnemy);
          const tPos = getP(activeAttacker.targetPos, activeAttacker.targetIsEnemy);
          const dx = (tPos.x - aPos.x) * 30;
          const dy = (tPos.y - aPos.y) * 50;
          transformStyle = { transform: `translate(${dx}px, ${dy}px)` };
        }
          
        const isHit = slashTargetId === c.id;
        // Step 2 Target Flash logic
        const flashClass = isHit ? 'brightness-200 sepia hue-rotate-[-50deg] saturate-[5]' : '';

        // Floating texts for this target
        const myTexts = floatingTexts.filter(ft => ft.targetId === c.id);

        return (
          <div key={c.id} style={transformStyle} className={`w-32 flex flex-col items-center relative transition-transform duration-200 z-${isAttacking ? 50 : 10} ${c.hp <= 0 ? 'opacity-30' : ''}`}>
            {myTexts.map(ft => (
              <div key={ft.id} className="absolute -top-12 left-1/2 -translate-x-1/2 text-red-500 font-black text-3xl drop-shadow-[0_2px_2px_rgba(0,0,0,1)] z-50 animate-in slide-in-from-bottom-5 fade-in duration-500 pointer-events-none">
                -{ft.dmg}
              </div>
            ))}
            
            <div className="flex items-center gap-1 mb-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${c.isEnemy ? 'text-red-500' : 'text-zinc-400'}`}>{c.name}</span>
              {c.shield > 0 && <span className="bg-blue-500 text-[8px] px-1 rounded-sm text-white font-bold">SHIELD</span>}
            </div>

            <div className={`w-24 h-24 rounded-lg bg-black border-2 transition-all duration-100 relative overflow-hidden flex items-center justify-center ${flashClass} ${c.shield > 0 ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'border-zinc-800'}`}>
              <img 
                src={c.baseId === 'sasuke' ? "/videos/sasuke.gif" : c.baseId === 'saber' ? "/videos/saber-avatar.gif" : ""} 
                className={`w-full h-full object-cover ${c.hp <= 0 ? 'grayscale' : ''}`} 
              />
              {!c.baseId.match(/saber|sasuke/) && <div className="text-4xl">{c.isEnemy ? '👹' : '😎'}</div>}
              
              {/* Susanoo Aura Overlay */}
              {c.baseId === 'sasuke' && c.shield > 0 && (
                <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none mix-blend-overlay" />
              )}

              {/* Slash VFX */}
              {isHit && (
                <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                  <div className="w-[150%] h-[4px] bg-gradient-to-r from-transparent via-white to-transparent rotate-45 shadow-[0_0_10px_yellow] opacity-100 animate-out fade-out duration-150" />
                </div>
              )}
            </div>
            
            {/* HP Bar */}
            <div className="w-full h-3 bg-zinc-900 mt-2 border relative border-zinc-800">
               {/* Base HP */}
              <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${hpPct}%` }} />
              {/* Susanoo Shield Overlay */}
              {c.shield > 0 && (
                <div 
                  className="absolute top-0 right-0 h-full bg-cyan-400 opacity-70 transition-all duration-300" 
                  style={{ width: `${Math.min(100, (c.shield / c.maxHp) * 100)}%` }} 
                />
              )}
            </div>

            {/* Energy Bar (Heat/Chakra) */}
            {(c.baseId === 'saber' || c.baseId === 'sasuke') && (
              <div className="w-full h-2 bg-black mt-1 border border-zinc-800">
                <div 
                  className={`h-full transition-all duration-500 ${c.baseId === 'sasuke' ? 'bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_5px_rgba(168,85,247,0.5)]' : 'bg-orange-500'}`} 
                  style={{ width: `${c.heat}%` }} 
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
