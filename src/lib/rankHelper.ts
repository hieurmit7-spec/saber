export interface RankInfo {
  name: string;
  image: string;
}

export function getRankInfo(level: number, leaderboardIndex?: number): RankInfo {
  // Thách đấu (Top 1 trong rank leaderboard và phải đạt level từ 13 trở lên)
  if (level >= 13 && leaderboardIndex === 0) {
    return { name: 'Thách Đấu', image: '/accets/rank/Thách Đấu I.png' };
  }

  // Level từ 1 đến 13
  switch (level) {
    case 1: return { name: 'Đồng', image: '/accets/rank/Đồng_.png' };
    case 2: return { name: 'Bạc', image: '/accets/rank/Bạc.png' };
    case 3: return { name: 'Vàng', image: '/accets/rank/Vàng_.png' };
    case 4: return { name: 'Bạch Kim', image: '/accets/rank/Bạch Kim.png' };
    case 5: return { name: 'Kim Cương', image: '/accets/rank/Kim Cương.png' };
    case 6: return { name: 'Tinh Anh', image: '/accets/rank/Tinh Anh.png' };
    case 7: return { name: 'Cao Thủ', image: '/accets/rank/Cao Thủ.png' };
    case 8: return { name: 'Đại Cao Thủ IV', image: '/accets/rank/Đại Cao Thủ IV.png' };
    case 9: return { name: 'Đại Cao Thủ III', image: '/accets/rank/Đại Cao Thủ III.png' };
    case 10: return { name: 'Đại Cao Thủ II', image: '/accets/rank/Đại Cao Thủ II.png' };
    case 11: return { name: 'Đại Cao Thủ I', image: '/accets/rank/Đại Cao Thủ I.png' };
    case 12: return { name: 'Chiến Tướng', image: '/accets/rank/Chiến Tướng_.png' };
    default: return { name: 'Chiến Thần', image: '/accets/rank/Chiến Thần_.png' };
  }
}
