import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FastForward, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useHydratedCharacters, usePlayer, useArenaOpponents } from "@/hooks/usePlayerData";
import { getCharacterTotalStats } from "@/stores/gameStore";
import { getOpponentHydratedCharacters } from "@/services/playerService";
import { SABER, SASUKE, PETER, GOJO, FRIEREN, BASE_CHARACTERS } from "@/constants/gameData";

interface CombatEntity {
  id: string; baseId: string; name: string; isEnemy: boolean;
  maxHp: number; hp: number; speed: number; dmg: number; armor: number;
  heat: number;              // Saber = heat bar | Sasuke = chakra bar
  shield: number;            // Sasuke Susanoo shield
  izanagiUsed: boolean;      // Sasuke 6★ once-per-battle
  saberReviveUsed: boolean;  // Saber 6★ one-time immortality flag
  peterRevivePending?: boolean; // Peter 6★ revive flag
  peterReviveUsed?: boolean;    // Peter 6★ one-time revive flag
  frierenSaved?: boolean;    // Cứu tử 1 lần/trận
  flammeBarrier?: number;    // Miễn thương còn lại (số hiệp)
  stunnedTurns: number;      // Determines if skipped
  speedDebuffTurns: number;  // If > 0, speed is halved
  canTargetBackRow?: boolean; // Tương lai: tướng có kỹ năng xưỳng hàng sau
  skill1Cooldown: number;    // Tracks skill 1 cooldown
  videoAvatar?: string;
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
  // combatSpeedMult: chỉ tăng nhẹ trong chiến đấu để không mất hiệu ứng trực quan
  const combatSpeedMult = speedMult > 1 ? 1.4 : 1;
  const [isCastingUlt, setIsCastingUlt] = useState(false);
  const [activeUltCharacter, setActiveUltCharacter] = useState<'saber' | 'sasuke' | 'peter' | 'gojo' | 'frieren' | null>(null);
  const [activeUltCasterId, setActiveUltCasterId] = useState<string | null>(null);
  const [ultText, setUltText] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  // Always-fresh combatants ref for setTimeout callbacks (avoids stale closure)
  const combatantsRef = useRef<CombatEntity[]>([]);

