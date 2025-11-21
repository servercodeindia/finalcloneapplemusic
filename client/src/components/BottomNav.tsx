import { Link, useLocation } from "wouter";
import { Home, Search, Library, Radio, Disc } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Disc, label: "Browse", path: "/browse" },
    { icon: Radio, label: "Radio", path: "/radio" },
    { icon: Library, label: "Library", path: "/library" },
    { icon: Search, label: "Search", path: "/search" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-xl border-t border-white/20 pb-safe pt-2 shadow-2xl">
      <div className="flex justify-around items-center h-12 px-2">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path} className={cn(
            "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 cursor-pointer px-3 py-2 rounded-full",
            isActive(item.path) ? "text-primary bg-white/10 backdrop-blur-md border border-white/20 scale-110" : "text-gray-400 hover:text-gray-200"
          )}>
            <item.icon 
              size={24} 
              className={cn("transition-transform", isActive(item.path) && "scale-110")} 
              strokeWidth={isActive(item.path) ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
          </Link>
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-gradient-to-t from-white/5 to-transparent" />
    </div>
  );
}
