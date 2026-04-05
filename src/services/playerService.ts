import { supabase } from '@/integrations/supabase/client';

export const getPlayerInfo = async (userId: string) => {
  const { data, error } = await (supabase as any)
    .from('players')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

export const getPlayerCharacters = async (userId: string) => {
  const { data, error } = await (supabase as any)
    .from('player_characters')
    .select(`
      *,
      equip_shoes_id,
      equip_hat_id,
      equip_armor_id,
      equip_ring_id,
      equip_belt_id,
      equip_artifact_id
    `)
    .eq('player_id', userId);
  
  if (error) throw error;
  return data;
};

export const equipItemToCharacter = async (
  userId: string, 
  characterId: string, 
  slot: string, 
  equipmentId: string | null
) => {
  const column = `equip_${slot}_id`;
  const { error } = await (supabase as any)
    .from('player_characters')
    .update({ [column]: equipmentId })
    .eq('player_id', userId)
    .eq('character_id', characterId);
  
  if (error) throw error;
};

export const upgradeCharacterStar = async (userId: string, characterId: string, newStar: number, remainingShards: number) => {
  const { error } = await (supabase as any)
    .from('player_characters')
    .update({ star_level: newStar, shards: remainingShards })
    .eq('player_id', userId)
    .eq('character_id', characterId);
  
  if (error) throw error;
}

export const updateTeamSetup = async (userId: string, teamSetup: any[], combatPower: number) => {
  const { error } = await (supabase as any)
    .from('players')
    .update({ team_setup: teamSetup, combat_power: combatPower })
    .eq('id', userId);
  
  if (error) throw error;
}

export const getLeaderboard = async () => {
  const { data: rankData, error: rankErr } = await (supabase as any)
    .from('players')
    .select('id, username, pvp_rank_level, pvp_stars, combat_power, avatar_url, frame_url')
    .order('pvp_rank_level', { ascending: false })
    .order('pvp_stars', { ascending: false })
    .limit(50);
    
  const { data: powerData, error: powerErr } = await (supabase as any)
    .from('players')
    .select('id, username, pvp_rank_level, pvp_stars, combat_power, avatar_url, frame_url')
    .order('combat_power', { ascending: false })
    .limit(50);

  if (rankErr) throw rankErr;
  if (powerErr) throw powerErr;
  
  return { rankLeaderboard: rankData, powerLeaderboard: powerData };
}

export const getArenaOpponents = async (userId: string, currentRank: number) => {
  const { data, error } = await (supabase as any)
    .from('players')
    .select('id, username, pvp_rank_level, pvp_stars, combat_power, team_setup, avatar_url, frame_url')
    .neq('id', userId)
    .order('pvp_rank_level', { ascending: false })
    .limit(30);
    
  if (error) throw error;
  
  if (!data || data.length === 0) return [];

  const similar = [...data].sort((a,b) => Math.abs(a.pvp_rank_level - currentRank) - Math.abs(b.pvp_rank_level - currentRank));
  const left = similar[0] || data[0];
  const right = similar[1] || data[1] || data[0];
  
  const higher = [...data].sort((a,b) => b.pvp_rank_level - a.pvp_rank_level);
  let middle = higher.find(p => p.id !== left.id && p.id !== right.id);
  if (!middle) middle = data[0];
  
  return [left, middle, right];
}

export const updatePlayerProfile = async (userId: string, username: string, bio: string, avatarUrl: string, frameUrl: string) => {
  const { error } = await (supabase as any)
    .from('players')
    .update({ username, bio, avatar_url: avatarUrl, frame_url: frameUrl })
    .eq('id', userId);
  
  if (error) {
    if (error.message && error.message.includes('unique constraint')) {
      throw new Error('Tên người chơi này đã tồn tại!');
    }
    throw error;
  }
}

export const upgradeEquipment = async (userId: string, equipmentId: string, stonesCount: number, stoneId: string, success: boolean) => {
  const { error } = await (supabase as any).rpc('rpc_upgrade_equipment', {
    p_player_id: userId,
    p_equipment_id: equipmentId,
    p_stones_count: stonesCount,
    p_stone_id: stoneId,
    p_success: success
  });
  if (error) throw error;
};

/**
 * Load opponent's player_characters WITH their actual equipped items.
 * Used by BattleScreen (ranked mode) to give the enemy team their real gear stats.
 */
export const getOpponentHydratedCharacters = async (opponentId: string) => {
  const slotCols = ['equip_shoes_id', 'equip_hat_id', 'equip_armor_id', 'equip_ring_id', 'equip_belt_id', 'equip_artifact_id'];

  // 1. Fetch opponent's character slots
  const { data: charRows, error: charErr } = await (supabase as any)
    .from('player_characters')
    .select('character_id, star_level, ' + slotCols.join(', '))
    .eq('player_id', opponentId);

  if (charErr) throw charErr;
  if (!charRows || charRows.length === 0) return [];

  // 2. Collect unique equipment IDs
  const equipIds: string[] = [];
  charRows.forEach((row: any) => {
    slotCols.forEach(col => { if (row[col]) equipIds.push(row[col]); });
  });

  // 3. Bulk-fetch equipment rows 
  let equipMap: Record<string, any> = {};
  if (equipIds.length > 0) {
    const { data: equipRows, error: equipErr } = await (supabase as any)
      .from('equipments')
      .select('*')
      .in('id', equipIds);
    if (!equipErr) (equipRows || []).forEach((eq: any) => { equipMap[eq.id] = eq; });
  }

  // 4. Assemble character rows with full equipment objects
  return charRows.map((row: any) => ({
    character_id: row.character_id,
    star_level: row.star_level || 1,
    equipment: {
      shoes:    equipMap[row.equip_shoes_id]    ?? null,
      hat:      equipMap[row.equip_hat_id]      ?? null,
      armor:    equipMap[row.equip_armor_id]    ?? null,
      ring:     equipMap[row.equip_ring_id]     ?? null,
      belt:     equipMap[row.equip_belt_id]     ?? null,
      artifact: equipMap[row.equip_artifact_id] ?? null,
    },
  }));
};

