import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlayerInfo, getPlayerCharacters, equipItemToCharacter, upgradeCharacterStar, upgradeCharacterLevel, updatePlayerKC, updatePlayerCoins, breakthroughCharacter, updateTeamSetup, getLeaderboard, getArenaOpponents, updatePlayerProfile, upgradeEquipment } from '@/services/playerService';
import { getInventory, getPlayerMaterials, deleteEquipments } from '@/services/equipmentService';
import { rollGachaRPC } from '@/services/gachaService';
import { SABER, SASUKE, PETER, GOJO, FRIEREN, BASE_CHARACTERS } from '@/constants/gameData';
import { useMemo } from 'react';
import { toast } from 'sonner';

export const usePlayer = (userId: string) => {
  return useQuery({
    queryKey: ['player', userId],
    queryFn: () => getPlayerInfo(userId),
    enabled: !!userId,
  });
};

export const usePlayerCharacters = (userId: string) => {
  return useQuery({
    queryKey: ['characters', userId],
    queryFn: () => getPlayerCharacters(userId),
    enabled: !!userId,
  });
};

export const useInventory = (userId: string) => {
  return useQuery({
    queryKey: ['inventory', userId],
    queryFn: () => getInventory(userId),
    enabled: !!userId,
  });
};

export const useHydratedCharacters = (userId: string) => {
  const { data: dbChars, isLoading: charsLoading } = usePlayerCharacters(userId);
  const { data: inventory, isLoading: invLoading } = useInventory(userId);

  const characters = useMemo(() => {
    if (!dbChars || !inventory) return [];
    
    // Optimization: Create a Map for O(1) inventory lookups
    const inventoryMap = new Map(inventory.map((item: any) => [item.id, item]));

    return [SABER, SASUKE, PETER, GOJO, FRIEREN, ...BASE_CHARACTERS].map(baseChar => {
      const dbInfo = dbChars.find((c: any) => c.character_id === baseChar.id);
      
      const hydratedEquipments = {
        shoes: dbInfo?.equip_shoes_id ? inventoryMap.get(dbInfo.equip_shoes_id) : null,
        hat: dbInfo?.equip_hat_id ? inventoryMap.get(dbInfo.equip_hat_id) : null,
        armor: dbInfo?.equip_armor_id ? inventoryMap.get(dbInfo.equip_armor_id) : null,
        ring: dbInfo?.equip_ring_id ? inventoryMap.get(dbInfo.equip_ring_id) : null,
        belt: dbInfo?.equip_belt_id ? inventoryMap.get(dbInfo.equip_belt_id) : null,
        artifact: dbInfo?.equip_artifact_id ? inventoryMap.get(dbInfo.equip_artifact_id) : null,
      };

      return {
        ...baseChar,
        stars: dbInfo?.star_level || 1,
        shards: dbInfo?.shards || 0,
        level: dbInfo?.level || 1,
        realm_rank: dbInfo?.realm_rank || 0,
        exp: dbInfo?.exp || 0,
        equipment: hydratedEquipments,
        isUnlocked: !!dbInfo
      };
    });
  }, [dbChars, inventory]);

  return { characters, isLoading: charsLoading || invLoading };
};

// Optimistic Update Mutations
export const useEquipItem = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ characterId, slot, equipmentId }: { characterId: string, slot: string, equipmentId: string | null }) => 
      equipItemToCharacter(userId, characterId, slot, equipmentId),
    onMutate: async ({ characterId, slot, equipmentId }) => {
      await queryClient.cancelQueries({ queryKey: ['characters', userId] });
      const previousChars = queryClient.getQueryData(['characters', userId]);
      
      // Optimistically update
      queryClient.setQueryData(['characters', userId], (old: any) => {
        if (!old) return old;
        return old.map((c: any) => {
          if (c.character_id === characterId) {
            return { ...c, [`equip_${slot}_id`]: equipmentId };
          }
          return c;
        });
      });
      return { previousChars };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['characters', userId], context?.previousChars);
      toast.error('Lỗi khi gắn trang bị!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['characters', userId] });
    }
  });
};

export function useUpgradeStar(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ characterId, newStar, remainingShards }: { characterId: string; newStar: number; remainingShards: number }) =>
      upgradeCharacterStar(userId, characterId, newStar, remainingShards),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters', userId] });
      toast.success('Đột phá sao thành công!');
    },
    onError: (err: any) => {
      toast.error('Đột phá thất bại: ' + err.message);
    }
  });
}

