import { useState } from 'react';
import { useGameStore, type Equipment } from '@/stores/gameStore';
import { ArrowLeft } from 'lucide-react';

const TABS: { type: Equipment['type']; label: string; icon: string }[] = [
  { type: 'shoes', label: 'Giày', icon: '👟' },
  { type: 'hat', label: 'Mũ', icon: '🎩' },
  { type: 'armor', label: 'Giáp', icon: '🛡️' },
  { type: 'ring', label: 'Nhẫn', icon: '💍' },
  { type: 'belt', label: 'Đai', icon: '🥋' },
  { type: 'artifact', label: 'Pháp bảo', icon: '🔮' },
];

const RARITY_BORDER: Record<string, string> = {
  white: 'border-muted-foreground/40',
  blue: 'border-blue-glow',
  purple: 'border-purple-400',
  gold: 'border-gold-bright',
};

const RARITY_BG: Record<string, string> = {
  white: 'bg-muted/20',
  blue: 'bg-blue-deep/30',
  purple: 'bg-purple-900/30',
  gold: 'bg-yellow-900/20',
};

export function BagScreen() {
  const { inventory, setCurrentScreen } = useGameStore();
  const [activeTab, setActiveTab] = useState<Equipment['type']>('shoes');

  const filtered = inventory.filter((e) => e.type === activeTab);

  return (
    <div className="w-full h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={() => setCurrentScreen('main')} className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display text-xl text-gold-bright tracking-widest">TÚI ĐỒ</h2>
        <span className="ml-auto text-muted-foreground text-sm">{inventory.length} vật phẩm</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-2 overflow-x-auto border-b border-border">
        {TABS.map((tab) => {
          const count = inventory.filter(e => e.type === tab.type).length;
          return (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-display transition-all shrink-0
                ${activeTab === tab.type ? 'bg-secondary text-gold-bright' : 'text-muted-foreground hover:text-foreground'}
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {count > 0 && <span className="text-xs opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Chưa có vật phẩm nào
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`p-2 rounded-lg border-2 ${RARITY_BORDER[item.rarity]} ${RARITY_BG[item.rarity]} flex flex-col items-center gap-1 transition-all hover:scale-105`}
              >
                <span className="text-2xl">{TABS.find(t => t.type === item.type)?.icon}</span>
                <span className="text-[10px] font-display text-foreground text-center truncate w-full">{item.name}</span>
                <div className="text-[8px] text-muted-foreground space-y-0.5">
                  {item.stats.hp ? <p>HP +{item.stats.hp}</p> : null}
                  {item.stats.dmg ? <p>DMG +{item.stats.dmg}</p> : null}
                  {item.stats.speed ? <p>SPD +{item.stats.speed}</p> : null}
                  {item.stats.armor ? <p>ARM +{item.stats.armor}</p> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