  const [activeAttacker, setActiveAttacker] = useState<{ id: string, attackerPos: number, targetPos: number, isEnemy: boolean, targetIsEnemy: boolean } | null>(null);
  const [slashTargetId, setSlashTargetId] = useState<string | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<{ id: string, targetId: string, dmg: number | string, isSkill?: boolean, isHeal?: boolean }[]>([]);
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
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null);
  const [rankedStarGain, setRankedStarGain] = useState(0);
  const [opponentHydratedChars, setOpponentHydratedChars] = useState<any[]>([]);

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
    // Pre-fetch the opponent's real equipment in the background
    getOpponentHydratedCharacters(opponent.id)
      .then(rows => setOpponentHydratedChars(rows))
      .catch(() => setOpponentHydratedChars([]));
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
      // All base character definitions so we can look up baseStats, videoAvatar, etc.
      const allBaseDefs = [SABER, SASUKE, PETER, GOJO, FRIEREN, ...BASE_CHARACTERS];
      const mult = selectedOpponent.pvp_rank_level || 1;

      selectedOpponent.team_setup.forEach((charId: string | null, idx: number) => {
        if (!charId) return;
        // Find the static base definition (has baseStats, videoAvatar, skills, etc.)
        const baseDef = allBaseDefs.find(c => c.id === charId);
        if (!baseDef) return;

        // Find the opponent's real DB row for this character (has star_level + real equipment)
        const oppRow = opponentHydratedChars.find(r => r.character_id === charId);

        // Build a fully-hydrated GameCharacter identical to how useHydratedCharacters does it
        const hydratedChar = {
          ...baseDef,
          stars:     oppRow?.star_level ?? 1,
          equipment: oppRow?.equipment ?? { shoes: null, hat: null, armor: null, ring: null, belt: null, artifact: null },
        };

        // Now compute total stats exactly the same way as the player's own team
        const totalStats = getCharacterTotalStats(hydratedChar);

        list.push({
          id: `e_${idx}`,
          baseId: baseDef.id,
          name:   baseDef.name,
          isEnemy: true,
          maxHp:  totalStats.hp   + (mult * 100),
          hp:     totalStats.hp   + (mult * 100),
          speed:  totalStats.speed + Math.floor((mult - 1) * 8),
          dmg:    totalStats.dmg  + (mult * 20),
          armor:  totalStats.armor + (mult * 50),
          heat: baseDef.id === 'gojo' ? (hydratedChar.stars >= 4 ? 50 : 30) : 0,
          shield: 0,
          izanagiUsed: false,
          saberReviveUsed: false,
          stunnedTurns: 0,
          speedDebuffTurns: 0,
          skill1Cooldown: 0,
          videoAvatar: baseDef.videoAvatar,
          position: idx,
          state: 'idle',
          stars: hydratedChar.stars,
          damageDealt: 0, damageTaken: 0, healingDone: 0,
        });
      });

      // Fallback if team still empty
      if (list.length === 0) {
        list.push({ id: 'e1', baseId: 'goblin', name: 'Thích Khách', isEnemy: true, maxHp: 1000, hp: 1000, speed: 80, dmg: 100, armor: 200, heat: 0, shield: 0, izanagiUsed: false, saberReviveUsed: false, stunnedTurns: 0, speedDebuffTurns: 0, skill1Cooldown: 0, videoAvatar: '', position: 2, state: 'idle', stars: 1, damageDealt: 0, damageTaken: 0, healingDone: 0 });
      }
      return list;
    }

    // PvE / Private modes
    let mult = mode === 'pve' ? pveLevel : 5;
    
    if (mode === 'pve' && pveLevel === 7) {
      list.push({ id: 'e0', baseId: 'boss_dragon', name: 'Nhện Chú Vương', isEnemy: true, maxHp: 5000, hp: 5000, speed: 100, dmg: 400, armor: 1000, heat: 0, shield: 0, izanagiUsed: false, saberReviveUsed: false, stunnedTurns: 0, speedDebuffTurns: 0, skill1Cooldown: 0, videoAvatar: '', position: 2, state: 'idle', stars: 6, damageDealt: 0, damageTaken: 0, healingDone: 0 });
      return list;
    }
    list.push({ id: 'e1', baseId: 'goblin', name: 'Thích Khách', isEnemy: true, maxHp: 500 * mult, hp: 500 * mult, speed: 80, dmg: 100 * mult, armor: 200 * mult, heat: 0, shield: 0, izanagiUsed: false, saberReviveUsed: false, stunnedTurns: 0, speedDebuffTurns: 0, skill1Cooldown: 0, videoAvatar: '', position: 0, state: 'idle', stars: 1, damageDealt: 0, damageTaken: 0, healingDone: 0 });
    list.push({ id: 'e2', baseId: 'slime', name: 'Ma Vật', isEnemy: true, maxHp: 800 * mult, hp: 800 * mult, speed: 60, dmg: 80 * mult, armor: 300 * mult, heat: 0, shield: 0, izanagiUsed: false, saberReviveUsed: false, stunnedTurns: 0, speedDebuffTurns: 0, skill1Cooldown: 0, videoAvatar: '', position: 2, state: 'idle', stars: 1, damageDealt: 0, damageTaken: 0, healingDone: 0 });
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
      // Use total stats (base + equipment bonuses) so gear affects speed/dmg/armor in combat
      const totalStats = getCharacterTotalStats(c);
      return {
        id: `p_${idx}`,
        baseId: c.id,
        name: c.name,
        isEnemy: false,
        maxHp: totalStats.hp,
        hp: totalStats.hp,
        speed: totalStats.speed,   // equipment speed MATTERS for turn order
        dmg: totalStats.dmg,
        armor: totalStats.armor,
        heat: 0,
        shield: 0,
        position: idx,
        state: 'idle',
        stars: c.stars,
        izanagiUsed: false,
        saberReviveUsed: false,
        stunnedTurns: 0,
        speedDebuffTurns: 0,
        skill1Cooldown: 0,
        videoAvatar: c.videoAvatar,
        damageDealt: 0,
        damageTaken: 0,
        healingDone: 0,
      };
    }).filter(Boolean) as CombatEntity[];

    const enemies = generateEnemyTeam();
    const allCombatants = [...players, ...enemies].map(c => {
      if (c.baseId === 'gojo') {
        c.heat = c.stars >= 4 ? 50 : 30; // Passive: Lục Nhãn
      } else if (c.baseId === 'frieren') {
        c.heat = c.stars >= 4 ? 50 : 0; // Passive: 50 Mana
      }
      return c;
    });
    // Sort by speed. Add tiny random tiebreaker so equal-speed chars don't always favour players
    // (JavaScript stable sort would otherwise put players first since they come first in the array)
    setTurnOrder(
      [...allCombatants]
        .map(c => ({ c, tiebreak: c.speed + Math.random() * 0.001 }))
        .sort((a, b) => b.tiebreak - a.tiebreak)
        .map(({ c }) => c.id)
    );
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
      // Tìm MVP đồng nhất với UX Hậu Chiến (Damage + Taken + Healed)
      const mvp = combatants.filter(c => !c.isEnemy).sort((a,b) => {
        const scoreA = (a.damageDealt + a.damageTaken + a.healingDone) / 3;
        const scoreB = (b.damageDealt + b.damageTaken + b.healingDone) / 3;
        return scoreB - scoreA;
      })[0];
      if (mvp && mvp.baseId === 'gojo') {
         new Audio('/videos/gojo sound 1.m4a').play().catch(e => console.error(e));
      }

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

    // ── PETER 6★ REVIVE CHECK ──
    if (currentEntity && currentEntity.hp <= 0 && currentEntity.peterRevivePending) {
      toast('🍺 BỪNG TỈNH CƠN SAY! Peter hồi sinh 70% HP!', { duration: 2500 });
      setCombatants(prev => prev.map(c => c.id === currentId ? { 
         ...c, 
         hp: Math.floor(c.maxHp * 0.7), 
         peterRevivePending: false 
      } : c));
      // Give him the turn next round, or right now? Let's give him his turn right now!
      // To give his turn right now, we don't return. Just let him continue.
      currentEntity.hp = Math.floor(currentEntity.maxHp * 0.7);
      currentEntity.peterRevivePending = false;
    }

    if (!currentEntity || currentEntity.hp <= 0) {
      setCurrentTurnIdx(p => (p + 1) % turnOrder.length);
      return;
    }

    let nextDebuff = currentEntity.speedDebuffTurns;
    let nextStun = currentEntity.stunnedTurns;

    if (nextDebuff > 0) nextDebuff -= 1;
    if (nextStun > 0) {
      nextStun -= 1;
      toast(`${currentEntity.name} đang bị choáng!`, { duration: 1000 });
      setCombatants(prev => prev.map(c => c.id === currentId ? { ...c, stunnedTurns: nextStun, speedDebuffTurns: nextDebuff } : c));
      setTimeout(() => setCurrentTurnIdx(p => (p + 1) % turnOrder.length), 600 / combatSpeedMult);
      return;
    } else if (currentEntity.speedDebuffTurns !== nextDebuff) {
      setCombatants(prev => prev.map(c => c.id === currentId ? { ...c, speedDebuffTurns: nextDebuff } : c));
    }

    // Trừ barrier của nhân vật khi đến LƯỢT của chính họ (không phải khi bị đánh)
    if (currentEntity && (currentEntity.flammeBarrier || 0) > 0) {
      setCombatants(prev => prev.map(c => c.id === currentId
        ? { ...c, flammeBarrier: Math.max(0, (c.flammeBarrier || 0) - 1) }
        : c));
    }

    // Hàng trung tâm (gần kẻ thù hơn) = hàng đầu chiến = position [0,1]
    // Hàng sau (xa) = position [2,3,4]. Tấn công ưu tiên hàng đầu trước.
    const FRONT_ROW = [0, 1];
    const pickTarget = (pool: typeof alivePlayers) => {
      if (currentEntity.canTargetBackRow) {
        // Tương lai: tướng có xướng hàng sau có thể chọn tự do
        return pool[Math.floor(Math.random() * pool.length)];
      }
      const frontRow = pool.filter(c => FRONT_ROW.includes(c.position));
      const effective = frontRow.length > 0 ? frontRow : pool; // Fallback nếu hàng đầu đã chết hết
      return effective[Math.floor(Math.random() * effective.length)];
    };

    let targets = currentEntity?.isEnemy ? alivePlayers : aliveEnemies;
    let target = pickTarget(targets);

    // ── ATTACK DECISION: BASIC vs SKILL 1 ──
    let baseDmg = currentEntity.dmg;
    let armorPiercing = 0; 
    let dmgMultiplier = 1.0;
    let isSkill1 = false;
    let skillName = 'Đánh Thường';

    if (currentEntity.skill1Cooldown === 0) {
      isSkill1 = true;
      if (currentEntity.baseId === 'sasuke') {
        currentEntity.skill1Cooldown = 1; // Sasuke CD = 1
        skillName = 'Chidori';
        dmgMultiplier = 2.5;
        if (currentEntity.stars >= 2) armorPiercing = 0.3;
      } else if (currentEntity.baseId === 'peter') {
        currentEntity.skill1Cooldown = 3; // Peter CD = 3
        skillName = 'Nắm Đấm Say Xỉn';
        dmgMultiplier = 2.2;
      } else if (currentEntity.baseId === 'saber') {
        currentEntity.skill1Cooldown = 0; // Saber CD = 0
        skillName = 'Strike Air';
        dmgMultiplier = 2.0; 
      } else if (currentEntity.baseId === 'gojo') {
        currentEntity.skill1Cooldown = currentEntity.stars >= 2 ? 2 : 3;
        skillName = 'Hách';
        dmgMultiplier = 1.8;
      } else if (currentEntity.baseId === 'frieren') {
        currentEntity.skill1Cooldown = currentEntity.stars >= 2 ? 1 : 2;
        skillName = 'Thanh Tẩy & Tiếp Tế';
        
        // Frieren Skill 1 targets ALLY with lowest HP
        targets = currentEntity.isEnemy ? aliveEnemies : alivePlayers;
        target = targets.sort((a,b) => (a.hp/a.maxHp) - (b.hp/b.maxHp))[0];
      }
      
      // Update cooldown in state
      setCombatants(prev => prev.map(c => c.id === currentId ? { ...c, skill1Cooldown: currentEntity.skill1Cooldown } : c));
      
      if (currentEntity.baseId.match(/sasuke|peter|saber|gojo/)) {
        toast(`💥 ${currentEntity.name} tung chiêu: ${skillName}!`, { duration: 1500 });
      }
    } else {
      // Basic Attack 100% ATK
      currentEntity.skill1Cooldown -= 1;
      setCombatants(prev => prev.map(c => c.id === currentId ? { ...c, skill1Cooldown: currentEntity.skill1Cooldown } : c));
      dmgMultiplier = 1.0;
    }

    // ── GOJO PASSIVE: LỤC NHÃN (CRITICAL HIT) ──
    let isCritical = false;
    if (currentEntity.baseId === 'gojo') {
      const critRate = currentEntity.stars >= 4 ? 0.5 : 0.2;
      if (Math.random() < critRate) {
        isCritical = true;
        dmgMultiplier *= 1.5;
        toast.error('💥 CHÍ MẠNG LỤC NHÃN!', { duration: 1000, style: { background: '#3b82f6', color: 'white' } });
      }
    }

    let finalDmg = 0;
    let finalHeal = 0;

    if (isSkill1 && currentEntity.baseId === 'frieren') {
       finalHeal = Math.floor(currentEntity.maxHp * 0.5);
    } else {
       const effectiveArmor = target.armor * (1 - armorPiercing);
       finalDmg = Math.max(1, Math.floor(baseDmg * dmgMultiplier * (1 - effectiveArmor / (effectiveArmor + 1000))));
    }

    // VFX 3-Step Sequence
    setActiveAttacker({
      id: currentEntity.id,
      attackerPos: currentEntity.position,
      targetPos: target.position,
      isEnemy: currentEntity.isEnemy,
      targetIsEnemy: target.isEnemy
    });

    setTimeout(() => {
      if (finalDmg > 0 || !isSkill1) setSlashTargetId(target.id);
      setFloatingTexts(prev => [...prev, { id: Math.random().toString(), targetId: target.id, dmg: finalDmg > 0 ? finalDmg : `+${finalHeal}`, isSkill: isSkill1, isHeal: finalHeal > 0 }]);
      setTimeout(() => setSlashTargetId(null), 150);
    }, 200 / combatSpeedMult);

    setTimeout(() => {
      // Use ref to always get the freshest combatants state (avoids stale closure bug)
      const currentC = combatantsRef.current.find(c => c.id === currentEntity.id);
      if (!currentC) {
        handleDamage(target.id, finalDmg, currentEntity);
        setActiveAttacker(null);
        setCurrentTurnIdx(p => (p + 1) % turnOrder.length);
        return;
      }

      let newHeat = currentC.heat;
      let pendingUlt: { baseId: 'saber' | 'sasuke' | 'peter' | 'gojo' | 'frieren', casterId: string } | null = null;

      if (currentC.baseId === 'sasuke') {
        newHeat = Math.min(100, currentC.heat + 20);
        if (newHeat >= 100) pendingUlt = { baseId: 'sasuke', casterId: currentC.id };
      } else if (currentC.baseId === 'saber') {
        newHeat = Math.min(100, currentC.heat + 15);
        if (newHeat >= 100) pendingUlt = { baseId: 'saber', casterId: currentC.id };
      } else if (currentC.baseId === 'peter') {
        newHeat = Math.min(100, currentC.heat + 15);
        if (newHeat >= 100) pendingUlt = { baseId: 'peter', casterId: currentC.id };
      } else if (currentC.baseId === 'gojo') {
        newHeat = Math.min(100, currentC.heat + (isSkill1 ? 20 : 10)); // Gojo hồi 20 chú lực khi dùng Hách, 10 khi đánh thường
        if (newHeat >= 100) pendingUlt = { baseId: 'gojo', casterId: currentC.id };
      } else if (currentC.baseId === 'frieren') {
        newHeat = Math.min(100, currentC.heat + (isSkill1 ? 20 : 15)); // Frieren hồi 20 mana khi thanh tẩy, 15 khi đánh thường
        if (newHeat >= 100) pendingUlt = { baseId: 'frieren', casterId: currentC.id };
      }

      // Now apply to state
      if (['sasuke', 'saber', 'peter', 'gojo', 'frieren'].includes(currentC.baseId)) {
        setCombatants(prev => prev.map(c => c.id === currentEntity.id ? { ...c, heat: newHeat } : c));
      }

      const finalizeTurn = () => {
        if (finalHeal > 0 && currentC.baseId === 'frieren') {
          setCombatants(prev => {
            const tempState = prev.map(c => ({...c}));
            const t = tempState.find(c => c.id === target.id);
            if (t) {
              t.hp = Math.min(t.maxHp, t.hp + finalHeal);
              t.speedDebuffTurns = 0; t.stunnedTurns = 0;
            // Chỉ bơm mana cho ĐỒNG ĐỘI (không bơm cho bản thân Frieren)
              if (t.id !== currentEntity.id && ['sasuke', 'saber', 'peter', 'gojo', 'frieren'].includes(t.baseId)) {
                t.heat = Math.min(100, t.heat + 25);
              }
            }
            const att = tempState.find(c => c.id === currentEntity.id);
            if (att) att.healingDone += finalHeal;
            return tempState;
          });
        } else {
          handleDamage(target.id, finalDmg, currentEntity);
        }
        setActiveAttacker(null);

        if (pendingUlt) {
          setTimeout(() => {
            setActiveUltCharacter(pendingUlt!.baseId);
            setActiveUltCasterId(pendingUlt!.casterId);
            setIsCastingUlt(true);
          }, 50);
        } else {
          setCurrentTurnIdx(p => (p + 1) % turnOrder.length);
        }
      };

      if (currentC.baseId === 'gojo' && isSkill1) {
        // Áp dụng debuff tốc độ
        const speedDebuff = currentC.stars >= 2 ? 0.5 : 0.7; // Giảm 50% hoặc 30% tốc độ -> còn 50% hoặc 70%
        setCombatants(prev => prev.map(c => c.id === target.id ? { 
          ...c, 
          speedDebuffTurns: 2, 
          speed: Math.floor(c.speed * speedDebuff) 
        } : c));
        
        // Phát âm thanh của chiêu 1 và đợi kết quả (Chỉ phát ở tốc độ x1 hoặc không đồng bộ được nếu speedMult cao = có thể kết thúc sớm nếu cần, nhưng yêu cầu là khớp hoàn toàn với âm thanh)
        const audio = new Audio('/videos/gojo sound 2.m4a');
        audio.playbackRate = speedMult; // Chỉnh tốc độ phát nhạc theo tốc độ game
        audio.play().catch(e => console.error(e));
        audio.onended = () => {
           finalizeTurn();
        };
      } else {
        finalizeTurn();
      }
    }, 500 / combatSpeedMult);
  };

  const handleDamage = (targetId: string, dmg: number, attacker?: any) => {
    setCombatants(prev => {
      const nextState = prev.map(c => ({ ...c }));
      const target = nextState.find(c => c.id === targetId);
      if (!target) return nextState;

      // Sasuke Dodge — applies to ALL Sasuke (player AND enemy), both gain Chakra
      if (target.baseId === 'sasuke') {
        const dodgeRate = target.stars >= 6 ? 0.40 : target.stars >= 2 ? 0.30 : 0.20;
        if (Math.random() < dodgeRate) {
          const label = target.isEnemy ? '⚡ Sasuke địch né! +30 Chakra' : '⚡ Sasuke né tránh! +30 Chakra';
          toast(label, { duration: 1200 });
          // Both player and enemy Sasuke gain Chakra on dodge
          target.heat = Math.min(100, target.heat + 30);
          return nextState;
        }
      }

      // [NEW] FLAMME BARRIER - Chặn đòn, không trừ đếm (trừ khi đến LƯỢT của nhân vật)
      if ((target.flammeBarrier || 0) > 0) {
          const frierens = nextState.filter(c => c.baseId === 'frieren' && c.isEnemy === target.isEnemy && c.stars >= 6 && c.hp > 0);
          if (frierens.length > 0) {
             target.hp = Math.min(target.maxHp, target.hp + dmg);
             frierens[0].healingDone += dmg;
             toast(`💚 Hấp Thụ Ngược! +${dmg} HP!`, { duration: 1200 });
          } else {
             toast(`🛡️ Kết Giới Flamme!`, { duration: 800 });
          }
          return nextState; // Miễn thương
      }

      let remainingDmg = dmg;
      
      // Peter Passive: Reduce incoming damage by 20%
      if (target.baseId === 'peter') {
        remainingDmg = Math.floor(remainingDmg * 0.8);
      }

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

      if (target.hp === 0 && !target.frierenSaved) {
         const frierenAlive = nextState.some(c => c.baseId === 'frieren' && c.isEnemy === target.isEnemy && c.hp > 0);
         if (frierenAlive) {
             target.hp = 1;
             target.frierenSaved = true; // Chỉ cứu 1 lần/trận
             target.flammeBarrier = (target.flammeBarrier || 0) + 1; // +1 lượt miễn thương sau khi cứu tử
             toast(`🪄 Cứu Tử! ${target.name} sống sót với 1 HP nhờ Frieren!`, { duration: 2500 });
         }
      }

      if (attacker) {
        const att = nextState.find(c => c.id === attacker.id);
        if (att) att.damageDealt += hpLost;
        
        // Gojo Sound 1 on Kill
        if (target.hp === 0 && attacker.baseId === 'gojo') {
           new Audio('/videos/gojo sound 1.m4a').play().catch(e => console.error(e));
        }
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

      // Saber: on takend damage, gain heat. On death (6★): one-time revive via flag (NOT heat sentinel)
      if (target.baseId === 'saber' && target.hp > 0) {
        const pctLost = (dmg / target.maxHp) * 100;
        const heatRates = [1.5, 1.5, 2.0, 2.0, 2.5, 2.5, 3.0];
        const rate = heatRates[Math.min(target.stars, 6)] || 1.5;
        target.heat = Math.min(100, target.heat + pctLost * rate);
      } else if (target.baseId === 'saber' && target.hp === 0 && target.stars >= 6 && !target.saberReviveUsed) {
        toast('⚔️ EXCALIBUR UNBREAKABLE — Saber bất tử!', { duration: 2000 });
        target.hp = 1;
        target.saberReviveUsed = true; // locked — can die normally from here on
      }

      // Peter Passive: Reflect dmg & +10 Heat on hit
      if (target.baseId === 'peter' && target.hp > 0) {
        target.heat = Math.min(100, target.heat + 10);
        if (attacker) {
          // 2★: 30% reflect, less than 2★: 15% reflect
          const reflectRate = target.stars >= 2 ? 0.30 : 0.15;
          const reflectDmg = Math.floor(dmg * reflectRate);
          const att = nextState.find(c => c.id === attacker.id);
          if (att && att.hp > 0) {
            const actualReflect = Math.min(att.hp, reflectDmg);
            att.hp -= actualReflect;
            att.damageTaken += actualReflect;
            target.damageDealt += actualReflect;
            toast(`🍺 ${target.isEnemy ? 'Địch ' : ''}Peter phản đòn! -${actualReflect}`, { duration: 1200 });
          }
        }
      }

      // Peter 6★ Revive Check (If he just died)
      if (target.baseId === 'peter' && target.hp === 0 && target.stars >= 6 && !target.peterRevivePending && !target.peterReviveUsed) {
        // Find if any ally is still alive
        const hasAliveAlly = nextState.some(c => c.isEnemy === target.isEnemy && c.hp > 0 && c.id !== target.id);
        if (hasAliveAlly) {
           target.peterRevivePending = true;
           target.peterReviveUsed = true; // Chỉ xài 1 lần 1 trận
           toast('🍺 DRUNKEN MASTER: Peter gục ngã chờ hồi sinh!', { duration: 2500 });
        }
      }

      return nextState;
    });
  };

  const finishUltimate = () => {
    setIsCastingUlt(false);
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.muted = true; }

    setCombatants(prev => {
      const nextState = prev.map(c => ({...c})); // CHUẨN HOÁ CLONE OBJECT (Sửa lỗi mất data)

      const caster = nextState.find(c => c.id === activeUltCasterId);
      if (!caster) return nextState;

      // Helper: áp dụng sát thương qua Flamme Barrier check (không có Cứu Tử - xử lý tại handleDamage)
      const applyUltDmg = (target: typeof nextState[0], dmg: number, trackAttacker = caster) => {
        if ((target.flammeBarrier || 0) > 0) {
          const remaining = (target.flammeBarrier || 0) - 1;
          target.flammeBarrier = remaining;
          // 6★ Frieren: Hấp Thụ Ngược khi ALLY Frieren còn sống
          const frierenAlive6 = nextState.find(c => c.baseId === 'frieren' && c.isEnemy === target.isEnemy && c.stars >= 6 && c.hp > 0);
          if (frierenAlive6) {
            target.hp = Math.min(target.maxHp, target.hp + dmg);
            frierenAlive6.healingDone += dmg;
            toast(`💚 Hấp Thụ Ngược +${dmg}!`, { duration: 1000 });
          } else {
            toast(`🛡️ Kết Giới! (còn ${remaining})`, { duration: 900 });
          }
          return; // Miễn thương
        }
        const hpLost = Math.min(target.hp, dmg);
        target.hp -= hpLost;
        target.damageTaken += hpLost;
        trackAttacker.damageDealt += hpLost;
        // Không có Cứu Tử ở đây — AoE xử lý hàng loạt nên không biết Frieren có còn sống không
      };

      // ── SABER ULTIMATE: Excalibur — enemy Sasuke can dodge ──
      if (caster.baseId === 'saber' && activeUltCharacter === 'saber') {
        caster.heat = 0;
        setUltText('⚔ EXCALIBUR!');
        setTimeout(() => setUltText(''), 2000);
        const dmgAmt = Math.floor(caster.dmg * 4);
        nextState.forEach(c => {
          if (c.isEnemy === caster.isEnemy) return;
          // Sasuke enemy dodge check mt ultimate
          if (c.baseId === 'sasuke') {
            const dodgeRate = c.stars >= 6 ? 0.40 : c.stars >= 2 ? 0.30 : 0.20;
            if (Math.random() < dodgeRate) { toast(`⚡ Sasuke né Excalibur!`, { duration: 1500 }); return; }
          }
          applyUltDmg(c, dmgAmt);
        });
      }

      // ── SASUKE ULTIMATE: Susanoo — enemy Sasuke can dodge ──
      if (caster.baseId === 'sasuke' && activeUltCharacter === 'sasuke') {
        caster.heat = 0;
        const multByStars = caster.stars >= 4 ? 4.5 : 3.5;
        const dmgAmt = Math.floor(caster.dmg * multByStars);
        nextState.forEach(c => {
          if (c.isEnemy === caster.isEnemy) return;
          if (c.baseId === 'sasuke') {
            const dodgeRate = c.stars >= 6 ? 0.40 : c.stars >= 2 ? 0.30 : 0.20;
            if (Math.random() < dodgeRate) { toast(`⚡ Sasuke né Susanoo!`, { duration: 1500 }); return; }
          }
          applyUltDmg(c, dmgAmt);
        });

        // Grant Susanoo Shield = 40% max HP
        const shieldAmt = Math.floor(caster.maxHp * 0.4);
        caster.shield = shieldAmt;
        setUltText(`⚡ SUSANOO! Shield: ${shieldAmt}`);
        setTimeout(() => setUltText(''), 2500);
      }

      // ── PETER ULTIMATE: Hơi Thở Nồng Nặc ──
      if (caster.baseId === 'peter' && activeUltCharacter === 'peter') {
        caster.heat = 0;
        
        if (caster.stars >= 6) {
          caster.peterRevivePending = true; 
        }

        const dmgAmt = Math.floor(caster.dmg * 3);
        setUltText('🍺 HƠI THỞ NỒNG NẶC!');
        setTimeout(() => setUltText(''), 2500);

        nextState.forEach(c => {
          if (c.isEnemy === caster.isEnemy) {
            if (c.id === caster.id) {
               c.stunnedTurns = 1;
            }
            return;
          }
          // Sasuke enemy dodge check
          if (c.baseId === 'sasuke') {
            const dodgeRate = c.stars >= 6 ? 0.40 : c.stars >= 2 ? 0.30 : 0.20;
            if (Math.random() < dodgeRate) { toast(`⚡ Sasuke né đòn!`, { duration: 1500 }); return; }
          }
          applyUltDmg(c, dmgAmt);
          // Speed debuff chỉ áp khi không bị chặn
          if (!((c.flammeBarrier || 0) > 0)) {
            c.speedDebuffTurns = 2;
            c.speed = Math.floor(c.speed * 0.5);
          }
        });
      }

      // ── GOJO ULTIMATE: Vô Lượng Không Xứ ──
      if (caster.baseId === 'gojo' && activeUltCharacter === 'gojo') {
        caster.heat = 0;
        const dmgMulti = caster.stars >= 6 ? 2.5 : 1.5;
        const trueDmgAmt = Math.floor(caster.dmg * dmgMulti); // Bỏ qua 100% Armor
        setUltText('🤞 VÔ LƯỢNG KHÔNG XỨ!');
        setTimeout(() => setUltText(''), 2500);

        nextState.forEach(c => {
          if (c.isEnemy === caster.isEnemy) return;
          applyUltDmg(c, trueDmgAmt);
          c.stunnedTurns = 1;
        });
      }

      // ── FRIEREN ULTIMATE: Kết Giới Flamme ──
      if (caster.baseId === 'frieren' && activeUltCharacter === 'frieren') {
        caster.heat = 0;
        setUltText('🪄 KẾT GIỚI FLAMME!');
        setTimeout(() => setUltText(''), 2500);

        // Barrier = 1 lượt mỗi đồng minh (trừ khi họ hành động)
        nextState.forEach(c => {
          if (c.isEnemy !== caster.isEnemy) return;
          c.flammeBarrier = 1;
        });
        toast(`🛡️ Kết Giới Flamme! Toàn đội Miễn Thương 1 lượt!`, { duration: 2000 });

        // 6★: Hồi Sinh toàn bộ đồng minh đã chết ở 50% HP
        if (caster.stars >= 6) {
          const revived: string[] = [];
          nextState.forEach(c => {
            if (c.isEnemy === caster.isEnemy && c.hp <= 0 && c.id !== caster.id) {
              c.hp = Math.floor(c.maxHp * 0.5);
              c.frierenSaved = false; // reset để Cứu Tử có thể kích hoạt lại sau khi hồi sinh
              revived.push(c.name);
            }
          });
          if (revived.length > 0) {
            toast(`✨ Hồi Sinh: ${revived.join(', ')} (50% HP)!`, { duration: 3000 });
          }
        }
      }

      return nextState;
    });
    setActiveUltCharacter(null);
    setActiveUltCasterId(null);
    setCurrentTurnIdx(p => (p + 1) % turnOrder.length);
  };

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (phase === 'combat' && !isCastingUlt) {
      t = setTimeout(executeTurn, 1000 / combatSpeedMult);
    }
    return () => clearTimeout(t);
  }, [currentTurnIdx, phase, isCastingUlt, combatants, speedMult]);

  // Keep ref always current — lets setTimeout callbacks read latest state without stale closure
  useEffect(() => { combatantsRef.current = combatants; }, [combatants]);

  // Handle Ultimate Video playback dynamically without DOM remounts
  useEffect(() => {
    if (isCastingUlt && activeUltCharacter && videoRef.current) {
      setTimeout(() => {
        const v = videoRef.current;
        if (v) {
        v.src = activeUltCharacter === 'sasuke' ? "/videos/sasuke ultimate.mp4" : activeUltCharacter === 'peter' ? "/videos/peter ultimate.mp4" : activeUltCharacter === 'gojo' ? "/videos/gojo ultimate.mp4" : activeUltCharacter === 'frieren' ? "/videos/frieren ultimate.mp4" : "/videos/banner-ulti.mp4";
        v.play().catch(e => console.error("Video play err:", e));
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
        }
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
                        src={c.videoAvatar || "/placeholder-avatar.png"} 
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
        {/* Red tint overlay khi Ultimate của địch */}
        {isCastingUlt && activeUltCasterId && combatants.find(c => c.id === activeUltCasterId)?.isEnemy && (
          <div className="absolute inset-0 bg-red-800/40 mix-blend-multiply pointer-events-none animate-pulse" />
        )}
        {/* Border frame indicator */}
        {isCastingUlt && (
          <div className={`absolute inset-0 border-[6px] pointer-events-none ${
            combatants.find(c => c.id === activeUltCasterId)?.isEnemy
              ? 'border-red-600 shadow-[inset_0_0_60px_rgba(239,68,68,0.4)]'
              : 'border-amber-500 shadow-[inset_0_0_60px_rgba(245,158,11,0.3)]'
          }`} />
        )}
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
                  <img src={mvp.videoAvatar || "/placeholder-avatar.png"} className="w-full h-full object-cover saturate-150" />
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
          <div className="w-full max-w-5xl mt-12 bg-zinc-950 border border-white/10 p-6 custom-scrollbar overflow-y-auto max-h-[350px]">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6 text-center border-b border-white/5 pb-4">Bảng Thống Kê Chi Tiết</h3>
            
            <div className="flex gap-4">
              {/* Quân Ta */}
              <div className="flex-1">
                <div className="text-center text-xs font-black uppercase text-amber-500 mb-4 bg-amber-500/10 py-2 border border-amber-500/20">Quân Ta</div>
                <div className="flex text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 px-2">
                  <div className="w-32">Nhân Vật</div>
                  <div className="flex-1 text-center text-red-500/70">Damage</div>
                  <div className="flex-1 text-center text-blue-500/70">Nhận</div>
                  <div className="flex-1 text-center text-green-500/70">Hồi</div>
                </div>
                {combatants.filter(c => !c.isEnemy && !!c.baseId).map(c => (
                  <div key={c.id} className="flex items-center text-xs font-bold px-2 py-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                    <div className="w-32 text-white uppercase tracking-widest flex items-center gap-2">
                      <div className="w-6 h-6 shrink-0 bg-black border border-amber-500/30 rounded-full flex items-center justify-center overflow-hidden">
                        <img src={c.videoAvatar || "/placeholder-avatar.png"} className="w-full h-full object-cover" />
                      </div>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <div className="flex-1 text-center text-red-400">{Math.floor(c.damageDealt).toLocaleString()}</div>
                    <div className="flex-1 text-center text-blue-400">{Math.floor(c.damageTaken).toLocaleString()}</div>
                    <div className="flex-1 text-center text-green-400">{Math.floor(c.healingDone).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="w-px bg-white/10 self-stretch" />

              {/* Quân Địch */}
              <div className="flex-1">
                <div className="text-center text-xs font-black uppercase text-red-500 mb-4 bg-red-500/10 py-2 border border-red-500/20">Quân Địch</div>
                <div className="flex text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 px-2">
                  <div className="w-32">Nhân Vật</div>
                  <div className="flex-1 text-center text-red-500/70">Damage</div>
                  <div className="flex-1 text-center text-blue-500/70">Nhận</div>
                  <div className="flex-1 text-center text-green-500/70">Hồi</div>
                </div>
                {combatants.filter(c => c.isEnemy && !!c.baseId).map(c => (
                  <div key={c.id} className="flex items-center text-xs font-bold px-2 py-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                    <div className="w-32 text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-6 h-6 shrink-0 bg-black border border-red-500/30 rounded-full flex items-center justify-center overflow-hidden">
                        <img src={c.videoAvatar || "/placeholder-avatar.png"} className="w-full h-full object-cover grayscale opacity-80" />
                      </div>
                      <span className="truncate text-[10px]">{c.name}</span>
                    </div>
                    <div className="flex-1 text-center text-red-500/50">{Math.floor(c.damageDealt).toLocaleString()}</div>
                    <div className="flex-1 text-center text-blue-500/50">{Math.floor(c.damageTaken).toLocaleString()}</div>
                    <div className="flex-1 text-center text-green-500/50">{Math.floor(c.healingDone).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
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
              <div key={ft.id} className={`absolute -top-12 left-1/2 -translate-x-1/2 font-black text-3xl drop-shadow-[0_2px_2px_rgba(0,0,0,1)] z-50 animate-in slide-in-from-bottom-5 fade-in duration-500 pointer-events-none flex flex-col items-center ${ft.isHeal ? 'text-green-400' : 'text-red-500'}`}>
                {ft.isSkill && !ft.isHeal && <div className="text-xl text-yellow-400 mb-1 animate-pulse italic drop-shadow-[0_0_5px_yellow]">SKILL!</div>}
                {ft.isSkill && ft.isHeal && <div className="text-xl text-green-300 mb-1 animate-pulse italic drop-shadow-[0_0_5px_green]">HEAL!</div>}
                <div>{ft.isHeal ? ft.dmg : `-${ft.dmg}`}</div>
              </div>
            ))}
            
            {/* Stun VFX */}
            {c.stunnedTurns > 0 && c.hp > 0 && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl animate-[spin_3s_linear_infinite] drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] z-50 pointer-events-none filter sepia">
                💫
              </div>
            )}

            <div className="flex items-center gap-1 mb-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${c.isEnemy ? 'text-red-500' : 'text-zinc-400'}`}>{c.name}</span>
              {c.shield > 0 && <span className="bg-blue-500 text-[8px] px-1 rounded-sm text-white font-bold">SHIELD</span>}
            </div>

            {/* Flamme Barrier Golden Shield Ring */}
            {c.flammeBarrier && c.hp > 0 && (
              <div className="absolute inset-[-6px] rounded-xl border-4 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.9),inset_0_0_15px_rgba(234,179,8,0.3)] z-50 pointer-events-none animate-pulse" />
            )}

            <div className={`w-24 h-24 rounded-lg bg-black border-2 transition-all duration-100 relative overflow-hidden flex items-center justify-center ${flashClass} ${c.shield > 0 ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : c.flammeBarrier ? 'border-yellow-400' : 'border-zinc-800'}`}>
              <img 
                src={c.videoAvatar || "/placeholder-avatar.png"} 
                className={`w-full h-full object-cover ${c.hp <= 0 ? 'grayscale' : ''}`} 
              />
              {!c.baseId.match(/saber|sasuke|peter|gojo|frieren/) && <div className="text-4xl">{c.isEnemy ? '👹' : '😎'}</div>}
              
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
              <div className="absolute -top-6 left-0 w-full text-center">
                <span className="bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-bold border border-white/10 uppercase tracking-widest text-amber-500 shadow-md">
                  TỐC: {c.speed}
                </span>
              </div>
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

            {/* Energy Bar (Heat/Chakra/Chú Lực/Mana) */}
            {(c.baseId === 'saber' || c.baseId === 'sasuke' || c.baseId === 'peter' || c.baseId === 'gojo' || c.baseId === 'frieren') && (
              <div className="w-full h-2 bg-black mt-1 border border-zinc-800 relative z-50 pointer-events-none">
                <div 
                  className={`h-full transition-all duration-500 ${
                    c.baseId === 'sasuke' ? 'bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_5px_rgba(168,85,247,0.5)]' 
                    : c.baseId === 'peter' ? 'bg-green-500/80 shadow-[0_0_5px_rgba(34,197,94,0.5)]'
                    : c.baseId === 'gojo'  ? 'bg-gradient-to-r from-blue-400 to-cyan-300 shadow-[0_0_8px_rgba(59,130,246,0.7)]'
                    : c.baseId === 'frieren' ? 'bg-gradient-to-r from-pink-400 to-purple-400 shadow-[0_0_8px_rgba(236,72,153,0.7)]'
                    : 'bg-orange-500/80'
                  }`} 
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
