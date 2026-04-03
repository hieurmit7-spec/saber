import { Diamond } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';

export function CurrencyDisplay() {
  const currency = useGameStore((s) => s.currency);

  return (
    <div className="flex items-center gap-2 bg-secondary/80 backdrop-blur-sm rounded-full px-4 py-2 border border-gold/30">
      <Diamond className="w-5 h-5 text-gold-bright fill-gold/30" />
      <span className="font-display text-gold-bright font-bold text-lg tracking-wide">
        {currency.toLocaleString()}
      </span>
      <span className="text-muted-foreground text-xs font-body">KC</span>
    </div>
  );
}
