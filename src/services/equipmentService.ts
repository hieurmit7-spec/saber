import { supabase } from '@/integrations/supabase/client';

export const getInventory = async (userId: string) => {
  const { data, error } = await (supabase as any)
    .from('equipments')
    .select('*')
    .eq('player_id', userId);
  
  if (error) throw error;
  return data;
};

export const getPlayerMaterials = async (userId: string) => {
  const { data, error } = await (supabase as any)
    .from('player_materials')
    .select('*')
    .eq('player_id', userId);
  
  if (error) throw error;
  return data;
};

export const deleteEquipments = async (userId: string, equipmentIds: string[]) => {
  const { error } = await (supabase as any)
    .from('equipments')
    .delete()
    .eq('player_id', userId)
    .in('id', equipmentIds);
    
  if (error) throw error;
  return true;
};

export const transferEquipmentLevel = async (
  userId: string, 
  sourceId: string, 
  targetId: string, 
  coinCost: number, 
  kcCost: number,
  ticketAmount: number
) => {
  const { error } = await (supabase as any).rpc('rpc_transfer_equipment', {
    p_player_id: userId,
    p_source_id: sourceId,
    p_target_id: targetId,
    p_coin_cost: coinCost,
    p_kc_cost: kcCost,
    p_ticket_amount: ticketAmount
  });
  
  if (error) throw error;
  return true;
};
