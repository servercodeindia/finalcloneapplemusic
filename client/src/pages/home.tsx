import { Layout } from "@/components/Layout";
import { usePlayer } from "@/hooks/use-player";
import { getFeaturedMusic, getRecommendations } from "@/lib/spotify";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function HomePage() {
  const { play } = usePlayer();

  // Get today's date to create a daily refresh - songs change every day
  const todayDate = new Date().toISOString().split('T')[0];
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

  const { data: topPicks, isLoading: isLoadingTop } = useQuery({
    queryKey: ['itunes', 'featured', todayDate],
    queryFn: () => getRecommendations([`rock${dayOfYear}`, `alternative${dayOfYear}`, `indie${dayOfYear}`], 10)
  });

  const { data: recentPicks, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['itunes', 'recommendations', todayDate],
    queryFn: () => getRecommendations([`pop${dayOfYear}`, `dance${dayOfYear}`, `electronic${dayOfYear}`], 8)
  });

  const { data: trendingPicks, isLoading: isLoadingTrending } = useQuery({
    queryKey: ['itunes', 'trending', todayDate],
    queryFn: () => getRecommendations([`hip hop${dayOfYear}`, `rap${dayOfYear}`, `r&b${dayOfYear}`], 10)
  });

  const { data: relaxingPicks, isLoading: isLoadingRelaxing } = useQuery({
    queryKey: ['itunes', 'relaxing', todayDate],
    queryFn: () => getRecommendations([`jazz${dayOfYear}`, `acoustic${dayOfYear}`, `chill${dayOfYear}`], 8)
  });

  return (
    <Layout>
      <div className="px-5 pt-8 pb-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Home</h1>
        </div>

        <section className="mb-8">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
            <h2 className="text-xl font-bold">Top Picks For You</h2>
          </div>
          
          <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent>
              {isLoadingTop ? (
                Array(4).fill(0).map((_, i) => (
                  <CarouselItem key={i} className="basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <div className="w-full">
                      <Skeleton className="aspect-[16/10] w-full rounded-lg mb-3" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </CarouselItem>
                ))
              ) : (
                topPicks?.map((song) => (
                  <CarouselItem key={song.id} className="basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <div 
                      className="w-full cursor-pointer group"
                      onClick={() => play(song)}
                    >
                      <div className="overflow-hidden rounded-lg mb-3 relative shadow-lg">
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors z-10" />
                        <img 
                          src={song.coverUrl} 
                          alt={song.title} 
                          className="object-cover aspect-[16/10] w-full group-hover:scale-105 transition-transform duration-500" 
                          loading="lazy"
                        />
                        <div className="absolute bottom-2 left-3 z-20">
                          <p className="text-xs font-medium uppercase text-white/80 tracking-wider mb-1">Featured</p>
                          <p className="text-lg font-bold text-white drop-shadow-md truncate w-[90%]">{song.title}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                    </div>
                  </CarouselItem>
                ))
              )}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        </section>

        <section className="mb-8">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
            <h2 className="text-xl font-bold">Popular Right Now</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isLoadingRecent ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-square rounded-lg mb-2" />
                  <Skeleton className="h-3 w-3/4 mb-1" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              ))
            ) : (
              recentPicks?.map((song) => (
                <div 
                  key={song.id} 
                  className="cursor-pointer group"
                  onClick={() => play(song)}
                >
                  <div className="aspect-square overflow-hidden rounded-lg mb-2 shadow-sm bg-neutral-800 relative">
                    <img 
                      src={song.coverUrl} 
                      alt={song.title} 
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      loading="lazy"
                    />
                  </div>
                  <h3 className="font-medium text-sm truncate">{song.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mb-8">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
            <h2 className="text-xl font-bold">Trending Now</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isLoadingTrending ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-square rounded-lg mb-2" />
                  <Skeleton className="h-3 w-3/4 mb-1" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              ))
            ) : (
              trendingPicks?.map((song) => (
                <div 
                  key={song.id} 
                  className="cursor-pointer group"
                  onClick={() => play(song)}
                >
                  <div className="relative overflow-hidden rounded-lg mb-2">
                    <img 
                      src={song.coverUrl} 
                      alt={song.title} 
                      className="object-cover aspect-square w-full group-hover:scale-105 transition-transform duration-500" 
                      loading="lazy"
                    />
                  </div>
                  <p className="text-sm font-medium truncate">{song.title}</p>
                  <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
            <h2 className="text-xl font-bold">Relaxing Vibes</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isLoadingRelaxing ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-square rounded-lg mb-2" />
                  <Skeleton className="h-3 w-3/4 mb-1" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              ))
            ) : (
              relaxingPicks?.map((song) => (
                <div 
                  key={song.id} 
                  className="cursor-pointer group"
                  onClick={() => play(song)}
                >
                  <div className="relative overflow-hidden rounded-lg mb-2">
                    <img 
                      src={song.coverUrl} 
                      alt={song.title} 
                      className="object-cover aspect-square w-full group-hover:scale-105 transition-transform duration-500" 
                      loading="lazy"
                    />
                  </div>
                  <p className="text-sm font-medium truncate">{song.title}</p>
                  <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
