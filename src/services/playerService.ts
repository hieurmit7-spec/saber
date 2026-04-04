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
