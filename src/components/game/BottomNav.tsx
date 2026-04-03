import { Sword, Users, Swords, Package, CalendarDays } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';

export function BottomNav() {
  const { currentScreen, setCurrentScreen, setShowCalendar } = useGameStore();

  const navItems = [
    { id: 'character' as const, label: 'Nhân vật', icon: Users, action: () => setCurrentScreen('character') },
    { id: 'gacha' as const, label: 'Gacha', icon: Swords, action: () => setCurrentScreen('gacha') },
    { id: 'battle' as const, label: 'Chiến đấu', icon: Sword, action: () => setCurrentScreen('battle') },
    { id: 'bag' as const, label: 'Túi đồ', icon: Package, action: () => setCurrentScreen('bag') },
    { id: 'calendar' as const, label: 'Lịch', icon: CalendarDays, action: () => setShowCalendar(true) },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-30 flex items-end justify-center gap-2 px-4 pb-4">
      <div className="flex items-end gap-1 bg-overlay/90 backdrop-blur-md rounded-2xl border border-border p-2">
        {navItems.map((item) => {
          const isActive = item.id !== 'calendar' && currentScreen === item.id;
          const isCenter = item.id === 'battle';

          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`
                flex flex-col items-center gap-1 rounded-xl transition-all duration-200
                ${isCenter ? 'px-6 py-3 -mt-4' : 'px-4 py-2'}
                ${isActive
                  ? isCenter
                    ? 'gradient-gold shadow-gold text-primary-foreground'
                    : 'bg-secondary text-gold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }
              `}
            >
              <item.icon className={isCenter ? 'w-7 h-7' : 'w-5 h-5'} />
              <span className={`font-display text-xs tracking-wide ${isCenter ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
