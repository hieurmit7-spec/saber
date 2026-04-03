import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

import Auth from "./pages/Auth.tsx";
import MainMenu from "./pages/MainMenu.tsx";
import CharacterScreen from "./pages/CharacterScreen.tsx";
import GachaScreen from "./pages/GachaScreen.tsx";
import BattleScreen from "./pages/BattleScreen.tsx";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div className="w-full h-screen bg-black" />; // Loading state
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" />} />
            <Route path="/" element={session ? <MainMenu /> : <Navigate to="/auth" />} />
            <Route path="/character" element={session ? <CharacterScreen /> : <Navigate to="/auth" />} />
            <Route path="/gacha" element={session ? <GachaScreen /> : <Navigate to="/auth" />} />
            <Route path="/battle" element={session ? <BattleScreen /> : <Navigate to="/auth" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
