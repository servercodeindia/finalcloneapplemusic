import { Switch, Route } from "wouter";
import { PlayerProvider } from "@/hooks/use-player";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

import HomePage from "@/pages/home";
import BrowsePage from "@/pages/browse";
import RadioPage from "@/pages/radio";
import RadioDetailPage from "@/pages/radio/[id]";
import LibraryPage from "@/pages/library";
import PlaylistsPage from "@/pages/library/playlists";
import PlaylistDetailPage from "@/pages/library/playlists/[id]";
import SearchPage from "@/pages/search";
import ProfilePage from "@/pages/profile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/browse" component={BrowsePage} />
      <Route path="/radio/:id" component={RadioDetailPage} />
      <Route path="/radio" component={RadioPage} />
      <Route path="/library" component={LibraryPage} />
      <Route path="/library/playlists/:id" component={PlaylistDetailPage} />
      <Route path="/library/playlists" component={PlaylistsPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PlayerProvider>
        <Toaster />
        <Router />
      </PlayerProvider>
    </QueryClientProvider>
  );
}

export default App;
