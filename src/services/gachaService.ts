import { supabase } from '@/integrations/supabase/client';
import { Equipment } from '@/stores/gameStore';

export const rollGachaRPC = async (
  userId: string,
  cost: number,
  equipments: any[],
  character_shards: { character_id: string, amount: number }[],
  materials: { material_id: string, amount: number }[]
) => {
  const { error } = await (supabase as any).rpc('rpc_roll_gacha', {
    p_player_id: userId,
    p_cost: cost,
    p_equipments: equipments,
    p_shards: character_shards,
    p_materials: materials
  });
  
  if (error) throw error;
};
