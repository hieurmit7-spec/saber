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
