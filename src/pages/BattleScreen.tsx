import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FastForward, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useHydratedCharacters, usePlayer, useArenaOpponents } from "@/hooks/usePlayerData";

interface CombatEntity {
  id: string; baseId: string; name: string; isEnemy: boolean;
  maxHp: number; hp: number; speed: number; dmg: number; armor: number;
  heat: number;          // Saber = heat bar | Sasuke = chakra bar
  shield: number;        // Sasuke Susanoo shield
  izanagiUsed: boolean;  // Sasuke 6★ once-per-battle
  position: number; state: 'idle' | 'attacking' | 'dead';
  stars: number;
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
}

export default function BattleScreen({ mode }: { mode: 'pve' | 'private' | 'ranked' }) {
  const navigate = useNavigate();
  const userId = localStorage.getItem('fern_user_id') || '';
  const { data: player } = usePlayer(userId);
  const { characters: rawCharacters } = useHydratedCharacters(userId);
  const { data: arenaOpponents, isLoading: opponentsLoading } = useArenaOpponents(userId, player?.pvp_rank_level || 1);
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
  const [matchResult, setMatchResult] = useState<'victory' | 'defeat' | null>(null);

  // PvE
  const [pveLevel, setPveLevel] = useState(1);

  // PvP Private
  const [roomCode, setRoomCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [enemyReady, setEnemyReady] = useState(false);

  // PvP Ranked
  const [matchTime, setMatchTime] = useState(0);
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null); // For Async Arena
  const [rankedStarGain, setRankedStarGain] = useState(0); // +1 or +2 depending on opponent choice

  // Init playerTeam from player DB
  useEffect(() => {
    if (player && player.team_setup && Array.isArray(player.team_setup)) {
      const populatedTeam = player.team_setup.map(charId => charId ? rawCharacters.find(c => c.id === charId) || null : null);
      // Only set if not all null
      if (populatedTeam.some(c => c !== null)) {
        setPlayerTeam(populatedTeam);
      }
    }
  }, [player, rawCharacters]);

  // Init Phase
  useEffect(() => {
    if (mode === 'pve') setPhase('select_level');
    else if (mode === 'private') setPhase('matchmaking');
    else if (mode === 'ranked') {
      setPhase('matchmaking');
    }
  }, [mode]);

  const handleSelectOpponent = (opponent: any, isMiddle: boolean) => {
    setSelectedOpponent(opponent);
    setRankedStarGain(isMiddle ? 2 : 1);
    setPhase('prep');
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
    const list: CombatEntity[] = [];

    if (mode === 'ranked' && selectedOpponent && selectedOpponent.team_setup) {
      // Async Arena enemy generation
      selectedOpponent.team_setup.forEach((charId: string | null, idx: number) => {
        if (!charId) return;
        // Search in ALL_CHARS to get base stats. (Ideally we hydrate with opponent's equip, but base+stars is fine for MVP)
        const baseChar = rawCharacters.find(c => c.id === charId);
        if (baseChar) {
          // Approximate enemy stats based on their rank or CP
          const mult = selectedOpponent.pvp_rank_level || 1;
          list.push({
            id: `e_${idx}`,
            baseId: baseChar.id,
            name: baseChar.name,
            isEnemy: true,
            maxHp: baseChar.baseStats.hp + (mult * 100),
            hp: baseChar.baseStats.hp + (mult * 100),
            speed: baseChar.baseStats.speed,
            dmg: baseChar.baseStats.dmg + (mult * 20),
            armor: baseChar.baseStats.armor + (mult * 50),
            heat: 0,
            shield: 0,
            izanagiUsed: false,
            position: idx,
            state: 'idle',
            stars: baseChar.stars,
            damageDealt: 0, damageTaken: 0, healingDone: 0
          });
        }
      });
      // Fallback if team empty:
      if (list.length === 0) {
        list.push({ id: 'e1', baseId: 'goblin', name: 'Thích Khách', isEnemy: true, maxHp: 1000, hp: 1000, speed: 80, dmg: 100, armor: 200, heat: 0, shield: 0, izanagiUsed: false, position: 2, state: 'idle', stars: 1, damageDealt: 0, damageTaken: 0, healingDone: 0 });
      }
      return list;
    }

    // PvE / Private modes
    let mult = mode === 'pve' ? pveLevel : 5;
    
    if (mode === 'pve' && pveLevel === 7) {
      list.push({ id: 'e0', baseId: 'boss_dragon', name: 'Nhện Chú Vương', isEnemy: true, maxHp: 5000, hp: 5000, speed: 100, dmg: 400, armor: 1000, heat: 0, shield: 0, izanagiUsed: false, position: 2, state: 'idle', stars: 6, damageDealt: 0, damageTaken: 0, healingDone: 0 });
      return list;
    }
    list.push({ id: 'e1', baseId: 'goblin', name: 'Thích Khách', isEnemy: true, maxHp: 500 * mult, hp: 500 * mult, speed: 80, dmg: 100 * mult, armor: 200 * mult, heat: 0, shield: 0, izanagiUsed: false, position: 0, state: 'idle', stars: 1, damageDealt: 0, damageTaken: 0, healingDone: 0 });
    list.push({ id: 'e2', baseId: 'slime', name: 'Ma Vật', isEnemy: true, maxHp: 800 * mult, hp: 800 * mult, speed: 60, dmg: 80 * mult, armor: 300 * mult, heat: 0, shield: 0, izanagiUsed: false, position: 2, state: 'idle', stars: 1, damageDealt: 0, damageTaken: 0, healingDone: 0 });
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
        damageDealt: 0,
        damageTaken: 0,
        healingDone: 0,
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
      setMatchResult('defeat');
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
        // Save star gain to DB
        (async () => {
          const { data } = await (supabase as any).from('players').select('pvp_stars, pvp_rank_level').eq('id', userId).single();
          if (data) {
            let newStars = (data.pvp_stars || 0) + rankedStarGain;
            let newLevel = data.pvp_rank_level || 1;
            if (newStars >= 5) { newStars -= 5; newLevel += 1; }
            await (supabase as any).from('players').update({ pvp_stars: newStars, pvp_rank_level: newLevel }).eq('id', userId);
          }
        })();
        toast.success(`Chiến Thắng! +${rankedStarGain} Sao Rank!`);
      } else {
        toast.success('Chiến thắng phòng kín!');
      }
      setMatchResult('victory');
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
      // --- Heat / Chakra gain (BOTH player AND enemy) ---
      // Compute heat OUTSIDE the pure state updater so we can read the result
      const currentC = combatants.find(c => c.id === currentEntity.id);
      if (!currentC) {
        handleDamage(target.id, finalDmg, currentEntity);
        setActiveAttacker(null);
        setCurrentTurnIdx(p => (p + 1) % turnOrder.length);
        return;
      }

      let newHeat = currentC.heat;
      let pendingUlt: 'saber' | 'sasuke' | null = null;

      if (currentC.baseId === 'sasuke') {
        newHeat = Math.min(100, currentC.heat + 20);
        if (!currentC.isEnemy && newHeat >= 100) pendingUlt = 'sasuke';
      } else if (currentC.baseId === 'saber') {
        newHeat = Math.min(100, currentC.heat + 15);
        if (!currentC.isEnemy && newHeat >= 100) pendingUlt = 'saber';
      }

      // Now apply to state
      if (currentC.baseId === 'sasuke' || currentC.baseId === 'saber') {
        setCombatants(prev => prev.map(c => c.id === currentEntity.id ? { ...c, heat: newHeat } : c));
      }

      handleDamage(target.id, finalDmg, currentEntity);
      setActiveAttacker(null);

      if (pendingUlt) {
        setTimeout(() => {
          setActiveUltCharacter(pendingUlt!);
          setIsCastingUlt(true);
        }, 50);
      } else {
        setCurrentTurnIdx(p => (p + 1) % turnOrder.length);
      }
    }, 500 / speedMult);
  };

  const handleDamage = (targetId: string, dmg: number, attacker?: any) => {
    setCombatants(prev => {
      const nextState = prev.map(c => ({ ...c }));
      const target = nextState.find(c => c.id === targetId);
      if (!target) return nextState;

      // Sasuke Dodge
      if (target.baseId === 'sasuke' && !target.isEnemy) {
        const dodgeRate = target.stars >= 6 ? 0.40 : target.stars >= 2 ? 0.30 : 0.20;
        if (Math.random() < dodgeRate) {
          toast(`⚡ Sasuke né tránh! +30 Chakra`, { duration: 1200 });
          target.heat = Math.min(100, target.heat + 30);
          return nextState;
        }
      }

      let remainingDmg = dmg;
      if (target.baseId === 'sasuke' && target.shield > 0) {
        const absorbed = Math.min(target.shield, remainingDmg);
        target.shield -= absorbed;
        remainingDmg -= absorbed;

        if (target.stars >= 4 && attacker && absorbed > 0) {
          const reflectDmg = Math.floor(absorbed * 0.2);
          const att = nextState.find(c => c.id === attacker.id);
          if (att) {
            const actualReflect = Math.min(att.hp, reflectDmg);
            att.hp -= actualReflect;
            att.damageTaken += actualReflect;
            target.damageDealt += actualReflect;
          }
          toast(`🛡 Susanoo phản chiêu! -${reflectDmg}`, { duration: 1200 });
        }
      }

      const hpLost = Math.min(target.hp, remainingDmg);
      target.hp -= hpLost;
      target.damageTaken += hpLost;

      if (attacker) {
        const att = nextState.find(c => c.id === attacker.id);
        if (att) att.damageDealt += hpLost;
      }

      // Sasuke Izanagi
      if (target.baseId === 'sasuke' && target.hp === 0 && target.stars >= 6 && !target.izanagiUsed) {
        toast('⚡ IZANAGI — Sasuke viết lại thực tại!', { duration: 2000 });
        const healAmt = Math.floor(target.maxHp * 0.5);
        target.hp = healAmt;
        target.shield = 0;
        target.izanagiUsed = true;
        target.healingDone += healAmt;
      }

      // Saber heat
      if (target.baseId === 'saber' && target.hp > 0) {
        const pctLost = (dmg / target.maxHp) * 100;
        const heatRates = [1.5, 1.5, 2.0, 2.0, 2.5, 2.5, 3.0];
        const rate = heatRates[Math.min(target.stars, 6)] || 1.5;
        target.heat = Math.min(100, target.heat + pctLost * rate);
      } else if (target.baseId === 'saber' && target.hp === 0 && target.stars === 6 && target.heat !== -1) {
        target.hp = 1;
        target.heat = -1;
      }

      return nextState;
    });
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

  // Handle Ultimate Video playback dynamically without DOM remounts
  useEffect(() => {
    if (isCastingUlt && activeUltCharacter && videoRef.current) {
      setTimeout(() => {
        const v = videoRef.current;
        if (!v) return;
        v.src = activeUltCharacter === 'sasuke' ? "/videos/sasuke ultimate.mp4" : "/videos/banner-ulti.mp4";
        v.load();
        // Set playback details when video data actually loads so logic doesn't reset it
        v.onloadeddata = () => {
          v.currentTime = 0;
          v.muted = false;
          v.defaultPlaybackRate = speedMult;
          v.playbackRate = speedMult;
          const playPromise = v.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        };
      }, 50);
    }
  }, [isCastingUlt, activeUltCharacter, speedMult]);

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
      <div className="absolute top-8 left-8 z-20">
        <Button variant="ghost" onClick={() => navigate('/battle')}><ChevronLeft /> Rút Lui</Button>
      </div>

      <div className="z-10 flex flex-col items-center w-full max-w-6xl">
        <h2 className="text-4xl font-black text-red-500 uppercase tracking-[0.2em] drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] mb-12">Đấu Trường Sinh Tử</h2>
        
        {opponentsLoading ? (
          <div className="flex flex-col items-center text-red-400">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <span className="uppercase tracking-widest font-bold">Đang tìm kiếm vệ tinh...</span>
          </div>
        ) : (
          <div className="flex justify-center gap-8 w-full">
            {(!arenaOpponents || arenaOpponents.length === 0) ? (
              <div className="text-center text-zinc-500 uppercase tracking-widest">Không tìm thấy đối thủ nào. Hãy quay lại sau!</div>
            ) : (
              arenaOpponents.map((opp: any, idx: number) => {
                const isMiddle = idx === 1;
                return (
                  <div key={opp.id} className={`relative flex flex-col items-center bg-zinc-950/80 border backdrop-blur-md p-6 transition-all ${isMiddle ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)] scale-110 -translate-y-4' : 'border-white/10 hover:border-red-500 mt-4'}`}>
                    {isMiddle && <div className="absolute -top-3 bg-amber-500 text-black font-black text-[10px] px-3 py-0.5 uppercase tracking-widest">Kẻ Thù Truyền Kiếp · +2 Sao</div>}
                    {!isMiddle && <div className="absolute -top-3 bg-zinc-700 text-zinc-200 font-black text-[10px] px-3 py-0.5 uppercase tracking-widest">+1 Sao</div>}

                    {/* Avatar with frame */}
                    {(() => {
                      const frameStyle = {
                        none: 'border-white/20',
                        gold: 'border-[#FFD700] shadow-[0_0_12px_rgba(255,215,0,0.6)]',
                        red_fire: 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.7)]',
                        blue_ice: 'border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]',
                        purple_void: 'border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.7)]',
                      }[opp.frame_url as string] || 'border-white/20';
                      const hasAvatar = opp.avatar_url && opp.avatar_url !== 'default';
                      return (
                        <div className={`w-24 h-24 rounded-full border-4 mb-4 overflow-hidden flex items-center justify-center bg-zinc-900 ${frameStyle}`}>
                          {hasAvatar
                            ? <img src={opp.avatar_url} className="w-full h-full object-cover" />
                            : <span className="text-3xl font-black text-zinc-500 uppercase">{opp.username.substring(0, 2)}</span>
                          }
                        </div>
                      );
                    })()}
                    
                    <h3 className="text-xl font-black uppercase tracking-widest mb-1 text-white">{opp.username}</h3>
                    <div className="text-red-400 font-bold uppercase tracking-widest text-xs mb-4">Level {opp.pvp_rank_level}</div>
                    
                    <div className="flex flex-col gap-1 text-center mb-6 w-full px-4 border-t border-b border-white/5 py-3">
                      <div className="text-xs text-zinc-500 uppercase">Lực chiến</div>
                      <div className="text-lg font-black text-amber-500">{opp.combat_power.toLocaleString()}</div>
                    </div>

                    <Button 
                      className={`w-full font-bold uppercase tracking-widest ${isMiddle ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                      onClick={() => handleSelectOpponent(opp, isMiddle)}
                    >
                      Nghiền Nát
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        )}
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

      {/* Rank HUD — top center, only in ranked mode during combat */}
      {mode === 'ranked' && phase === 'combat' && !isCastingUlt && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center bg-black/60 backdrop-blur-sm border border-amber-500/20 rounded-xl px-6 py-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70 mb-1">Level {player?.pvp_rank_level || 1}</div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`text-xl transition-all ${
                  i < (player?.pvp_stars || 0)
                    ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                    : 'text-zinc-700'
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <div className="text-[9px] text-zinc-500 mt-1 uppercase tracking-widest">+{rankedStarGain} Sao nếu thắng</div>
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
          ref={videoRef} 
          className="w-full h-full object-cover" 
          onEnded={finishUltimate}
        />
      </div>
      {/* MVP MODAL OVERLAY */}
      {matchResult && (
        <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
          <h2 className={`text-6xl font-black italic tracking-widest uppercase mb-12 drop-shadow-2xl ${matchResult === 'victory' ? 'text-amber-500' : 'text-red-600'}`}>
            {matchResult === 'victory' ? 'VICTORY' : 'DEFEAT'}
          </h2>
          
          {(() => {
            const playerCombatants = combatants.filter(c => !c.isEnemy);
            let mvp = playerCombatants[0];
            let maxScore = -1;
            playerCombatants.forEach(c => {
              const score = (c.damageDealt + c.damageTaken + c.healingDone) / 3;
              if (score > maxScore) {
                maxScore = score;
                mvp = c;
              }
            });

            return mvp ? (
              <div className="flex flex-col items-center bg-zinc-950/80 border border-white/10 p-8 min-w-[500px] shadow-2xl relative">
                <div className="absolute -top-4 bg-amber-500 text-black font-black text-xs px-4 py-1 uppercase tracking-widest">M.V.P</div>
                
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)] mb-6">
                  <img src={mvp.baseId === 'sasuke' ? "/videos/sasuke.gif" : mvp.baseId === 'saber' ? "/videos/saber-avatar.gif" : ""} className="w-full h-full object-cover saturate-150" />
                </div>
                
                <h3 className="text-3xl font-black text-white uppercase tracking-widest mb-8">{mvp.name}</h3>
                
                <div className="grid grid-cols-3 gap-8 w-full text-center">
                  <div className="flex flex-col items-center bg-black/50 p-4 border border-white/5">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Damage Dealt</span>
                    <span className="text-xl font-black text-red-500">{Math.floor(mvp.damageDealt)}</span>
                  </div>
                  <div className="flex flex-col items-center bg-black/50 p-4 border border-white/5">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Damage Taken</span>
                    <span className="text-xl font-black text-blue-500">{Math.floor(mvp.damageTaken)}</span>
                  </div>
                  <div className="flex flex-col items-center bg-black/50 p-4 border border-white/5">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Healing Done</span>
                    <span className="text-xl font-black text-green-500">{Math.floor(mvp.healingDone)}</span>
                  </div>
                </div>
              </div>
            ) : null;
          })()}

          {/* Extended Combat Stats */}
          <div className="w-full max-w-4xl mt-12 bg-zinc-950 border border-white/10 p-6 custom-scrollbar overflow-y-auto max-h-[300px]">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6 text-center border-b border-white/5 pb-4">Bảng Thống Kê Chi Tiết</h3>
            <div className="flex text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 px-4">
              <div className="w-48">Nhân Vật</div>
              <div className="flex-1 text-center text-red-500/70">Sát Thương Gây Ra</div>
              <div className="flex-1 text-center text-blue-500/70">Chống Chịu</div>
              <div className="flex-1 text-center text-green-500/70">Hồi Máu</div>
            </div>
            {combatants.filter(c => !c.isEnemy).map(c => (
              <div key={c.id} className="flex items-center text-sm font-bold px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                <div className="w-48 text-white uppercase tracking-widest flex items-center gap-2">
                  <div className="w-6 h-6 bg-black border border-white/10 rounded-full flex items-center justify-center overflow-hidden">
                    <img src={c.baseId === 'sasuke' ? "/videos/sasuke.gif" : c.baseId === 'saber' ? "/videos/saber-avatar.gif" : ""} className="w-full h-full object-cover" />
                  </div>
                  {c.name}
                </div>
                <div className="flex-1 text-center text-red-400">{Math.floor(c.damageDealt).toLocaleString()}</div>
                <div className="flex-1 text-center text-blue-400">{Math.floor(c.damageTaken).toLocaleString()}</div>
                <div className="flex-1 text-center text-green-400">{Math.floor(c.healingDone).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/battle')} className="mt-16 border border-amber-500 bg-amber-500/10 text-amber-500 px-12 py-4 font-bold tracking-[0.3em] uppercase hover:bg-amber-500/20 transition-colors text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            Tiếp Tục
          </button>
        </div>
      )}

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
