import { ReactNode, useState } from "react";
import { BottomNav } from "./BottomNav";
import { MiniPlayer } from "./MiniPlayer";
import { FullScreenPlayer } from "./FullScreenPlayer";
import { usePlayer } from "@/hooks/use-player";

export function Layout({ children }: { children: ReactNode }) {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const { currentSong } = usePlayer();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary selection:text-white overflow-x-hidden w-full max-w-[100vw]">
      <main className="pt-safe animate-in fade-in duration-500 overflow-x-hidden w-full max-w-[100vw]">
        {children}
      </main>

      {currentSong && (
        <>
          <MiniPlayer onClick={() => setIsPlayerOpen(true)} />
          <FullScreenPlayer isOpen={isPlayerOpen} onClose={() => setIsPlayerOpen(false)} />
        </>
      )}
      
      <BottomNav />
    </div>
  );
}
