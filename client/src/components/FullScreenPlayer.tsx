import { usePlayer } from "@/hooks/use-player";
import { ChevronDown, MoreHorizontal, SkipBack, SkipForward, Play, Pause, Volume2, MessageSquareQuote, ListMusic, X, GripVertical, Heart, Plus, Share2, ListPlus, Radio, Info, Star, Album, FileText, Music, ThumbsDown, Copy, Check, Trash2 } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { addSongToPlaylist, addSongToLibrary, getPlaylists, isSongInPlaylist, removeSongFromLibrary, isSongInLibrary, getPlaylistSongs, removeSongFromPlaylist } from "@/lib/playlists-api";
import { useLocation } from "wouter";
import { useQueryClient, useQuery } from "@tanstack/react-query";

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FullScreenPlayer({ isOpen, onClose }: FullScreenPlayerProps) {
  const { 
    currentSong, 
    isPlaying, 
    togglePlay, 
    progress, 
    duration, 
    seek, 
    playNext, 
    playPrevious, 
    volume, 
    setVolume,
    queue,
    removeFromQueue
  } = usePlayer();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const [localProgress, setLocalProgress] = useState(progress);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'art' | 'lyrics' | 'queue'>('art');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lyrics, setLyrics] = useState<string[]>([]);
  const { toast } = useToast();
  
  const { data: playlists = [] } = useQuery({
    queryKey: ['playlists'],
    queryFn: getPlaylists
  });

  useEffect(() => {
    if (!currentSong) return;

    // Generate unique lyrics based on song ID for variation
    const generateLyrics = () => {
      const hash = currentSong.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const seed = hash % 100;
      
      const verses = [
        ["In the silence, I found you", "Breaking through the distant clouds", "Your voice echoes in my mind", "A melody so true and proud"],
        ["Under stars we dance tonight", "Moving to the rhythm of fate", "Every heartbeat pulls me close", "This love feels so great"],
        ["Walking down this lonely road", "Looking for a sign to guide", "Then you appeared like morning light", "With you here by my side"],
        ["Whispers of a forgotten dream", "Coming back to life anew", "In the chaos of the world", "I found my way to you"],
        ["Through the rain and stormy skies", "You remain my guiding star", "No matter where the journey goes", "In my heart you are"],
      ];

      const choruses = [
        ["Hold me like the morning holds the sun", "Keep me close till all the fighting is done", "In your arms I've found my place", "Love lights up your face"],
        ["This feeling never wants to end", "You're my lover and my friend", "Every moment feels like home", "Never let me roam"],
        ["Take my hand and never let go", "Through the highs and through the lows", "You're the reason that I stay", "Forever starts today"],
        ["In this world of endless night", "You're my beacon, you're my light", "Every breath with you is true", "My heart belongs to you"],
        ["Forever in your melody", "That's where I want to be", "In the symphony of love", "You're enough"],
      ];

      const verseIdx = Math.floor(seed / 20) % verses.length;
      const chorusIdx = Math.floor((seed + 50) / 20) % choruses.length;
      
      const lines = [
        `🎵 ${currentSong.title}`,
        `by ${currentSong.artist}`,
        `from ${currentSong.album || 'Album'}`,
        "",
        "♪ Verse 1",
        ...verses[verseIdx],
        "",
        "♪ Chorus",
        ...choruses[chorusIdx],
        "",
        "♪ Verse 2",
        ...verses[(verseIdx + 1) % verses.length],
        "",
        "♪ Chorus",
        ...choruses[chorusIdx],
        "",
        "🎵 ~ End ~"
      ];
      setLyrics(lines);
    };

    generateLyrics();
  }, [currentSong?.id]);

  const handleFavourite = async () => {
    try {
      if (!isFavourite && currentSong) {
        console.log("Checking if song exists in favorites...", currentSong.id);
        
        const exists = await isSongInPlaylist("liked-songs-default", currentSong.id);
        if (exists) {
          toast({
            title: "Already Added",
            description: `${currentSong?.title} is already in your Favorite`,
          });
          setTimeout(() => setShowMoreMenu(false), 500);
          return;
        }

        console.log("Adding to favorite...", currentSong.id);
        await addSongToPlaylist(
          "liked-songs-default",
          currentSong.id,
          currentSong.title,
          currentSong.artist,
          currentSong.coverUrl,
          currentSong.album,
          currentSong.previewUrl,
          currentSong.duration
        );
        await queryClient.invalidateQueries({ queryKey: ['playlist-songs', 'liked-songs-default'] });
        setIsFavourite(true);
        toast({
          title: "Added to Favorite",
          description: `${currentSong?.title} has been added to your Favorite.`,
        });
      } else if (isFavourite && currentSong) {
        console.log("Removing from favorite...", currentSong.id);
        const songs = await getPlaylistSongs("liked-songs-default");
        const songToRemove = songs.find(s => s.songId === currentSong.id);
        
        if (songToRemove) {
          await removeSongFromPlaylist(songToRemove.id);
          await queryClient.invalidateQueries({ queryKey: ['playlist-songs', 'liked-songs-default'] });
        }
        
        setIsFavourite(false);
        toast({
          title: "Removed from Favorite",
          description: `${currentSong?.title} has been removed from your Favorite.`,
        });
      }
    } catch (error: any) {
      console.error("Error with Favorite:", error?.message || error);
      toast({
        title: "Error",
        description: "Failed to update Favorite",
      });
    }
    setTimeout(() => setShowMoreMenu(false), 500);
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://music.apple.com/song/${currentSong?.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link Copied",
      description: "Song link copied to clipboard",
    });
  };

  const handleAddToPlaylist = async (playlistId: string, playlistName: string) => {
    try {
      if (!currentSong) return;
      console.log("Checking if song exists in playlist...", playlistId, currentSong.id);
      
      const exists = await isSongInPlaylist(playlistId, currentSong.id);
      if (exists) {
        toast({
          title: "Already Added",
          description: `${currentSong?.title} is already in ${playlistName}`,
        });
        setTimeout(() => {
          setShowPlaylistDialog(false);
          setShowMoreMenu(false);
        }, 500);
        return;
      }

      console.log("Adding to playlist...", playlistId, currentSong.id);
      await addSongToPlaylist(
        playlistId,
        currentSong.id,
        currentSong.title,
        currentSong.artist,
        currentSong.coverUrl,
        currentSong.album,
        currentSong.previewUrl,
        currentSong.duration
      );
      console.log("Successfully added to playlist");
      await queryClient.invalidateQueries({ queryKey: ['playlist-songs', playlistId] });
      await queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast({
        title: "Added to Playlist",
        description: `${currentSong?.title} added to ${playlistName}`,
      });
    } catch (error: any) {
      console.error("Error adding to playlist:", error?.message || error);
      toast({
        title: "Error",
        description: "Failed to add song to playlist",
      });
    }
    setTimeout(() => {
      setShowPlaylistDialog(false);
      setShowMoreMenu(false);
    }, 500);
  };

  const handleAddToLibrary = async () => {
    try {
      if (!currentSong) return;
      console.log("Checking if song exists in library...", currentSong.id);
      
      const exists = await isSongInLibrary(currentSong.id);
      if (exists) {
        toast({
          title: "Already Added",
          description: `${currentSong?.title} is already in your library`,
        });
        setTimeout(() => setShowMoreMenu(false), 500);
        return;
      }

      console.log("Adding to library...", currentSong.id);
      await addSongToLibrary(
        currentSong.id,
        currentSong.title,
        currentSong.artist,
        currentSong.coverUrl,
        currentSong.album,
        currentSong.previewUrl,
        currentSong.duration
      );
      console.log("Successfully added to library");
      await queryClient.invalidateQueries({ queryKey: ['library-songs'] });
      toast({
        title: "Added to Library",
        description: `${currentSong?.title} has been added to your library.`,
      });
      setTimeout(() => {
        setShowMoreMenu(false);
        navigate("/library");
      }, 500);
    } catch (error: any) {
      console.error("Error adding to library:", error?.message || error);
      toast({
        title: "Error",
        description: "Failed to add song to library",
      });
      setTimeout(() => setShowMoreMenu(false), 500);
    }
  };

  useEffect(() => {
    const checkIfFavorite = async () => {
      if (currentSong?.id) {
        const isFav = await isSongInPlaylist("liked-songs-default", currentSong.id);
        setIsFavourite(isFav);
      }
    };
    checkIfFavorite();
  }, [currentSong?.id]);

  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(progress);
    }
  }, [progress, isDragging]);

  if (!currentSong) return null;

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] bg-[#1c1c1e] flex flex-col overflow-hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.2 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 150) {
              onClose();
            }
          }}
        >
          {/* Dynamic Background Blur */}
          <div className="absolute inset-0 z-0 pointer-events-none">
             <motion.img 
               src={currentSong.coverUrl} 
               className="w-full h-full object-cover blur-[80px] opacity-50 scale-150" 
               alt="Background Blur"
               animate={{ opacity: isPlaying ? 0.6 : 0.4 }}
               transition={{ duration: 2 }}
             />
             <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/90" />
          </div>

          {/* Header */}
          <div className="relative z-10 pt-safe px-6 pb-2 flex justify-between items-center mt-2">
            <div 
              className="w-10 h-1.5 bg-white/30 rounded-full mx-auto absolute top-4 left-0 right-0 cursor-pointer hover:bg-white/50 transition-colors backdrop-blur-md" 
              onClick={onClose} 
            />
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors mt-4">
              <ChevronDown size={28} strokeWidth={2.5} />
            </button>
            <div className="flex-1" />
          </div>

          {/* Main Content Area */}
          <div className="relative z-10 flex-1 flex flex-col px-8 pb-12 pt-4">
            
            {/* View Switcher Content */}
            <div 
              className={`flex-1 flex min-h-0 mb-8 relative ${viewMode === 'lyrics' ? 'items-start justify-start overflow-y-auto' : 'items-center justify-center overflow-hidden'}`}
            >
              <AnimatePresence mode="wait">
                {viewMode === 'art' && (
                  <motion.div 
                    key="art"
                    className="w-full max-w-[340px] aspect-square relative overflow-hidden rounded-2xl"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: isPlaying ? 1 : 0.85, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    {/* Colored Shadow that matches artwork */}
                    <div 
                      className="absolute inset-0 rounded-2xl blur-xl opacity-40 -z-10 scale-95"
                      style={{ 
                        backgroundImage: `url(${currentSong.coverUrl})`, 
                        backgroundSize: 'cover' 
                      }} 
                    />
                    <img 
                      src={currentSong.coverUrl} 
                      alt={currentSong.title} 
                      className="w-full h-full object-cover rounded-2xl shadow-2xl ring-1 ring-white/10 relative z-10" 
                    />
                  </motion.div>
                )}

                {viewMode === 'lyrics' && (
                  <motion.div 
                    key="lyrics"
                    className="w-full h-full rounded-2xl bg-black/20 backdrop-blur-md border border-white/5 relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <button 
                       onClick={() => setViewMode('art')}
                       className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/20 p-2 rounded-full z-20"
                    >
                      <X size={20} />
                    </button>
                    
                    <div className="w-full h-full overflow-y-auto">
                      <div className="space-y-3 py-12 px-6 text-center pb-32">
                        {lyrics.map((line, idx) => (
                          <div key={idx}>
                            {line === "" ? (
                              <div className="h-4" />
                            ) : line.includes("♪") || line.includes("🎵") ? (
                              <p className="text-lg font-bold text-primary opacity-100 leading-relaxed">{line}</p>
                            ) : line.startsWith("by ") || line.startsWith("from ") ? (
                              <p className="text-base text-white/50 leading-relaxed">{line}</p>
                            ) : (
                              <p className="text-lg text-white/70 leading-relaxed">{line}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {viewMode === 'queue' && (
                  <motion.div 
                    key="queue"
                    className="w-full h-full overflow-hidden rounded-2xl bg-black/20 backdrop-blur-md p-4 border border-white/5 relative"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold uppercase text-white/60 tracking-widest">Playing Next</h3>
                      <button 
                        onClick={() => setViewMode('art')}
                        className="text-white/50 hover:text-white bg-black/20 p-1.5 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <ScrollArea className="h-[calc(100%-40px)]">
                      <div className="space-y-4 pb-4">
                        {queue.length > 0 ? (
                          queue.map((song, idx) => (
                            <div key={`${song.id}-${idx}`} className="flex items-center gap-3 group">
                              <div className="w-12 h-12 bg-white/10 rounded-md overflow-hidden flex-shrink-0">
                                <img src={song.coverUrl} className="w-full h-full object-cover" alt={song.title} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium truncate text-white text-sm">{song.title}</h4>
                                <p className="text-xs text-white/50 truncate">{song.artist}</p>
                              </div>
                              <button 
                                onClick={() => removeFromQueue(idx)}
                                className="p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <X size={16} />
                              </button>
                              <div className="text-white/30 cursor-grab active:cursor-grabbing">
                                <GripVertical size={16} />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-white/40 text-sm">Queue is empty</p>
                            <p className="text-white/20 text-xs mt-1">Auto-play will continue from similar songs</p>
                          </div>
                        )}
                        
                        {queue.length === 0 && (
                           <div className="pt-4 border-t border-white/5">
                              <h3 className="text-xs font-bold uppercase text-white/40 mb-4 tracking-widest">Autoplay</h3>
                              {/* Simulating Autoplay items */}
                              <div className="space-y-4 opacity-50">
                                 <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/10 rounded-md" />
                                    <div className="space-y-2 flex-1">
                                       <div className="h-3 bg-white/10 rounded w-2/3" />
                                       <div className="h-2 bg-white/10 rounded w-1/3" />
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/10 rounded-md" />
                                    <div className="space-y-2 flex-1">
                                       <div className="h-3 bg-white/10 rounded w-1/2" />
                                       <div className="h-2 bg-white/10 rounded w-1/4" />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        )}
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Track Info */}
            <div className="mb-6 flex justify-between items-center px-1">
              <div className="min-w-0 flex-1 mr-4">
                <h2 className="text-2xl font-bold text-white truncate leading-tight tracking-tight">{currentSong.title}</h2>
                <p className="text-lg text-white/60 truncate font-medium mt-0.5">{currentSong.artist}</p>
              </div>
              <div className="flex gap-1">
                 <button 
                   onClick={() => setShowMoreMenu(true)}
                   className="p-2 bg-white/10 rounded-full text-white/80 hover:bg-white/20 transition-colors"
                   data-testid="button-more-options"
                 >
                   <MoreHorizontal size={20} />
                 </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8 group px-1">
              <Slider 
                value={[localProgress]} 
                max={duration || 30}
                step={0.1} 
                className="cursor-pointer py-2"
                onValueChange={(val) => {
                  setIsDragging(true);
                  setLocalProgress(val[0]);
                }}
                onValueCommit={(val) => {
                  setIsDragging(false);
                  seek(val[0]);
                }}
              />
              <div className="flex justify-between text-[11px] text-gray-400 font-medium mt-[-2px] font-sans opacity-80 tracking-wide">
                <span>{formatTime(localProgress)}</span>
                <span>-{formatTime((duration || 30) - localProgress)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex justify-between items-center mb-12 px-4">
              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={playPrevious}
                className="text-white/90 hover:text-white transition-colors"
              >
                <SkipBack size={45} fill="currentColor" />
              </motion.button>
              
              <motion.button 
                whileTap={{ scale: 0.85 }}
                onClick={togglePlay}
                className="text-white hover:scale-105 transition-all duration-200 relative"
              >
                {isPlaying ? (
                  <Pause size={80} fill="currentColor" />
                ) : (
                  <Play size={80} fill="currentColor" />
                )}
              </motion.button>
              
              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={playNext}
                className="text-white/90 hover:text-white transition-colors"
              >
                <SkipForward size={45} fill="currentColor" />
              </motion.button>
            </div>

            {/* Footer Controls (Volume & Toggles) */}
            <div className="flex items-center justify-between gap-6 px-1">
              <div className="flex items-center gap-3 flex-1">
                <Volume2 size={18} className="text-gray-400" />
                <Slider 
                  value={[volume * 100]} 
                  max={100} 
                  step={1} 
                  className="flex-1"
                  onValueChange={(val) => setVolume(val[0] / 100)} 
                />
                <Volume2 size={24} className="text-gray-400" />
              </div>
              
              <div className="flex items-center gap-5 pl-4">
                <button 
                  className={`transition-colors p-2 rounded-lg ${viewMode === 'lyrics' ? 'text-white bg-white/20' : 'text-white/50 hover:text-white'}`}
                  onClick={() => setViewMode(viewMode === 'lyrics' ? 'art' : 'lyrics')}
                >
                  <MessageSquareQuote size={22} />
                </button>
                <button 
                   className={`transition-colors p-2 rounded-lg ${viewMode === 'queue' ? 'text-white bg-white/20' : 'text-white/50 hover:text-white'}`}
                   onClick={() => setViewMode(viewMode === 'queue' ? 'art' : 'queue')}
                >
                  <ListMusic size={22} />
                </button>
              </div>
            </div>
          </div>

          {/* Apple Music Style Bottom Sheet Menu */}
          <AnimatePresence>
            {showMoreMenu && (
              <>
                {/* Backdrop */}
                <motion.div
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMoreMenu(false)}
                />
                
                {/* Bottom Sheet */}
                <motion.div
                  className="fixed bottom-0 left-0 right-0 z-[71] px-4 pb-safe"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                >
                  <div className="bg-[#2c2c2e]/40 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl mb-4">
                    {/* Quick Actions Row */}
                    <div className="flex items-center justify-around p-6 border-b border-white/10">
                      <button 
                        onClick={handleFavourite}
                        className="flex flex-col items-center gap-2 min-w-[80px] active:opacity-50 transition-opacity"
                        data-testid="action-favourite"
                      >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isFavourite ? 'bg-red-500/30' : 'bg-white/20'}`}>
                          <Star className={`${isFavourite ? 'text-red-500 fill-red-500' : 'text-white'}`} size={24} />
                        </div>
                        <span className="text-white text-xs font-medium">Favourite</span>
                      </button>
                      
                      <button 
                        onClick={handleShare}
                        className="flex flex-col items-center gap-2 min-w-[80px] active:opacity-50 transition-opacity"
                        data-testid="action-share"
                      >
                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                          <Share2 className="text-white" size={24} />
                        </div>
                        <span className="text-white text-xs font-medium">Share</span>
                      </button>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button 
                        onClick={handleAddToLibrary}
                        className="w-full px-6 py-4 flex items-center gap-4 text-white hover:bg-white/5 active:bg-white/10 transition-colors"
                        data-testid="menu-item-add-library"
                      >
                        <Plus size={24} className="text-white/90" />
                        <span className="text-base font-normal">Add to Library</span>
                      </button>

                      <button 
                        onClick={() => setShowPlaylistDialog(true)}
                        className="w-full px-6 py-4 flex items-center gap-4 text-white hover:bg-white/5 active:bg-white/10 transition-colors"
                        data-testid="menu-item-add-playlist"
                      >
                        <ListPlus size={24} className="text-white/90" />
                        <span className="text-base font-normal">Add to a Playlist</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Share Dialog */}
          <AnimatePresence>
            {showShareDialog && (
              <>
                <motion.div
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowShareDialog(false)}
                />
                <motion.div
                  className="fixed bottom-0 left-0 right-0 z-[71] px-4 pb-safe"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                >
                  <div className="bg-[#2c2c2e]/95 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl mb-4">
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-6">Share "{currentSong?.title}"</h3>
                      <button 
                        onClick={handleCopyLink}
                        className="w-full px-6 py-4 flex items-center gap-4 text-white hover:bg-white/5 active:bg-white/10 transition-colors rounded-lg bg-white/5 mb-3"
                        data-testid="action-copy-link"
                      >
                        <Copy size={24} className="text-white/90" />
                        <span className="text-base font-normal flex-1 text-left">
                          {copied ? "Link Copied!" : "Copy Link"}
                        </span>
                        {copied && <Check size={20} className="text-green-500" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Playlist Dialog */}
          <AnimatePresence>
            {showPlaylistDialog && (
              <>
                <motion.div
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowPlaylistDialog(false)}
                />
                <motion.div
                  className="fixed bottom-0 left-0 right-0 z-[71] px-4 pb-safe"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                >
                  <div className="bg-[#2c2c2e]/95 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl mb-4 max-h-[60vh]">
                    <div className="p-6 border-b border-white/10">
                      <h3 className="text-xl font-bold text-white">Add to Playlist</h3>
                    </div>
                    <ScrollArea className="h-[calc(100%-80px)]">
                      <div className="py-2">
                        {playlists.map((playlist) => (
                          <button
                            key={playlist.id}
                            onClick={() => handleAddToPlaylist(playlist.id, playlist.name)}
                            className="w-full px-6 py-4 flex items-center gap-4 text-white hover:bg-white/5 active:bg-white/10 transition-colors text-left"
                            data-testid={`playlist-option-${playlist.id}`}
                          >
                            <Plus size={24} className="text-white/90 flex-shrink-0" />
                            <span className="text-base font-normal">{playlist.name}</span>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
