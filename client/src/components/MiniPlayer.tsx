import { usePlayer } from "@/hooks/use-player";
import { Play, Pause, SkipForward } from "lucide-react";
import { motion } from "framer-motion";

interface MiniPlayerProps {
  onClick: () => void;
}

export function MiniPlayer({ onClick }: MiniPlayerProps) {
  const { currentSong, isPlaying, togglePlay, playNext } = usePlayer();

  if (!currentSong) return null;

  return (
    <motion.div 
      className="fixed bottom-[90px] left-2 right-2 h-[64px] bg-[#1c1c1e]/85 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-40 flex items-center px-2 pr-4 overflow-hidden cursor-pointer border border-white/5"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div className="h-12 w-12 rounded-lg overflow-hidden shadow-lg mr-3 flex-shrink-0 relative">
        <img src={currentSong.coverUrl} alt={currentSong.title} className="h-full w-full object-cover" />
      </div>
      
      <div className="flex-1 min-w-0 mr-4 flex flex-col justify-center">
        <div className="text-[15px] font-medium truncate text-white leading-tight">{currentSong.title}</div>
        <div className="text-[13px] text-gray-400 truncate leading-tight">{currentSong.artist}</div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="text-white hover:text-gray-200 focus:outline-none p-1"
        >
          {isPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} />}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); playNext(); }}
          className="text-white hover:text-gray-200 focus:outline-none p-1"
        >
          <SkipForward fill="currentColor" size={24} />
        </button>
      </div>
      
      {/* Progress bar at bottom of mini player - subtle detail */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
        <div className="h-full bg-white/30 w-1/3" />
      </div>
    </motion.div>
  );
}
