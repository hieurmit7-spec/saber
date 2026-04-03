import { useGameStore } from '@/stores/gameStore';
import { MainMenu } from '@/components/game/MainMenu';
import { CharacterScreen } from '@/components/game/CharacterScreen';
import { GachaScreen } from '@/components/game/GachaScreen';
import { BattleScreen } from '@/components/game/BattleScreen';
import { BagScreen } from '@/components/game/BagScreen';

const Index = () => {
  const currentScreen = useGameStore((s) => s.currentScreen);

  return (
    <div className="w-full h-screen overflow-hidden bg-background">
      {currentScreen === 'main' && <MainMenu />}
      {currentScreen === 'character' && <CharacterScreen />}
      {currentScreen === 'gacha' && <GachaScreen />}
      {currentScreen === 'battle' && <BattleScreen />}
      {currentScreen === 'bag' && <BagScreen />}
    </div>
  );
};

export default Index;
