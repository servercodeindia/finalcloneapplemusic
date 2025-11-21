import { createContext, useContext, useState, ReactNode, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { SONGS } from "@/lib/dummyData"; // Fallback playlist
import type { Song } from "@shared/types";

type PlayerContextType = {
  currentSong: Song | null;
  isPlaying: boolean;
  isMiniPlayerVisible: boolean;
  progress: number;
  duration: number;
  volume: number;
  queue: Song[];
  play: (song: Song, context?: Song[]) => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (val: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  addToQueueNext: (song: Song) => void;
  addToQueueLater: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  showMiniPlayer: () => void;
  hideMiniPlayer: () => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8); // Default 80%
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Song[]>(SONGS);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = "anonymous";
      audioRef.current.volume = volume;
      
      audioRef.current.addEventListener("timeupdate", () => {
        setProgress(audioRef.current?.currentTime || 0);
      });
      
      audioRef.current.addEventListener("loadedmetadata", () => {
        setDuration(audioRef.current?.duration || 0);
      });
      
      audioRef.current.addEventListener("ended", () => {
        // Auto play next song
        playNext();
      });
      
      audioRef.current.addEventListener("error", (e) => {
        console.error("Audio error:", e);
        setIsPlaying(false);
      });
      
      audioRef.current.addEventListener("canplay", () => {
        console.log("Audio can play");
      });
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, [toast]);

  const queueRef = useRef<Song[]>(queue);
  const currentSongRef = useRef<Song | null>(currentSong);
  const playlistRef = useRef<Song[]>(currentPlaylist);
  const indexRef = useRef<number>(currentIndex);

  useEffect(() => {
    queueRef.current = queue;
    currentSongRef.current = currentSong;
    playlistRef.current = currentPlaylist;
    indexRef.current = currentIndex;
  }, [queue, currentSong, currentPlaylist, currentIndex]);

  useEffect(() => {
    const handleEnded = () => {
       // Logic for next song
       if (queueRef.current.length > 0) {
          const nextSong = queueRef.current[0];
          // We need to call play(nextSong) logic but remove it from queue
          // Since we can't easily call context methods from here without recursion issues, 
          // we'll emit a custom event or just update state directly if possible.
          // Better approach: Just trigger a state update that effect watches?
          // Let's just expose a method on the context that the effect calls? 
          // Actually, easiest way in React functional component:
          // The "playNext" function below handles the logic.
          // We can't easily bind the "ended" event to the latest "playNext" closure without re-attaching listener.
          // So let's re-attach listener when dependencies change? No, audioRef is stable.
          // We will use a stable function reference that checks refs.
       } else {
          // Fallback to dummy data cycling
          if (!currentSongRef.current || !currentSongRef.current.id) return;
          const currentIndex = SONGS.findIndex((s: any) => s.id === currentSongRef.current?.id);
          let nextIndex = currentIndex + 1;
          if (nextIndex >= SONGS.length) nextIndex = 0;
          // play(SONGS[nextIndex]); -> can't call play directly.
       }
    };
    
    // Actually, we can just re-bind the ended listener on every render? 
    // Or better: Use a stable "onEnded" handler ref that calls the current playNext.
  }, []);

  // Re-implementing playNext to be stable and usable
  const playNext = () => {
    if (queueRef.current.length > 0) {
      let nextSong = queueRef.current[0];
      let newQueue = queueRef.current.slice(1);
      
      // Skip songs without preview URLs
      while (!nextSong.previewUrl && newQueue.length > 0) {
        nextSong = newQueue[0];
        newQueue = newQueue.slice(1);
      }
      
      setQueue(newQueue);
      if (nextSong.previewUrl) {
        play(nextSong, playlistRef.current);
      }
    } else if (playlistRef.current && playlistRef.current.length > 0) {
      // Move to next song in current playlist
      let currentIdx = indexRef.current;
      let nextIdx = currentIdx + 1;
      
      // If reached end of playlist, fetch new songs
      if (nextIdx >= playlistRef.current.length) {
        const indianArtists = ['Arijit Singh', 'Neha Kakkar', 'Badshah', 'Dua Lipa', 'Punjabi songs', 'Tamil songs', 'Telugu songs', 'Marathi songs', 'Sidhu Moose Wala', 'Honey Singh'];
        const randomArtist = indianArtists[Math.floor(Math.random() * indianArtists.length)];
        
        fetch(`/api/search?q=${encodeURIComponent(randomArtist)}&limit=25`)
          .then(response => response.ok ? response.json() : [])
          .then(newSongs => {
            if (newSongs.length > 0) {
              const filteredSongs = newSongs.filter((s: Song) => s.previewUrl);
              if (filteredSongs.length > 0) {
                setCurrentPlaylist(filteredSongs);
                setCurrentIndex(0);
                play(filteredSongs[0], filteredSongs);
              }
            }
          })
          .catch(error => console.error('Error fetching next songs:', error));
      } else {
        // Play next song in current playlist
        const nextSong = playlistRef.current[nextIdx];
        if (nextSong && nextSong.previewUrl) {
          setCurrentIndex(nextIdx);
          play(nextSong, playlistRef.current);
        } else {
          // Skip to next valid song
          playNext();
        }
      }
    } else {
      // No playlist at all, fetch fresh Indian trending songs
      const indianArtists = ['Arijit Singh', 'Neha Kakkar', 'Badshah', 'Dua Lipa', 'Punjabi songs', 'Tamil songs', 'Telugu songs', 'Marathi songs', 'Sidhu Moose Wala', 'Honey Singh'];
      const randomArtist = indianArtists[Math.floor(Math.random() * indianArtists.length)];
      
      fetch(`/api/search?q=${encodeURIComponent(randomArtist)}&limit=25`)
        .then(response => response.ok ? response.json() : [])
        .then(newSongs => {
          if (newSongs.length > 0) {
            const filteredSongs = newSongs.filter((s: Song) => s.previewUrl);
            if (filteredSongs.length > 0) {
              setCurrentPlaylist(filteredSongs);
              setCurrentIndex(1);
              play(filteredSongs[1], filteredSongs);
            }
          }
        })
        .catch(error => console.error('Error fetching next songs:', error));
    }
  };

  // We need to ensure the "ended" event calls the latest playNext
  useEffect(() => {
      if (!audioRef.current) return;
      const onEnded = () => playNext();
      audioRef.current.removeEventListener("ended", onEnded); // Remove old if any (tricky with anon func)
      // Cleanest way: clear all ended listeners? No.
      // Standard React way: 
      audioRef.current.onended = onEnded; // Overwrite the handler
  }, [queue, currentSong]); // Update handler when queue changes


  // Effect to handle song changes (only when song changes)
  useEffect(() => {
    if (!currentSong || !audioRef.current) return;
    
    if (audioRef.current.src !== currentSong.previewUrl && currentSong.previewUrl) {
      // Pause and reset
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // Set new source
      audioRef.current.src = currentSong.previewUrl;
      
      // Auto-play if currently playing
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.error("Play error:", e);
          });
        }
      }
    } else if (!currentSong.previewUrl) {
      console.warn("No preview URL for song");
      setIsPlaying(false);
      toast({
        title: "No Preview Available",
        description: "This song does not have a preview clip available.",
        variant: "default",
      });
    }
  }, [currentSong]);

  // Separate effect for play/pause state (don't reload audio)
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;
    
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Silently fail - audio might not be ready yet
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong]);

  // Effect to handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const play = (song: Song, context: Song[] = SONGS) => {
    if (!song.previewUrl) {
      toast({
        title: "No Preview Available",
        description: `${song.title} doesn't have a preview available.`,
        variant: "default",
      });
      setIsPlaying(false);
      return;
    }
    // Set the context (playlist/search results) for next/previous navigation
    setCurrentPlaylist(context);
    const idx = context.findIndex(s => s.id === song.id);
    if (idx !== -1) {
      setCurrentIndex(idx);
    }
    
    if (currentSong?.id === song.id) {
      setIsPlaying(true);
      audioRef.current?.play().catch(() => setIsPlaying(false));
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
      setIsMiniPlayerVisible(true);
    }
  };

  const pause = () => {
    setIsPlaying(false);
    audioRef.current?.pause();
  };

  const togglePlay = () => {
    if (isPlaying) pause();
    else if (currentSong) {
        setIsPlaying(true);
    }
  };
  
  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const setVolume = (val: number) => {
    const clamped = Math.min(1, Math.max(0, val));
    setVolumeState(clamped);
  };

  const playPrevious = () => {
    if (!currentSongRef.current || !playlistRef.current || playlistRef.current.length === 0) return;
    
    let currentIdx = indexRef.current;
    let prevIdx = currentIdx - 1;
    
    // If at beginning, fetch new songs
    if (prevIdx < 0) {
      const indianArtists = ['AR Rahman', 'Shreya Ghoshal', 'Devi Sri Prasad', 'Anirudh', 'Indian classical', 'Bollywood songs', 'Kannada music', 'Malayalam music', 'Rana Daggubati', 'Vishal Bhardwaj'];
      const randomArtist = indianArtists[Math.floor(Math.random() * indianArtists.length)];
      
      fetch(`/api/search?q=${encodeURIComponent(randomArtist)}&limit=25`)
        .then(response => response.ok ? response.json() : [])
        .then(newSongs => {
          if (newSongs.length > 0) {
            const filteredSongs = newSongs.filter((s: Song) => s.previewUrl);
            if (filteredSongs.length > 0) {
              setCurrentPlaylist(filteredSongs);
              const lastValidIdx = filteredSongs.length - 2;
              setCurrentIndex(Math.max(0, lastValidIdx));
              play(filteredSongs[Math.max(0, lastValidIdx)], filteredSongs);
            }
          }
        })
        .catch(error => console.error('Error fetching previous songs:', error));
    } else {
      // Play previous song in current playlist
      const prevSong = playlistRef.current[prevIdx];
      if (prevSong && prevSong.previewUrl) {
        setCurrentIndex(prevIdx);
        play(prevSong, playlistRef.current);
      } else {
        // Skip to previous valid song
        playPrevious();
      }
    }
  };

  const addToQueueNext = (song: Song) => {
    setQueue(prev => [song, ...prev]);
    toast({ title: "Playing Next", description: `${song.title} added to queue.` });
  };

  const addToQueueLater = (song: Song) => {
    setQueue(prev => [...prev, song]);
    toast({ title: "Added to Queue", description: `${song.title} added to end of queue.` });
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  const showMiniPlayer = () => setIsMiniPlayerVisible(true);
  const hideMiniPlayer = () => setIsMiniPlayerVisible(false);

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        isMiniPlayerVisible,
        progress,
        duration,
        volume,
        queue,
        play,
        pause,
        togglePlay,
        seek,
        setVolume,
        playNext,
        playPrevious,
        addToQueueNext,
        addToQueueLater,
        removeFromQueue,
        showMiniPlayer,
        hideMiniPlayer,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
