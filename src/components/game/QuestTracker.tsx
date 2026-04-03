import { Gift, CheckCircle } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';

export function QuestTracker() {
  const { dailyLoginClaimed, claimDailyLogin } = useGameStore();

  return (
    <div className="absolute top-20 left-4 z-20">
      <div className="bg-overlay/80 backdrop-blur-sm rounded-xl border border-border p-3 w-48">
        <h3 className="font-display text-gold text-xs tracking-widest uppercase mb-2">Nhiệm vụ</h3>
        <button
          onClick={() => !dailyLoginClaimed && claimDailyLogin()}
          disabled={dailyLoginClaimed}
          className={`flex items-center gap-2 w-full text-left p-2 rounded-lg transition-all text-sm
            ${dailyLoginClaimed
              ? 'text-muted-foreground'
              : 'text-foreground hover:bg-secondary/50 cursor-pointer'
            }`}
        >
          {dailyLoginClaimed ? (
            <CheckCircle className="w-4 h-4 text-accent shrink-0" />
          ) : (
            <Gift className="w-4 h-4 text-gold shrink-0" />
          )}
          <span className="font-body">Đăng nhập hằng ngày</span>
          {!dailyLoginClaimed && (
            <span className="ml-auto text-gold text-xs font-bold">+100</span>
          )}
        </button>
      </div>
    </div>
  );
}
