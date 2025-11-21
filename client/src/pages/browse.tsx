import { Layout } from "@/components/Layout";
import { usePlayer } from "@/hooks/use-player";
import { getFeaturedMusic, getRecommendations } from "@/lib/spotify";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const CATEGORIES = [
  { id: "pop", name: "Pop", term: "pop music", color: "from-pink-500 to-rose-600", image: "/images/genres/pop.jpg" },
  { id: "rock", name: "Rock", term: "rock music", color: "from-red-600 to-red-900", image: "/images/genres/rock.jpg" },
  { id: "hiphop", name: "Hip-Hop", term: "hip hop music", color: "from-orange-500 to-red-500", image: "/images/genres/hiphop.jpg" },
  { id: "dance", name: "Dance", term: "dance music", color: "from-indigo-500 to-purple-500", image: "/images/genres/dance.jpg" },
  { id: "jazz", name: "Jazz", term: "jazz music", color: "from-sky-600 to-indigo-800", image: "/images/genres/jazz.jpg" },
  { id: "classical", name: "Classical", term: "classical music", color: "from-amber-700 to-yellow-600", image: "/images/genres/classical.jpg" },
];

export default function BrowsePage() {
  const { play } = usePlayer();
  const [, setLocation] = useLocation(); 
  
  const { data: newReleases, isLoading } = useQuery({
    queryKey: ['itunes', 'featured-browse'],
    queryFn: () => getFeaturedMusic(1)
  });

  const { data: recommendations, isLoading: isLoadingRecs } = useQuery({
    queryKey: ['itunes', 'recommendations-browse'],
    queryFn: () => getRecommendations(['pop', 'rock', 'indie'], 10)
  });

  const featuredSong = newReleases?.[0];

  const handleCategoryClick = (term: string) => {
    setLocation(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <Layout>
      <div className="px-5 pt-8 pb-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Browse</h1>
        </div>

        {isLoading ? (
          <Skeleton className="w-full aspect-[16/10] rounded-xl mb-8" />
        ) : featuredSong && (
          <div 
            className="w-full aspect-[16/10] rounded-xl overflow-hidden relative mb-8 cursor-pointer shadow-lg group"
            onClick={() => play(featuredSong)}
            data-testid="featured-banner"
          >
            <img 
              src={featuredSong.coverUrl} 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              alt="Featured" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-1">New Release</p>
              <h2 className="text-2xl font-bold text-white mb-1 line-clamp-1">{featuredSong.title}</h2>
              <p className="text-gray-300">{featuredSong.artist}</p>
            </div>
          </div>
        )}

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Browse by Genre</h2>
          <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent>
              {CATEGORIES.map((category) => (
                <CarouselItem key={category.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <CategoryCard 
                    category={category} 
                    onClick={() => handleCategoryClick(category.term)}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        </section>

        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold">We Recommend</h2>
          </div>
          <div className="space-y-4">
            {isLoadingRecs ? (
               Array(3).fill(0).map((_, i) => (
                 <div key={i} className="flex items-center gap-4">
                   <Skeleton className="w-16 h-16 rounded-md" />
                   <div className="flex-1">
                     <Skeleton className="h-4 w-3/4 mb-2" />
                     <Skeleton className="h-3 w-1/2" />
                   </div>
                 </div>
               ))
            ) : (
              recommendations?.map((song) => (
                <div 
                  key={song.id} 
                  className="flex items-center gap-4 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors group"
                  onClick={() => play(song)}
                  data-testid={`recommendation-${song.id}`}
                >
                  <img src={song.coverUrl} alt={song.title} className="w-16 h-16 rounded-md object-cover shadow-sm group-hover:scale-105 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate text-white">{song.title}</h3>
                    <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                    <p className="text-xs text-gray-500 mt-1">{song.album}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

function CategoryCard({ 
  category, 
  onClick 
}: { 
  category: typeof CATEGORIES[0], 
  onClick: () => void 
}) {
  return (
    <div 
      className="relative w-full aspect-square rounded-lg overflow-hidden cursor-pointer group transition-all hover:scale-105 active:scale-95"
      onClick={onClick}
      data-testid={`category-${category.id}`}
    >
      <img 
        src={category.image} 
        alt={category.name}
        className="absolute inset-0 w-full h-full object-cover brightness-110"
      />
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-30 group-hover:opacity-20 transition-opacity",
        category.color
      )} />
      <span className="absolute bottom-3 left-3 font-bold text-white drop-shadow-lg text-lg">{category.name}</span>
    </div>
  );
}
