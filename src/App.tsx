import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Auth from "./pages/Auth.tsx";
import MainMenu from "./pages/MainMenu.tsx";
import CharacterScreen from "./pages/CharacterScreen.tsx";
import GachaScreen from "./pages/GachaScreen.tsx";
import BattleScreen from "./pages/BattleScreen.tsx";

const queryClient = new QueryClient();

const App = () => {
  // Read session directly from localStorage (no Supabase Auth)
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
            <Route path="/battle" element={isAuthenticated ? <BattleScreen /> : <Navigate to="/auth" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
