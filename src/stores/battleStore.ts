import { create } from 'zustand';
import { type GameCharacter, getCharacterTotalStats } from './gameStore';

export interface BattleUnit {
  id: string;
  charId: string;
  name: string;
  team: 'player' | 'enemy';
  position: 'front' | 'back';
  slotIndex: number;
  currentHp: number;
  maxHp: number;
  speed: number;
  armor: number;
  dmg: number;
  stars: number;
  skills: GameCharacter['skills'];
  darknessStacks: number;
  isAlive: boolean;
  isSaber: boolean;
  ultCooldown: number;
}

export interface BattleLog {
  id: number;
  text: string;
  type: 'attack' | 'skill' | 'ultimate' | 'passive' | 'death' | 'info';
}

type BattlePhase = 'modeSelect' | 'prep' | 'combat' | 'result' | 'ultimateCinematic';
type BattleMode = 'pve' | 'pvp-private' | 'pvp-ranked';

interface BattleState {
  phase: BattlePhase;
  mode: BattleMode;
  pveLevel: number;
  formation: (string | null)[]; // 5 slots: [front1, front2, back1, back2, back3]
  playerUnits: BattleUnit[];
  enemyUnits: BattleUnit[];
  turnOrder: BattleUnit[];
  currentTurnIndex: number;
  round: number;
  logs: BattleLog[];
  isAutoBattle: boolean;
  playingUltimate: boolean;
  winner: 'player' | 'enemy' | null;
  targetingUnit: string | null;
  targetedUnit: string | null;
  pvpRoomCode: string | null;
  pvpJoinCode: string;
  searchTimer: number;
  reward: number;

  setPhase: (p: BattlePhase) => void;
  setMode: (m: BattleMode) => void;
  setPveLevel: (l: number) => void;
  setFormation: (f: (string | null)[]) => void;
  setFormationSlot: (index: number, charId: string | null) => void;
  startBattle: (playerChars: GameCharacter[]) => void;
  nextTurn: () => void;
  executeAttack: (attackerId: string, targetId: string, useUltimate?: boolean) => void;
  toggleAutoBattle: () => void;
  setPlayingUltimate: (v: boolean) => void;
  setTargeting: (attacker: string | null, target: string | null) => void;
  createRoom: () => void;
  setPvpJoinCode: (code: string) => void;
  setSearchTimer: (t: number) => void;
  resetBattle: () => void;
}

let logCounter = 0;

function generateEnemyTeam(level: number): BattleUnit[] {
  const names = ['Goblin', 'Orc', 'Dark Knight', 'Shadow Mage', 'Skeleton'];
  const mult = 0.5 + level * 0.3;
  const count = Math.min(2 + level, 5);
  const units: BattleUnit[] = [];

  for (let i = 0; i < count; i++) {
    const isFront = i < 2;
    units.push({
      id: `enemy-${i}`,
      charId: `enemy-${i}`,
      name: names[i % names.length],
      team: 'enemy',
      position: isFront ? 'front' : 'back',
      slotIndex: i,
      currentHp: Math.floor(500 * mult),
      maxHp: Math.floor(500 * mult),
      speed: Math.floor(50 + Math.random() * 30 * mult),
      armor: Math.floor(300 * mult),
      dmg: Math.floor(100 * mult),
      stars: 1,
      skills: [],
      darknessStacks: 0,
      isAlive: true,
      isSaber: false,
      ultCooldown: 0,
    });
  }
  return units;
}

function charToUnit(char: GameCharacter, team: 'player' | 'enemy', slotIndex: number): BattleUnit {
  const stats = getCharacterTotalStats(char);
  return {
    id: `${team}-${char.id}`,
    charId: char.id,
    name: char.name,
    team,
    position: slotIndex < 2 ? 'front' : 'back',
    slotIndex,
    currentHp: stats.hp,
    maxHp: stats.hp,
    speed: stats.speed,
    armor: stats.armor,
    dmg: stats.dmg,
    stars: char.stars,
    skills: char.skills,
    darknessStacks: 0,
    isAlive: true,
    isSaber: char.id === 'saber',
    ultCooldown: 0,
  };
}

function calculateDamage(attacker: BattleUnit, defender: BattleUnit, multiplier: number, ignoreArmor: boolean): number {
  const rawDmg = attacker.dmg * multiplier;
  if (ignoreArmor) return Math.floor(rawDmg);
  const armorMitigation = Math.min(defender.armor / 3000, 0.5); // max 50% at 1500 armor
  return Math.floor(rawDmg * (1 - armorMitigation));
}