export function useUpgradeLevel(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ characterId, newLevel, cost }: { characterId: string; newLevel: number; cost: number }) => {
      // 1. Get player info to check currency
      const player = await getPlayerInfo(userId);
      if (player.coins < cost) {
        throw new Error('Không đủ Vàng (Coins)!');
      }

      // 2. Perform updates
      const newBalance = player.coins - cost;
      await updatePlayerCoins(userId, newBalance);
      await upgradeCharacterLevel(userId, characterId, newLevel);
      
      return { newLevel, newBalance };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player', userId] });
      queryClient.invalidateQueries({ queryKey: ['characters', userId] });
      toast.success('Thăng cấp thành công!');
    },
    onError: (err: any) => {
      toast.error('Thăng cấp thất bại: ' + err.message);
    }
  });
}

export function useBreakthrough(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { 
      characterId: string; 
      costStone: number; 
      costKC: number; 
      success: boolean;
    }) => {
      // Logic for cost check is mostly in RPC but good to check here too for experience
      return breakthroughCharacter(userId, params.characterId, params.costStone, params.costKC, params.success);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['player', userId] });
      queryClient.invalidateQueries({ queryKey: ['characters', userId] });
      queryClient.invalidateQueries({ queryKey: ['materials', userId] });
      
      if (variables.success) {
        toast.success('Đột phá cảnh giới thành công!');
      } else {
        toast.error('Đột phá thất bại! Tài nguyên đã bị tiêu hao.');
      }
    },
    onError: (err: any) => {
      toast.error('Lỗi đột phá: ' + err.message);
    }
  });
}

export const useRollGacha = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cost, equipments, shards, materials }: { cost: number, equipments: any[], shards: any[], materials: any[] }) =>
      rollGachaRPC(userId, cost, equipments, shards, materials),
    onSuccess: () => {
      // Invalidate everything to refresh currency, inventory, and shards
      queryClient.invalidateQueries({ queryKey: ['player', userId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', userId] });
      queryClient.invalidateQueries({ queryKey: ['characters', userId] });
      queryClient.invalidateQueries({ queryKey: ['materials', userId] });
    },
    onError: (err: any) => {
      console.error("LỖI GACHA TỪ MÁY CHỦ:", err);
      toast.error(err.message || 'Lỗi khi lưu Gacha! Hãy kiểm tra console.');
    }
  });
};

export const useUpdateTeamSetup = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamSetup, combatPower }: { teamSetup: any[], combatPower: number }) =>
      updateTeamSetup(userId, teamSetup, combatPower),
    onSuccess: () => {
      toast.success('Đã lưu đội hình!');
      queryClient.invalidateQueries({ queryKey: ['player', userId] });
    }
  });
};

export const useLeaderboard = () => {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => getLeaderboard(),
  });
};

export const useArenaOpponents = (userId: string, currentRank: number) => {
  return useQuery({
    queryKey: ['arenaOpponents', userId, currentRank],
    queryFn: () => getArenaOpponents(userId, currentRank),
    enabled: !!userId && currentRank !== undefined,
  });
};

export const useUpdateProfile = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, bio, avatarUrl, frameUrl }: { username: string, bio: string, avatarUrl: string, frameUrl: string }) =>
      updatePlayerProfile(userId, username, bio, avatarUrl, frameUrl),
    onSuccess: () => {
      toast.success('Đã cập nhật hồ sơ!');
      queryClient.invalidateQueries({ queryKey: ['player', userId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Lỗi lưu hồ sơ!');
    }
  });
};
export const useMaterials = (userId: string) => {
  return useQuery({
    queryKey: ['materials', userId],
    queryFn: () => getPlayerMaterials(userId),
    enabled: !!userId,
  });
};

export const useUpgradeEquipment = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ equipmentId, stoneId, stonesCount, success }: { equipmentId: string, stoneId: string, stonesCount: number, success: boolean }) =>
      upgradeEquipment(userId, equipmentId, stonesCount, stoneId, success),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters', userId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', userId] });
      queryClient.invalidateQueries({ queryKey: ['materials', userId] });
    }
  });
};

export const useDeleteEquipments = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (equipmentIds: string[]) => deleteEquipments(userId, equipmentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', userId] });
      queryClient.invalidateQueries({ queryKey: ['characters', userId] });
      toast.success('Đã tiêu hủy trang bị thành công!');
    },
    onError: (err: any) => {
      toast.error('Lỗi khi tiêu hủy: ' + err.message);
    }
  });
};
