import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Auth from "./pages/Auth.tsx";
import MainMenu from "./pages/MainMenu.tsx";
import CharacterScreen from "./pages/CharacterScreen.tsx";
import GachaScreen from "./pages/GachaScreen.tsx";
import BagScreen from "./pages/BagScreen.tsx";
import BattleMenu from "./pages/BattleMenu.tsx";
import BattleScreen from "./pages/BattleScreen.tsx";
import AbilityScreen from "./pages/AbilityScreen.tsx";
import TeamSetupScreen from "./pages/TeamSetupScreen.tsx";
import LeaderboardScreen from "./pages/LeaderboardScreen.tsx";
import PlayerProfileScreen from "./pages/PlayerProfileScreen.tsx";
import ShopScreen from "./pages/ShopScreen.tsx";
import TransferScreen from "./pages/TransferScreen.tsx";

const queryClient = new QueryClient();

const App = () => {
  const isAuthenticated = !!localStorage.getItem('fern_user_id');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={!isAuthenticated ? <Auth /> : <Navigate to="/" />} />
            <Route path="/" element={isAuthenticated ? <MainMenu /> : <Navigate to="/auth" />} />
            <Route path="/character" element={isAuthenticated ? <CharacterScreen /> : <Navigate to="/auth" />} />
            <Route path="/gacha" element={isAuthenticated ? <GachaScreen /> : <Navigate to="/auth" />} />
            <Route path="/bag" element={isAuthenticated ? <BagScreen /> : <Navigate to="/auth" />} />
            <Route path="/shop" element={isAuthenticated ? <ShopScreen /> : <Navigate to="/auth" />} />
            <Route path="/transfer" element={isAuthenticated ? <TransferScreen /> : <Navigate to="/auth" />} />
            <Route path="/battle" element={isAuthenticated ? <BattleMenu /> : <Navigate to="/auth" />} />
            <Route path="/abilities" element={isAuthenticated ? <AbilityScreen /> : <Navigate to="/auth" />} />
            <Route path="/team" element={isAuthenticated ? <TeamSetupScreen /> : <Navigate to="/auth" />} />
            <Route path="/leaderboard" element={isAuthenticated ? <LeaderboardScreen /> : <Navigate to="/auth" />} />
            <Route path="/profile" element={isAuthenticated ? <PlayerProfileScreen /> : <Navigate to="/auth" />} />
            <Route path="/profile/:targetId" element={isAuthenticated ? <PlayerProfileScreen /> : <Navigate to="/auth" />} />
            
            <Route path="/pve" element={isAuthenticated ? <BattleScreen mode="pve" /> : <Navigate to="/auth" />} />
            <Route path="/pvp-private" element={isAuthenticated ? <BattleScreen mode="private" /> : <Navigate to="/auth" />} />
            <Route path="/pvp-ranked" element={isAuthenticated ? <BattleScreen mode="ranked" /> : <Navigate to="/auth" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
