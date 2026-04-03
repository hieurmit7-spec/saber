import { CurrencyDisplay } from './CurrencyDisplay';
import { BottomNav } from './BottomNav';
import { QuestTracker } from './QuestTracker';
import { CalendarModal } from './CalendarModal';

export function MainMenu() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover video-flip">
        <source src="/videos/spring-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/20 z-10" />

      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4">
        <h1 className="font-display text-2xl text-gold-bright tracking-widest drop-shadow-lg">FERN</h1>
        <CurrencyDisplay />
      </div>

      <QuestTracker />

      <div className="absolute inset-0 z-15 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="font-display text-gold/60 text-sm tracking-[0.3em] uppercase">Turn-Based RPG</p>
        </div>
      </div>

      <BottomNav />
      <CalendarModal />
    </div>
  );
}
