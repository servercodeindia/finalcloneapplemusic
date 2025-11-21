import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { itunesClient } from "./itunes";
import { 
  insertPlaylistSchema, 
  insertLibrarySongSchema, 
  insertPlaylistSongSchema,
  songQuerySchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Unified songs API - Public endpoint for all song details
  app.get("/api/songs", async (req, res) => {
    try {
      const queryParams = songQuerySchema.parse(req.query);
      const songs = await storage.getSongs(queryParams);
      res.json(songs);
    } catch (error: any) {
      console.error("Error fetching songs:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid query parameters", details: error.errors });
      }
      res.status(500).json({ error: "Failed to fetch songs" });
    }
  });

  // Playlist routes
  app.get("/api/playlists", async (req, res) => {
    try {
      const playlists = await storage.getPlaylists();
      res.json(playlists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  app.get("/api/playlists/:id", async (req, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }
      res.json(playlist);
    } catch (error) {
      console.error("Error fetching playlist:", error);
      res.status(500).json({ error: "Failed to fetch playlist" });
    }
  });

  app.post("/api/playlists", async (req, res) => {
    try {
      const validatedData = insertPlaylistSchema.parse(req.body);
      const playlist = await storage.createPlaylist(validatedData);
      res.status(201).json(playlist);
    } catch (error) {
      console.error("Error creating playlist:", error);
      res.status(400).json({ error: "Failed to create playlist" });
    }
  });

  app.patch("/api/playlists/:id", async (req, res) => {
    try {
      const validatedData = insertPlaylistSchema.partial().parse(req.body);
      const playlist = await storage.updatePlaylist(req.params.id, validatedData);
      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }
      res.json(playlist);
    } catch (error) {
      console.error("Error updating playlist:", error);
      res.status(400).json({ error: "Failed to update playlist" });
    }
  });

  app.delete("/api/playlists/:id", async (req, res) => {
    try {
      await storage.deletePlaylist(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting playlist:", error);
      res.status(error.message?.includes("Cannot delete") ? 403 : 500).json({ error: error.message || "Failed to delete playlist" });
    }
  });

  // Playlist songs routes
  app.get("/api/playlists/:id/songs", async (req, res) => {
    try {
      const songs = await storage.getPlaylistSongs(req.params.id);
      res.json(songs);
    } catch (error) {
      console.error("Error fetching playlist songs:", error);
      res.status(500).json({ error: "Failed to fetch playlist songs" });
    }
  });

  app.post("/api/playlists/:id/songs", async (req, res) => {
    try {
      const validatedData = insertPlaylistSongSchema.parse({
        ...req.body,
        playlistId: req.params.id,
      });
      
      const song = await storage.addSongToPlaylist(validatedData);
      res.status(201).json(song);
    } catch (error: any) {
      console.error("Error adding song to playlist:", error);
      
      // Handle duplicate constraint violation
      if (error.message?.includes("already exists") || error.constraint === "unique_playlist_song") {
        return res.status(409).json({ error: "Song already exists in this playlist" });
      }
      
      res.status(400).json({ error: "Failed to add song to playlist" });
    }
  });

  app.delete("/api/playlist-songs/:id", async (req, res) => {
    try {
      await storage.removeSongFromPlaylist(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing song from playlist:", error);
      res.status(500).json({ error: "Failed to remove song from playlist" });
    }
  });

  app.get("/api/playlists/:playlistId/songs/check/:songId", async (req, res) => {
    try {
      const inPlaylist = await storage.isSongInPlaylist(req.params.playlistId, req.params.songId);
      res.json({ inPlaylist });
    } catch (error: any) {
      console.error("Error checking song in playlist:", error);
      res.status(500).json({ error: "Failed to check song" });
    }
  });

  app.get("/api/library/songs/check/:songId", async (req, res) => {
    try {
      const inLibrary = await storage.isSongInLibrary(req.params.songId);
      res.json({ inLibrary });
    } catch (error: any) {
      console.error("Error checking song in library:", error);
      res.status(500).json({ error: "Failed to check song" });
    }
  });

  // Library routes
  app.get("/api/library/songs", async (req, res) => {
    try {
      const songs = await storage.getLibrarySongs();
      res.json(songs);
    } catch (error) {
      console.error("Error fetching library songs:", error);
      res.status(500).json({ error: "Failed to fetch library songs" });
    }
  });

  app.post("/api/library/songs", async (req, res) => {
    try {
      const validatedData = insertLibrarySongSchema.parse(req.body);
      const song = await storage.addSongToLibrary(validatedData);
      res.status(201).json(song);
    } catch (error) {
      console.error("Error adding song to library:", error);
      res.status(400).json({ error: "Failed to add song to library" });
    }
  });

  app.delete("/api/library/songs/:id", async (req, res) => {
    try {
      await storage.removeSongFromLibrary(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing song from library:", error);
      res.status(500).json({ error: "Failed to remove song from library" });
    }
  });

  app.get("/api/library/songs/check/:songId", async (req, res) => {
    try {
      const inLibrary = await storage.isSongInLibrary(req.params.songId);
      res.json({ inLibrary });
    } catch (error) {
      console.error("Error checking song in library:", error);
      res.status(500).json({ error: "Failed to check song" });
    }
  });

  // Search API - main search endpoint
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 25;
      
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      
      const songs = await itunesClient.search(query, limit);
      res.json(songs);
    } catch (error) {
      console.error("Error searching:", error);
      res.status(500).json({ error: "Failed to search music" });
    }
  });

  // iTunes routes
  app.get("/api/itunes/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 25;
      
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      
      const songs = await itunesClient.search(query, limit);
      res.json(songs);
    } catch (error) {
      console.error("Error searching iTunes:", error);
      res.status(500).json({ error: "Failed to search music" });
    }
  });

  app.get("/api/itunes/lookup/:id", async (req, res) => {
    try {
      const track = await itunesClient.lookup(req.params.id);
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }
      res.json(track);
    } catch (error) {
      console.error("Error looking up iTunes track:", error);
      res.status(500).json({ error: "Failed to lookup track" });
    }
  });

  app.get("/api/itunes/artist/:artist", async (req, res) => {
    try {
      const artist = req.params.artist;
      const limit = parseInt(req.query.limit as string) || 25;
      
      const songs = await itunesClient.searchByArtist(artist, limit);
      res.json(songs);
    } catch (error) {
      console.error("Error searching iTunes by artist:", error);
      res.status(500).json({ error: "Failed to search by artist" });
    }
  });

  app.get("/api/itunes/genre/:genre", async (req, res) => {
    try {
      const genre = req.params.genre;
      const limit = parseInt(req.query.limit as string) || 25;
      
      const songs = await itunesClient.searchByGenre(genre, limit);
      res.json(songs);
    } catch (error) {
      console.error("Error searching iTunes by genre:", error);
      res.status(500).json({ error: "Failed to search by genre" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
