import { Layout } from "@/components/Layout";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useHaptics } from "@/hooks/use-haptics";
import { SONGS } from "@/lib/dummyData";

export default function AlbumsPage() {
  const { light } = useHaptics();
  
  return (
    <Layout>
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center mb-6 relative">
          <Link href="/library" onClick={light} className="absolute left-0 text-primary flex items-center gap-1">
            <ChevronLeft size={24} />
            <span className="text-lg">Library</span>
          </Link>
          <h1 className="text-xl font-bold w-full text-center">Albums</h1>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {SONGS.map((song, i) => (
            <div 
              key={i} 
              className="active:scale-95 transition-transform cursor-pointer"
              onClick={light}
            >
              <div className="aspect-square rounded-lg overflow-hidden shadow-lg mb-2">
                <img src={song.coverUrl} className="w-full h-full object-cover" alt={song.album} />
              </div>
              <h3 className="font-medium truncate">{song.album}</h3>
              <p className="text-sm text-gray-500 truncate">{song.artist}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
