import { useGameStore } from '@/stores/gameStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Gift, CheckCircle } from 'lucide-react';

export function CalendarModal() {
  const { showCalendar, setShowCalendar, calendarClaims, claimCalendarDay } = useGameStore();
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const today = new Date().getDate();

  return (
    <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
      <DialogContent className="bg-card border-border max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-gold-bright text-xl tracking-widest text-center">
            LỊCH ĐIỂM DANH
          </DialogTitle>
        </DialogHeader>
        <p className="text-center text-muted-foreground text-sm mb-4">Nhận 100 KC mỗi ngày!</p>
        <div className="grid grid-cols-5 gap-2">
          {days.map((day) => {
            const claimed = !!calendarClaims[day];
            const isToday = day === today;
            const canClaim = isToday && !claimed;

            return (
              <button
                key={day}
                onClick={() => canClaim && claimCalendarDay(day)}
                disabled={!canClaim}
                className={`
                  relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all min-h-[60px]
                  ${claimed
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : isToday
                      ? 'border-gold-bright bg-secondary hover:bg-secondary/80 cursor-pointer shadow-gold'
                      : 'border-border/50 bg-secondary/30 text-muted-foreground/50'
                  }
                `}
              >
                <span className="text-[10px] font-display tracking-wider">Ngày {day}</span>
                {claimed ? (
                  <CheckCircle className="w-5 h-5 text-accent mt-1" />
                ) : (
                  <Gift className={`w-5 h-5 mt-1 ${isToday ? 'text-gold-bright' : 'opacity-30'}`} />
                )}
                {isToday && !claimed && (
                  <span className="text-[8px] text-gold-bright font-bold mt-0.5">+100 KC</span>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
