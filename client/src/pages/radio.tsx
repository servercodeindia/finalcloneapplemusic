import { Layout } from "@/components/Layout";
import { Radio, Play } from "lucide-react";
import { useHaptics } from "@/hooks/use-haptics";
import { Link } from "wouter";

export const APPLE_MUSIC_RADIO_STATIONS = [
  { id: "pop-hits", name: "Pop Hits", genre: "pop", description: "Latest pop music", tagline: "Chart-topping pop from today's biggest artists", color: "from-pink-500 to-red-500", icon: "🎤" },
  { id: "indie-vibes", name: "Indie Vibes", genre: "indie", description: "Independent artists", tagline: "Discover emerging independent talent", color: "from-blue-500 to-purple-500", icon: "🎸" },
  { id: "chill-beats", name: "Chill Beats", genre: "chill", description: "Relaxing atmosphere", tagline: "Ambient and relaxing music for focus", color: "from-green-500 to-teal-500", icon: "🌿" },
  { id: "hip-hop-flow", name: "Hip-Hop Flow", genre: "hip-hop", description: "Latest hip-hop tracks", tagline: "The freshest hip-hop and rap", color: "from-yellow-500 to-orange-500", icon: "🎵" },
  { id: "electric-vibes", name: "Electric Vibes", genre: "electronic", description: "Electronic & dance", tagline: "Electronic and dance music all day", color: "from-purple-500 to-pink-500", icon: "⚡" },
];

export default function RadioPage() {
  const { light } = useHaptics();
  const featuredStation = APPLE_MUSIC_RADIO_STATIONS[0];

  return (
    <Layout>
      <div className="pb-20">
        {/* Hero Header */}
        <div className={`bg-gradient-to-b ${featuredStation.color} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative px-5 pt-12 pb-8">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                <Radio size={28} className="text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Listen Now</p>
                <h1 className="text-4xl font-bold text-white tracking-tight">Radio</h1>
              </div>
            </div>
            <p className="text-white/90 text-lg leading-relaxed">Tune in to our expertly curated stations. Let the music flow.</p>
          </div>
        </div>

        {/* Featured Station */}
        <div className="px-5 pt-8 pb-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Featured</h2>
        </div>
        <div className="px-5 pb-8">
          <Link href={`/radio/${featuredStation.id}`}>
            <div
              onClick={light}
              className={`bg-gradient-to-br ${featuredStation.color} rounded-2xl p-8 relative overflow-hidden cursor-pointer group backdrop-blur-md border border-white/20 hover:border-white/40 hover:shadow-2xl transition-all`}
              data-testid={`button-radio-featured`}
            >
              <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors" />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-1">New Every Weekend</p>
                    <h3 className="text-3xl font-bold text-white mb-2">{featuredStation.name}</h3>
                    <p className="text-white/90 text-base">{featuredStation.tagline}</p>
                  </div>
                  <div className="text-5xl">{featuredStation.icon}</div>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-white/25 hover:bg-white/35 rounded-full text-white font-semibold transition-all group-hover:scale-105">
                  <Play size={18} className="fill-white" />
                  <span>Listen</span>
                </button>
              </div>
            </div>
          </Link>
        </div>

        {/* All Stations */}
        <div className="px-5 pt-4 pb-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">All Stations</h2>
        </div>

        <div className="px-5 pb-8">
          <div className="grid grid-cols-2 gap-3">
            {APPLE_MUSIC_RADIO_STATIONS.slice(1).map((station) => (
              <Link key={station.id} href={`/radio/${station.id}`}>
                <div
                  onClick={light}
                  className={`bg-gradient-to-br ${station.color} rounded-xl p-4 relative overflow-hidden cursor-pointer group h-32 flex flex-col justify-between backdrop-blur-md border border-white/20 hover:border-white/40 hover:shadow-xl transition-all`}
                  data-testid={`button-radio-${station.id}`}
                >
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                  <div className="relative z-10">
                    <p className="text-3xl mb-2">{station.icon}</p>
                    <h3 className="text-lg font-bold text-white line-clamp-2">{station.name}</h3>
                  </div>
                  <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                      <Play size={16} className="text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
