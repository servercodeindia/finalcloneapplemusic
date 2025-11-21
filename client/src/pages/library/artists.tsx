import { Layout } from "@/components/Layout";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useHaptics } from "@/hooks/use-haptics";
import { SONGS } from "@/lib/dummyData";

export default function ArtistsPage() {
  const { light } = useHaptics();
  // Deduplicate artists from SONGS
  const artists = Array.from(new Set(SONGS.map(s => s.artist))).sort();

  return (
    <Layout>
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center mb-6 relative">
          <Link href="/library" onClick={light} className="absolute left-0 text-primary flex items-center gap-1">
            <ChevronLeft size={24} />
            <span className="text-lg">Library</span>
          </Link>
          <h1 className="text-xl font-bold w-full text-center">Artists</h1>
        </div>

        <div className="space-y-1">
          {artists.map((artist, i) => (
            <div 
              key={i} 
              className="flex items-center py-4 border-b border-white/5 active:bg-white/5 -mx-5 px-5 transition-colors cursor-pointer"
              onClick={light}
            >
              <div className="w-12 h-12 rounded-full bg-neutral-700 mr-4 overflow-hidden">
                {/* Placeholder for artist image */}
                <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800" />
              </div>
              <span className="text-xl font-normal">{artist}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
