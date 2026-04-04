import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlayerInfo, getPlayerCharacters, equipItemToCharacter, upgradeCharacterStar, updateTeamSetup, getLeaderboard, getArenaOpponents, updatePlayerProfile } from '@/services/playerService';
import { getInventory } from '@/services/equipmentService';
import { rollGachaRPC } from '@/services/gachaService';
import { SABER, SASUKE, BASE_CHARACTERS } from '@/constants/gameData';
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
    return [SABER, SASUKE, ...BASE_CHARACTERS].map(baseChar => {
      const dbInfo = dbChars.find((c: any) => c.character_id === baseChar.id);
      
      const hydratedEquipments = {
        shoes: dbInfo?.equip_shoes_id ? inventory.find((e: any) => e.id === dbInfo.equip_shoes_id) : null,
        hat: dbInfo?.equip_hat_id ? inventory.find((e: any) => e.id === dbInfo.equip_hat_id) : null,
        armor: dbInfo?.equip_armor_id ? inventory.find((e: any) => e.id === dbInfo.equip_armor_id) : null,
        ring: dbInfo?.equip_ring_id ? inventory.find((e: any) => e.id === dbInfo.equip_ring_id) : null,
        belt: dbInfo?.equip_belt_id ? inventory.find((e: any) => e.id === dbInfo.equip_belt_id) : null,
        artifact: dbInfo?.equip_artifact_id ? inventory.find((e: any) => e.id === dbInfo.equip_artifact_id) : null,
      };

      return {
        ...baseChar,
        stars: dbInfo?.star_level || 1,
        shards: dbInfo?.shards || 0,
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

export const useUpgradeStar = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ characterId, newStar, remainShards }: { characterId: string, newStar: number, remainShards: number }) =>
      upgradeCharacterStar(userId, characterId, newStar, remainShards),
    onSuccess: () => {
      toast.success('Nâng cấp sao thành công!');
      queryClient.invalidateQueries({ queryKey: ['characters', userId] });
    }
  });
};

export const useRollGacha = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cost, equipments, shards }: { cost: number, equipments: any[], shards: any[] }) =>
      rollGachaRPC(userId, cost, equipments, shards),
    onSuccess: () => {
      // Invalidate everything to refresh currency, inventory, and shards
      queryClient.invalidateQueries({ queryKey: ['player', userId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', userId] });
      queryClient.invalidateQueries({ queryKey: ['characters', userId] });
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