export const useBattleStore = create<BattleState>((set, get) => ({
  phase: 'modeSelect',
  mode: 'pve',
  pveLevel: 1,
  formation: [null, null, null, null, null],
  playerUnits: [],
  enemyUnits: [],
  turnOrder: [],
  currentTurnIndex: 0,
  round: 1,
  logs: [],
  isAutoBattle: false,
  playingUltimate: false,
  winner: null,
  targetingUnit: null,
  targetedUnit: null,
  pvpRoomCode: null,
  pvpJoinCode: '',
  searchTimer: 0,
  reward: 0,

  setPhase: (p) => set({ phase: p }),
  setMode: (m) => set({ mode: m }),
  setPveLevel: (l) => set({ pveLevel: l }),
  setFormation: (f) => set({ formation: f }),
  setFormationSlot: (index, charId) => set((s) => {
    const f = [...s.formation];
    // Remove char from old slot if exists
    const oldIndex = f.indexOf(charId);
    if (oldIndex !== -1) f[oldIndex] = null;
    f[index] = charId;
    return { formation: f };
  }),

  startBattle: (playerChars) => {
    const state = get();
    const playerUnits: BattleUnit[] = [];
    state.formation.forEach((charId, i) => {
      if (charId) {
        const char = playerChars.find(c => c.id === charId);
        if (char) playerUnits.push(charToUnit(char, 'player', i));
      }
    });

    // Auto-forward: if no front units, move back to front
    const frontUnits = playerUnits.filter(u => u.position === 'front');
    if (frontUnits.length === 0) {
      const backUnits = playerUnits.filter(u => u.position === 'back');
      backUnits.forEach((u, i) => {
        if (i < 2) { u.position = 'front'; u.slotIndex = i; }
      });
    }

    const enemyUnits = generateEnemyTeam(state.pveLevel);
    const allUnits = [...playerUnits, ...enemyUnits].sort((a, b) => b.speed - a.speed);

    const reward = Math.max(20, 120 - state.pveLevel * 20 + 20);
    // Level 7: 100, Level 6: 80, ..., Level 1: 20

    set({
      phase: 'combat',
      playerUnits,
      enemyUnits,
      turnOrder: allUnits,
      currentTurnIndex: 0,
      round: 1,
      logs: [{ id: ++logCounter, text: `Vòng 1 bắt đầu!`, type: 'info' }],
      winner: null,
      reward: Math.max(20, 100 - (7 - state.pveLevel) * (80/6)),
    });
  },

  nextTurn: () => set((s) => {
    const aliveUnits = s.turnOrder.filter(u => u.isAlive);
    if (aliveUnits.length === 0) return {};

    let nextIndex = s.currentTurnIndex + 1;
    // Skip dead units
    while (nextIndex < s.turnOrder.length && !s.turnOrder[nextIndex].isAlive) {
      nextIndex++;
    }

    if (nextIndex >= s.turnOrder.length) {
      // New round
      const newRound = s.round + 1;
      return {
        currentTurnIndex: 0,
        round: newRound,
        logs: [...s.logs, { id: ++logCounter, text: `Vòng ${newRound} bắt đầu!`, type: 'info' }],
      };
    }
    return { currentTurnIndex: nextIndex };
  }),

  executeAttack: (attackerId, targetId, useUltimate = false) => {
    const state = get();
    const allUnits = [...state.playerUnits, ...state.enemyUnits];
    const attacker = allUnits.find(u => u.id === attackerId);
    const target = allUnits.find(u => u.id === targetId);
    if (!attacker || !target || !attacker.isAlive || !target.isAlive) return;

    const newLogs = [...state.logs];
    let newPlayerUnits = state.playerUnits.map(u => ({ ...u }));
    let newEnemyUnits = state.enemyUnits.map(u => ({ ...u }));
    const getAllUnits = () => [...newPlayerUnits, ...newEnemyUnits];
    const findUnit = (id: string) => getAllUnits().find(u => u.id === id)!;
    const attackerUnit = findUnit(attackerId);

    if (useUltimate && attackerUnit.isSaber) {
      // Excalibur
      const stacksNeeded = attackerUnit.stars >= 4 ? 2 : 3;
      if (attackerUnit.darknessStacks >= stacksNeeded) {
        const ignoreArmor = attackerUnit.stars >= 6;
        attackerUnit.darknessStacks = 0;

        // Damage all enemies
        const enemies = attackerUnit.team === 'player' ? newEnemyUnits : newPlayerUnits;
        enemies.forEach(e => {
          if (e.isAlive) {
            const dmg = calculateDamage(attackerUnit, e, 4.0, ignoreArmor);
            e.currentHp = Math.max(0, e.currentHp - dmg);
            if (e.currentHp <= 0) e.isAlive = false;
            newLogs.push({ id: ++logCounter, text: `⚔️ Excalibur! ${attackerUnit.name} → ${e.name}: ${dmg} dmg${e.currentHp <= 0 ? ' 💀' : ''}`, type: 'ultimate' });
          }
        });

        // Heal all allies 120% ATK
        const allies = attackerUnit.team === 'player' ? newPlayerUnits : newEnemyUnits;
        allies.forEach(a => {
          if (a.isAlive) {
            const heal = Math.floor(attackerUnit.dmg * 1.2);
            a.currentHp = Math.min(a.maxHp, a.currentHp + heal);
            newLogs.push({ id: ++logCounter, text: `✨ ${attackerUnit.name} hồi ${heal} HP cho ${a.name}`, type: 'ultimate' });
          }
        });
      }
    } else {
      // Basic attack
      const targetUnit = findUnit(targetId);
      let dmg = calculateDamage(attackerUnit, targetUnit, 1.0, false);
      targetUnit.currentHp = Math.max(0, targetUnit.currentHp - dmg);
      if (targetUnit.currentHp <= 0) targetUnit.isAlive = false;
      newLogs.push({ id: ++logCounter, text: `⚔️ ${attackerUnit.name} → ${targetUnit.name}: ${dmg} dmg${targetUnit.currentHp <= 0 ? ' 💀' : ''}`, type: 'attack' });

      // Saber passive check
      if (attackerUnit.isSaber) {
        const passiveChance = attackerUnit.stars >= 2 ? 0.7 : 0.5;
        if (Math.random() < passiveChance) {
          const bonusDmg = Math.floor(dmg * 1.2);
          targetUnit.currentHp = Math.max(0, targetUnit.currentHp - bonusDmg);
          if (targetUnit.currentHp <= 0) targetUnit.isAlive = false;
          attackerUnit.darknessStacks++;
          newLogs.push({ id: ++logCounter, text: `🌑 Instinct! +${bonusDmg} dmg, Darkness Stack: ${attackerUnit.darknessStacks}`, type: 'passive' });
        }
      }
    }

    // Check win condition
    const playerAlive = newPlayerUnits.some(u => u.isAlive);
    const enemyAlive = newEnemyUnits.some(u => u.isAlive);
    let winner: 'player' | 'enemy' | null = null;
    if (!enemyAlive) winner = 'player';
    else if (!playerAlive) winner = 'enemy';

    // Auto-forward: if front is dead, move back units forward
    [newPlayerUnits, newEnemyUnits].forEach(team => {
      const aliveFront = team.filter(u => u.isAlive && u.position === 'front');
      if (aliveFront.length === 0) {
        const aliveBack = team.filter(u => u.isAlive && u.position === 'back');
        aliveBack.forEach((u, i) => {
          if (i < 2) u.position = 'front';
        });
      }
    });

    // Update turn order
    const newTurnOrder = state.turnOrder.map(u => {
      const updated = getAllUnits().find(uu => uu.id === u.id);
      return updated || u;
    });

    set({
      playerUnits: newPlayerUnits,
      enemyUnits: newEnemyUnits,
      logs: newLogs,
      turnOrder: newTurnOrder,
      winner,
      phase: winner ? 'result' : state.phase,
      targetingUnit: null,
      targetedUnit: null,
    });
  },

  toggleAutoBattle: () => set(s => ({ isAutoBattle: !s.isAutoBattle })),
  setPlayingUltimate: (v) => set({ playingUltimate: v, phase: v ? 'ultimateCinematic' : 'combat' }),
  setTargeting: (attacker, target) => set({ targetingUnit: attacker, targetedUnit: target }),
  createRoom: () => set({ pvpRoomCode: Math.random().toString(36).substring(2, 8).toUpperCase() }),
  setPvpJoinCode: (code) => set({ pvpJoinCode: code }),
  setSearchTimer: (t) => set({ searchTimer: t }),

  resetBattle: () => set({
    phase: 'modeSelect',
    playerUnits: [],
    enemyUnits: [],
    turnOrder: [],
    currentTurnIndex: 0,
    round: 1,
    logs: [],
    winner: null,
    playingUltimate: false,
    targetingUnit: null,
    targetedUnit: null,
    pvpRoomCode: null,
    pvpJoinCode: '',
    searchTimer: 0,
  }),
}));
