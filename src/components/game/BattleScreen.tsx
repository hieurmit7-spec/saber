import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useBattleStore, type BattleUnit } from '@/stores/battleStore';
import { ArrowLeft, Swords, Shield, Zap, Play, Users, FastForward } from 'lucide-react';
import arenaBg from '@/assets/arena-bg.jpg';

// ─── FLOATING DAMAGE NUMBER ──────────────────────────────
interface FloatingNumber {
  id: number;
  value: string;
  x: number;
  y: number;
  color: string;
  icon?: string;
}

let floatId = 0;

// ─── MODE SELECT ─────────────────────────────────────────
function ModeSelect() {
  const { setPhase, setMode, setPveLevel, createRoom, pvpRoomCode, pvpJoinCode, setPvpJoinCode } = useBattleStore();
  const [tab, setTab] = useState<'pve' | 'pvp'>('pve');
  const [pvpType, setPvpType] = useState<'private' | 'ranked'>('private');

  const startPve = (level: number) => {
    setPveLevel(level);
    setMode('pve');
    setPhase('prep');
  };

  const startPvpPrivate = () => {
    setMode('pvp-private');
    setPhase('prep');
  };

  const startPvpRanked = () => {
    setMode('pvp-ranked');
    setPhase('prep');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4"
      style={{ backgroundImage: `url(${arenaBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="bg-overlay/80 backdrop-blur-sm rounded-2xl p-8 border border-border max-w-lg w-full">
        <div className="flex gap-2 mb-6 justify-center">
          <button onClick={() => setTab('pve')}
            className={`font-display px-6 py-2 rounded-lg text-sm tracking-wider transition-all ${tab === 'pve' ? 'gradient-gold text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
            PvE
          </button>
          <button onClick={() => setTab('pvp')}
            className={`font-display px-6 py-2 rounded-lg text-sm tracking-wider transition-all ${tab === 'pvp' ? 'gradient-gold text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
            PvP
          </button>
        </div>

        {tab === 'pve' ? (
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((level) => {
              const reward = Math.max(20, 100 - (7 - level) * Math.floor(80 / 6));
              return (
                <button key={level} onClick={() => startPve(level)}
                  className="flex flex-col items-center gap-1 p-4 rounded-xl bg-secondary/60 border border-border hover:border-gold/50 hover:bg-secondary transition-all">
                  <Swords className="w-6 h-6 text-gold" />
                  <span className="font-display text-foreground text-sm">Lv.{level}</span>
                  <span className="text-[10px] text-gold">+{reward} KC</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex gap-2 w-full">
              <button onClick={() => setPvpType('private')}
                className={`flex-1 py-2 rounded-lg font-display text-sm ${pvpType === 'private' ? 'bg-secondary text-gold' : 'text-muted-foreground'}`}>
                Phòng riêng
              </button>
              <button onClick={() => setPvpType('ranked')}
                className={`flex-1 py-2 rounded-lg font-display text-sm ${pvpType === 'ranked' ? 'bg-secondary text-gold' : 'text-muted-foreground'}`}>
                Xếp hạng
              </button>
            </div>

            {pvpType === 'private' ? (
              <div className="flex flex-col gap-3 w-full">
                <button onClick={() => { createRoom(); }}
                  className="gradient-gold text-primary-foreground font-display py-3 rounded-xl text-sm tracking-wider">
                  Tạo phòng
                </button>
                {pvpRoomCode && (
                  <p className="text-center font-display text-gold-bright text-2xl tracking-[0.3em]">{pvpRoomCode}</p>
                )}
                <div className="flex gap-2">
                  <input
                    value={pvpJoinCode} onChange={(e) => setPvpJoinCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã phòng" maxLength={6}
                    className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-foreground font-display text-center tracking-widest"
                  />
                  <button onClick={startPvpPrivate} disabled={pvpJoinCode.length < 4}
                    className="gradient-gold text-primary-foreground font-display px-4 py-2 rounded-lg text-sm disabled:opacity-40">
                    Vào
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={startPvpRanked}
                className="gradient-gold text-primary-foreground font-display py-3 px-8 rounded-xl text-sm tracking-wider w-full">
                Tìm trận xếp hạng
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PREPARATION ─────────────────────────────────────────
function PrepPhase() {
  const characters = useGameStore(s => s.characters);
  const { formation, setFormationSlot, startBattle, setPhase } = useBattleStore();

  const handleStart = () => {
    const hasUnits = formation.some(f => f !== null);
    if (!hasUnits) return;
    startBattle(characters);
  };

  const slotLabels = ['Trước 1', 'Trước 2', 'Sau 1', 'Sau 2', 'Sau 3'];

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 relative"
      style={{ backgroundImage: `url(${arenaBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-overlay/60" />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <h3 className="font-display text-gold-bright text-lg tracking-widest">ĐỘI HÌNH</h3>

        {/* Formation Grid - Top-Bottom view */}
        <div className="flex flex-col gap-3 items-center">
          {/* Back row (top) */}
          <div className="flex gap-4">
            {[2, 3, 4].map(i => (
              <FormationSlot key={i} index={i} label={slotLabels[i]} charId={formation[i]} characters={characters} onSet={setFormationSlot} />
            ))}
          </div>
          {/* Front row (bottom, closer to center) */}
          <div className="flex gap-4">
            {[0, 1].map(i => (
              <FormationSlot key={i} index={i} label={slotLabels[i]} charId={formation[i]} characters={characters} onSet={setFormationSlot} />
            ))}
          </div>
        </div>

        {/* Available characters */}
        <div className="flex flex-wrap gap-2 justify-center">
          {characters.filter(c => !formation.includes(c.id)).map(char => (
            <button key={char.id}
              onClick={() => {
                const emptySlot = formation.indexOf(null);
                if (emptySlot !== -1) setFormationSlot(emptySlot, char.id);
              }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-secondary/50 border border-border hover:border-gold/50 transition-all backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center overflow-hidden">
                {char.id === 'saber' ? (
                  <img src="/videos/saber-avatar.gif" className="w-full h-full object-cover" alt={char.name} />
                ) : (
                  <span className="font-display text-sm text-foreground">{char.name[0]}</span>
                )}
              </div>
              <span className="text-[10px] font-display text-foreground">{char.name}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setPhase('modeSelect')} className="px-6 py-2 rounded-lg bg-secondary text-muted-foreground font-display text-sm">
            Quay lại
          </button>
          <button onClick={handleStart} disabled={!formation.some(f => f !== null)}
            className="gradient-gold text-primary-foreground font-display px-8 py-2 rounded-xl text-sm tracking-wider disabled:opacity-40 shadow-gold">
            Chiến đấu!
          </button>
        </div>
      </div>
    </div>
  );
}

function FormationSlot({ index, label, charId, characters, onSet }: {
  index: number; label: string; charId: string | null;
  characters: any[]; onSet: (i: number, id: string | null) => void;
}) {
  const char = characters.find((c: any) => c.id === charId);
  return (
    <button
      onClick={() => charId ? onSet(index, null) : undefined}
      className={`w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center transition-all backdrop-blur-sm
        ${char ? 'border-gold/50 bg-secondary/60' : 'border-border/40 border-dashed bg-secondary/20'}
      `}
    >
      {char ? (
        <>
          <div className="w-10 h-10 rounded-full bg-card overflow-hidden">
            {char.id === 'saber' ? (
              <img src="/videos/saber-avatar.gif" className="w-full h-full object-cover" alt={char.name} />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display text-foreground">{char.name[0]}</div>
            )}
          </div>
          <span className="text-[9px] font-display text-foreground mt-0.5">{char.name}</span>
        </>
      ) : (
        <span className="text-[9px] text-muted-foreground font-display">{label}</span>
      )}
    </button>
  );
}

// ─── COMBAT PHASE (TOP vs BOTTOM) ────────────────────────
function CombatPhase() {
  const {
    playerUnits, enemyUnits, turnOrder, currentTurnIndex, round, logs,
    isAutoBattle, toggleAutoBattle, executeAttack, nextTurn, playingUltimate,
    setPlayingUltimate, targetingUnit, targetedUnit, setTargeting, winner
  } = useBattleStore();

  const logRef = useRef<HTMLDivElement>(null);
  const ultVideoRef = useRef<HTMLVideoElement>(null);
  const currentUnit = turnOrder[currentTurnIndex];
  const isPlayerTurn = currentUnit?.team === 'player' && currentUnit?.isAlive;

  const [combatSpeed, setCombatSpeed] = useState<1 | 3>(1);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [attackingUnit, setAttackingUnit] = useState<string | null>(null);

  const speedMultiplier = combatSpeed;
  const baseDelay = (ms: number) => ms / speedMultiplier;

  // Add floating damage number
  const addFloatingNumber = useCallback((value: string, x: number, y: number, color: string, icon?: string) => {
    const id = ++floatId;
    setFloatingNumbers(prev => [...prev, { id, value, x, y, color, icon }]);
    setTimeout(() => {
      setFloatingNumbers(prev => prev.filter(f => f.id !== id));
    }, 1500 / speedMultiplier);
  }, [speedMultiplier]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  // Set video playback rate for ultimate
  useEffect(() => {
    if (playingUltimate && ultVideoRef.current) {
      ultVideoRef.current.playbackRate = combatSpeed;
    }
  }, [playingUltimate, combatSpeed]);

  // Auto battle logic
  useEffect(() => {
    if (!currentUnit || !currentUnit.isAlive || winner) return;

    if (currentUnit.team === 'enemy' || isAutoBattle) {
      const timer = setTimeout(() => {
        const targets = currentUnit.team === 'player' ? enemyUnits : playerUnits;
        const aliveTargets = targets.filter(u => u.isAlive);
        if (aliveTargets.length === 0) return;

        // Check for Saber ultimate
        if (currentUnit.isSaber) {
          const stacksNeeded = currentUnit.stars >= 4 ? 2 : 3;
          if (currentUnit.darknessStacks >= stacksNeeded) {
            setPlayingUltimate(true);
            setTimeout(() => {
              executeAttack(currentUnit.id, aliveTargets[0].id, true);
              setPlayingUltimate(false);
              nextTurn();
            }, baseDelay(12000));
            return;
          }
        }

        const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
        setAttackingUnit(currentUnit.id);
        setTargeting(currentUnit.id, target.id);

        // Spawn floating damage
        const dmgValue = Math.floor(currentUnit.dmg * (0.8 + Math.random() * 0.4));
        const targetIsEnemy = target.team === 'enemy';
        const xPos = 30 + Math.random() * 40;
        const yPos = targetIsEnemy ? 15 + Math.random() * 20 : 55 + Math.random() * 20;
        addFloatingNumber(String(dmgValue), xPos, yPos, 'hsl(var(--gold-bright))', '⚔️');

        setTimeout(() => {
          executeAttack(currentUnit.id, target.id);
          setAttackingUnit(null);
          nextTurn();
        }, baseDelay(600));
      }, baseDelay(800));
      return () => clearTimeout(timer);
    }
  }, [currentTurnIndex, isAutoBattle, currentUnit, winner, combatSpeed]);

  const handlePlayerAttack = (targetId: string, useUlt = false) => {
    if (!isPlayerTurn || winner) return;

    if (useUlt && currentUnit.isSaber) {
      setPlayingUltimate(true);
      setTimeout(() => {
        executeAttack(currentUnit.id, targetId, true);
        setPlayingUltimate(false);
        nextTurn();
      }, baseDelay(12000));
      return;
    }

    setAttackingUnit(currentUnit.id);
    setTargeting(currentUnit.id, targetId);

    const dmgValue = Math.floor(currentUnit.dmg * (0.8 + Math.random() * 0.4));
    const target = enemyUnits.find(u => u.id === targetId);
    if (target) {
      const xPos = 30 + Math.random() * 40;
      addFloatingNumber(String(dmgValue), xPos, 18, 'hsl(var(--gold-bright))', '⚔️');
    }

    setTimeout(() => {
      executeAttack(currentUnit.id, targetId);
      setAttackingUnit(null);
      nextTurn();
    }, baseDelay(400));
  };

  const canUseUlt = isPlayerTurn && currentUnit?.isSaber &&
    currentUnit.darknessStacks >= (currentUnit.stars >= 4 ? 2 : 3);

  // Separate units by position
  const enemyFront = enemyUnits.filter(u => u.position === 'front');
  const enemyBack = enemyUnits.filter(u => u.position === 'back');
  const playerFront = playerUnits.filter(u => u.position === 'front');
  const playerBack = playerUnits.filter(u => u.position === 'back');

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Arena Background */}
      <div className="absolute inset-0">
        <img src={arenaBg} className="w-full h-full object-cover opacity-40" alt="" />
        <div className="absolute inset-0 bg-gradient-to-b from-overlay/60 via-transparent to-overlay/60" />
      </div>

      {/* Ultimate Cinematic Overlay */}
      {playingUltimate && (
        <div className="absolute inset-0 z-50 bg-background flex items-center justify-center">
          <video ref={ultVideoRef} autoPlay playsInline className="w-full h-full object-cover">
            <source src="/videos/banner-ulti.mp4" type="video/mp4" />
          </video>
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="font-display text-gold-bright text-3xl tracking-[0.3em] drop-shadow-lg animate-pulse">
              EXCALIBUR!
            </p>
          </div>
        </div>
      )}

      {/* Floating Damage Numbers */}
      {floatingNumbers.map(fn => (
        <div key={fn.id}
          className="absolute z-40 pointer-events-none font-display text-2xl font-bold animate-float-up"
          style={{
            left: `${fn.x}%`,
            top: `${fn.y}%`,
            color: fn.color,
            textShadow: '0 0 10px currentColor, 0 2px 4px rgba(0,0,0,0.8)',
            animation: `floatUp ${1.5 / speedMultiplier}s ease-out forwards`,
          }}>
          {fn.icon && <span className="mr-1">{fn.icon}</span>}
          {fn.value}
        </div>
      ))}

      {/* Round + Speed indicator */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2">
        <span className="font-display text-xs text-gold tracking-widest">VÒNG {round}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCombatSpeed(combatSpeed === 1 ? 3 : 1)}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg font-display text-xs tracking-wider transition-all
              ${combatSpeed === 3 ? 'gradient-gold text-primary-foreground shadow-gold' : 'bg-secondary/80 text-muted-foreground'}
            `}>
            <FastForward className="w-3 h-3" />
            x{combatSpeed}
          </button>
        </div>
      </div>

      {/* ═══ ENEMY TEAM (TOP) - Attacking Downward ═══ */}
      <div className="relative z-10 flex flex-col items-center gap-2 pt-2">
        {/* Boss / Back row (topmost) */}
        <div className="flex justify-center gap-3">
          {enemyBack.map(unit => (
            <BattleUnitCard key={unit.id} unit={unit} facing="down"
              isTarget={targetedUnit === unit.id}
              isAttacking={attackingUnit === unit.id}
              onClick={() => isPlayerTurn && handlePlayerAttack(unit.id)}
              clickable={isPlayerTurn && unit.isAlive && !winner}
              speedMult={speedMultiplier}
            />
          ))}
        </div>
        {/* Enemy front row */}
        <div className="flex justify-center gap-3">
          {enemyFront.map(unit => (
            <BattleUnitCard key={unit.id} unit={unit} facing="down"
              isTarget={targetedUnit === unit.id}
              isAttacking={attackingUnit === unit.id}
              onClick={() => isPlayerTurn && handlePlayerAttack(unit.id)}
              clickable={isPlayerTurn && unit.isAlive && !winner}
              speedMult={speedMultiplier}
            />
          ))}
        </div>
      </div>

      {/* ═══ CENTER CLASH ZONE ═══ */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        {/* Targeting beam */}
        {targetingUnit && targetedUnit && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-1 h-full absolute"
              style={{
                background: 'linear-gradient(180deg, hsl(var(--gold-bright)) 0%, hsl(var(--destructive)) 50%, hsl(var(--gold-bright)) 100%)',
                opacity: 0.6,
                animation: `pulse ${0.5 / speedMultiplier}s ease-in-out infinite`,
              }}
            />
            {/* Energy burst at center */}
            <div className="w-16 h-16 rounded-full"
              style={{
                background: 'radial-gradient(circle, hsl(var(--gold-bright) / 0.6) 0%, transparent 70%)',
                animation: `pulse ${0.3 / speedMultiplier}s ease-in-out infinite`,
              }}
            />
          </div>
        )}
        {/* Arena center marker */}
        <div className="w-20 h-20 rounded-full border-2 border-gold/20 flex items-center justify-center">
          <Swords className="w-8 h-8 text-gold/30" />
        </div>
      </div>

      {/* ═══ PLAYER TEAM (BOTTOM) - Attacking Upward ═══ */}
      <div className="relative z-10 flex flex-col items-center gap-2 pb-2">
        {/* Player front row (closest to center) */}
        <div className="flex justify-center gap-3">
          {playerFront.map(unit => (
            <BattleUnitCard key={unit.id} unit={unit} facing="up"
              isActive={currentUnit?.id === unit.id}
              isAttacking={attackingUnit === unit.id}
              clickable={false}
              speedMult={speedMultiplier}
            />
          ))}
        </div>
        {/* Player back row */}
        <div className="flex justify-center gap-3">
          {playerBack.map(unit => (
            <BattleUnitCard key={unit.id} unit={unit} facing="up"
              isActive={currentUnit?.id === unit.id}
              isAttacking={attackingUnit === unit.id}
              clickable={false}
              speedMult={speedMultiplier}
            />
          ))}
        </div>
      </div>

      {/* ═══ CONTROLS BAR ═══ */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-3 border-t border-border bg-overlay/90 backdrop-blur-sm">
        <button onClick={toggleAutoBattle}
          className={`px-4 py-2 rounded-lg font-display text-xs tracking-wider transition-all
            ${isAutoBattle ? 'gradient-gold text-primary-foreground' : 'bg-secondary text-muted-foreground'}
          `}>
          {isAutoBattle ? 'AUTO: ON' : 'AUTO: OFF'}
        </button>

        {isPlayerTurn && currentUnit && (
          <div className="flex gap-2 flex-1 justify-center">
            <button
              onClick={() => {
                const targets = enemyUnits.filter(u => u.isAlive);
                if (targets.length > 0) handlePlayerAttack(targets[0].id);
              }}
              className="px-5 py-2.5 rounded-xl bg-secondary/80 text-foreground font-display text-sm hover:bg-secondary border border-border transition-all">
              ⚔️ Tấn công
            </button>
            {canUseUlt && (
              <button
                onClick={() => {
                  const targets = enemyUnits.filter(u => u.isAlive);
                  if (targets.length > 0) handlePlayerAttack(targets[0].id, true);
                }}
                className="gradient-gold text-primary-foreground px-5 py-2.5 rounded-xl font-display text-sm shadow-gold animate-pulse">
                ⚡ Excalibur
              </button>
            )}
          </div>
        )}

        {currentUnit?.isSaber && (
          <span className="text-[10px] text-muted-foreground font-display">
            🌑 {currentUnit.darknessStacks || 0}
          </span>
        )}
      </div>

      {/* ═══ BATTLE LOG ═══ */}
      <div ref={logRef} className="relative z-10 h-20 overflow-y-auto px-4 py-2 bg-overlay/95 border-t border-border text-xs space-y-0.5">
        {logs.slice(-20).map(log => (
          <p key={log.id} className={`font-body
            ${log.type === 'ultimate' ? 'text-gold-bright font-bold' : ''}
            ${log.type === 'death' ? 'text-destructive' : ''}
            ${log.type === 'passive' ? 'text-purple-400' : ''}
            ${log.type === 'info' ? 'text-muted-foreground' : ''}
            ${log.type === 'attack' ? 'text-foreground' : ''}
          `}>{log.text}</p>
        ))}
      </div>
    </div>
  );
}

// ─── BATTLE UNIT CARD (Top-vs-Bottom) ────────────────────
function BattleUnitCard({ unit, facing, isActive, isTarget, isAttacking, onClick, clickable, speedMult }: {
  unit: BattleUnit;
  facing: 'up' | 'down';
  isActive?: boolean;
  isTarget?: boolean;
  isAttacking?: boolean;
  onClick?: () => void;
  clickable?: boolean;
  speedMult: number;
}) {
  const hpPercent = (unit.currentHp / unit.maxHp) * 100;

  return (
    <button
      onClick={clickable ? onClick : undefined}
      disabled={!clickable || !unit.isAlive}
      className={`
        relative flex flex-col items-center gap-0.5 p-1.5 rounded-xl border-2 w-16 sm:w-[72px]
        transition-all
        ${!unit.isAlive ? 'opacity-25 grayscale border-border/20' : ''}
        ${isActive ? 'border-gold-bright shadow-gold scale-110 z-10' : ''}
        ${isTarget ? 'border-destructive shadow-[0_0_20px_rgba(239,68,68,0.6)] scale-105 z-10' : ''}
        ${isAttacking ? 'scale-110 z-10' : ''}
        ${!isActive && !isTarget && !isAttacking && unit.isAlive ? 'border-border/40' : ''}
        ${clickable && unit.isAlive ? 'cursor-pointer hover:border-gold/60 hover:scale-105' : ''}
        bg-card/70 backdrop-blur-sm
      `}
      style={{
        animation: isAttacking
          ? `${facing === 'up' ? 'attackUp' : 'attackDown'} ${0.4 / speedMult}s ease-in-out`
          : undefined,
      }}
    >
      {/* Energy aura for Saber */}
      {unit.isSaber && unit.isAlive && (
        <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(ellipse, hsl(var(--blue-glow) / 0.4) 0%, transparent 70%)',
              animation: `pulse ${2 / speedMult}s ease-in-out infinite`,
            }}
          />
        </div>
      )}

      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full overflow-hidden bg-secondary relative
        ${facing === 'down' ? 'rotate-180' : ''}`}
        style={{ transform: facing === 'down' ? 'scaleY(-1)' : undefined }}
      >
        {unit.isSaber ? (
          <img src="/videos/saber-avatar.gif" className="w-full h-full object-cover" alt={unit.name} />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-display text-xs text-foreground">
            {unit.name[0]}
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-[8px] font-display text-foreground truncate w-full text-center leading-tight">
        {unit.name}
      </span>

      {/* HP bar */}
      <div className="w-full h-1 bg-secondary/80 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${hpPercent > 50 ? 'bg-accent' : hpPercent > 20 ? 'bg-yellow-500' : 'bg-destructive'}`}
          style={{ width: `${hpPercent}%` }}
        />
      </div>
      <span className="text-[7px] text-muted-foreground leading-none">{unit.currentHp}</span>

      {/* Darkness stacks indicator */}
      {unit.isSaber && unit.darknessStacks > 0 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
          <span className="text-[7px] text-foreground font-bold">{unit.darknessStacks}</span>
        </div>
      )}
    </button>
  );
}

// ─── RESULT ──────────────────────────────────────────────
function ResultPhase() {
  const { winner, resetBattle, reward, mode } = useBattleStore();
  const { addCurrency, addPvpStar } = useGameStore();
  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    if (claimed) return;
    setClaimed(true);
    if (winner === 'player') {
      addCurrency(Math.floor(reward));
      if (mode === 'pvp-ranked') addPvpStar();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 relative"
      style={{ backgroundImage: `url(${arenaBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-overlay/70" />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <h2 className={`font-display text-4xl tracking-widest ${winner === 'player' ? 'text-gold-bright' : 'text-destructive'}`}
          style={{ textShadow: '0 0 30px currentColor' }}>
          {winner === 'player' ? 'CHIẾN THẮNG!' : 'THẤT BẠI'}
        </h2>
        {winner === 'player' && (
          <div className="flex items-center gap-2">
            <span className="text-gold font-display text-xl">+{Math.floor(reward)} KC</span>
          </div>
        )}
        <div className="flex gap-3">
          {!claimed && winner === 'player' && (
            <button onClick={handleClaim} className="gradient-gold text-primary-foreground font-display px-6 py-2 rounded-xl text-sm shadow-gold">
              Nhận thưởng
            </button>
          )}
          <button onClick={resetBattle} className="px-6 py-2 rounded-lg bg-secondary text-foreground font-display text-sm">
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN BATTLE SCREEN ──────────────────────────────────
export function BattleScreen() {
  const { phase, resetBattle } = useBattleStore();
  const setCurrentScreen = useGameStore(s => s.setCurrentScreen);

  return (
    <div className="w-full h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-overlay/80 backdrop-blur-sm z-20 relative">
        <button onClick={() => { resetBattle(); setCurrentScreen('main'); }}
          className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display text-xl text-gold-bright tracking-widest">CHIẾN ĐẤU</h2>
      </div>

      {phase === 'modeSelect' && <ModeSelect />}
      {phase === 'prep' && <PrepPhase />}
      {(phase === 'combat' || phase === 'ultimateCinematic') && <CombatPhase />}
      {phase === 'result' && <ResultPhase />}
    </div>
  );
}
