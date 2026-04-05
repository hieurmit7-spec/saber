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
