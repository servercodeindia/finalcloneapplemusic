var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertLibrarySongSchema: () => insertLibrarySongSchema,
  insertPlaylistSchema: () => insertPlaylistSchema,
  insertPlaylistSongSchema: () => insertPlaylistSongSchema,
  librarySongs: () => librarySongs,
  playlistSongs: () => playlistSongs,
  playlistSongsRelations: () => playlistSongsRelations,
  playlists: () => playlists,
  playlistsRelations: () => playlistsRelations,
  songQuerySchema: () => songQuerySchema
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var playlists = pgTable("playlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  isFavorite: text("is_favorite").default("false").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var librarySongs = pgTable("library_songs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  songId: text("song_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  coverUrl: text("cover_url").notNull(),
  previewUrl: text("preview_url"),
  duration: text("duration"),
  addedAt: timestamp("added_at").defaultNow().notNull()
});
var playlistSongs = pgTable("playlist_songs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playlistId: varchar("playlist_id").notNull().references(() => playlists.id, { onDelete: "cascade" }),
  songId: text("song_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  coverUrl: text("cover_url").notNull(),
  previewUrl: text("preview_url"),
  duration: text("duration"),
  addedAt: timestamp("added_at").defaultNow().notNull()
}, (table) => ({
  uniquePlaylistSong: sql`UNIQUE(${table.playlistId}, ${table.songId})`
}));
var playlistsRelations = relations(playlists, ({ many }) => ({
  songs: many(playlistSongs)
}));
var playlistSongsRelations = relations(playlistSongs, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistSongs.playlistId],
    references: [playlists.id]
  })
}));
var insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertLibrarySongSchema = createInsertSchema(librarySongs).omit({
  id: true,
  addedAt: true
});
var insertPlaylistSongSchema = createInsertSchema(playlistSongs).omit({
  id: true,
  addedAt: true
});
var songQuerySchema = z.object({
  source: z.enum(["library", "playlist", "all"]).optional().default("all"),
  playlistId: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().nonnegative().optional().default(0)
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, or, ilike, sql as sql2, and } from "drizzle-orm";
var DatabaseStorage = class {
  initialized = false;
  defaultPlaylistId = "liked-songs-default";
  async ensureDefaultPlaylist() {
    if (this.initialized) return;
    try {
      const existing = await db.select().from(playlists).where(eq(playlists.id, this.defaultPlaylistId)).limit(1);
      if (existing.length === 0) {
        await db.insert(playlists).values({
          id: this.defaultPlaylistId,
          name: "Favorite",
          description: "Your favorite songs",
          isFavorite: "true"
        });
      }
      this.initialized = true;
    } catch (error) {
      console.error("Error creating default playlist:", error);
    }
  }
  // Playlist methods
  async getPlaylists() {
    await this.ensureDefaultPlaylist();
    return await db.select().from(playlists).orderBy(desc(playlists.createdAt));
  }
  async getPlaylist(id) {
    await this.ensureDefaultPlaylist();
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id)).limit(1);
    return playlist;
  }
  async createPlaylist(playlist) {
    await this.ensureDefaultPlaylist();
    const [newPlaylist] = await db.insert(playlists).values(playlist).returning();
    return newPlaylist;
  }
  async updatePlaylist(id, playlist) {
    await this.ensureDefaultPlaylist();
    const [updated] = await db.update(playlists).set({ ...playlist, updatedAt: /* @__PURE__ */ new Date() }).where(eq(playlists.id, id)).returning();
    return updated;
  }
  async deletePlaylist(id) {
    await this.ensureDefaultPlaylist();
    if (id === this.defaultPlaylistId) {
      throw new Error("Cannot delete the default Liked Songs playlist");
    }
    await db.delete(playlists).where(eq(playlists.id, id));
  }
  // Playlist songs methods
  async getPlaylistSongs(playlistId) {
    await this.ensureDefaultPlaylist();
    return await db.select().from(playlistSongs).where(eq(playlistSongs.playlistId, playlistId)).orderBy(desc(playlistSongs.addedAt));
  }
  async addSongToPlaylist(song) {
    await this.ensureDefaultPlaylist();
    const existingSong = await this.isSongInPlaylist(song.playlistId, song.songId);
    if (existingSong) {
      throw new Error("Song already exists in this playlist");
    }
    const [newSong] = await db.insert(playlistSongs).values(song).returning();
    return newSong;
  }
  async removeSongFromPlaylist(id) {
    await this.ensureDefaultPlaylist();
    await db.delete(playlistSongs).where(eq(playlistSongs.id, id));
  }
  async isSongInPlaylist(playlistId, songId) {
    await this.ensureDefaultPlaylist();
    const [result] = await db.select().from(playlistSongs).where(and(eq(playlistSongs.playlistId, playlistId), eq(playlistSongs.songId, songId))).limit(1);
    return !!result;
  }
  // Library methods
  async getLibrarySongs() {
    await this.ensureDefaultPlaylist();
    return await db.select().from(librarySongs).orderBy(desc(librarySongs.addedAt));
  }
  async addSongToLibrary(song) {
    await this.ensureDefaultPlaylist();
    const [newSong] = await db.insert(librarySongs).values(song).returning();
    return newSong;
  }
  async removeSongFromLibrary(id) {
    await this.ensureDefaultPlaylist();
    await db.delete(librarySongs).where(eq(librarySongs.id, id));
  }
  async isSongInLibrary(songId) {
    await this.ensureDefaultPlaylist();
    const [result] = await db.select().from(librarySongs).where(eq(librarySongs.songId, songId)).limit(1);
    return !!result;
  }
  // Unified song query method
  async getSongs(query) {
    await this.ensureDefaultPlaylist();
    const results = [];
    const shouldPaginateAfterMerge = query.source === "all";
    const fetchLimit = shouldPaginateAfterMerge ? void 0 : query.limit;
    const fetchOffset = shouldPaginateAfterMerge ? void 0 : query.offset;
    if (query.source === "library" || query.source === "all") {
      let libraryQuery = db.select().from(librarySongs);
      if (query.search) {
        libraryQuery = libraryQuery.where(
          or(
            ilike(librarySongs.title, `%${query.search}%`),
            ilike(librarySongs.artist, `%${query.search}%`),
            ilike(librarySongs.album, `%${query.search}%`)
          )
        );
      }
      libraryQuery = libraryQuery.orderBy(desc(librarySongs.addedAt));
      if (fetchLimit !== void 0) {
        libraryQuery = libraryQuery.limit(fetchLimit);
      }
      if (fetchOffset !== void 0) {
        libraryQuery = libraryQuery.offset(fetchOffset);
      }
      const libSongs = await libraryQuery;
      results.push(...libSongs.map((song) => ({
        ...song,
        source: "library"
      })));
    }
    if (query.source === "playlist" || query.source === "all") {
      let playlistQuery = db.select().from(playlistSongs);
      if (query.playlistId) {
        playlistQuery = playlistQuery.where(eq(playlistSongs.playlistId, query.playlistId));
      }
      if (query.search) {
        const searchCondition = or(
          ilike(playlistSongs.title, `%${query.search}%`),
          ilike(playlistSongs.artist, `%${query.search}%`),
          ilike(playlistSongs.album, `%${query.search}%`)
        );
        if (query.playlistId) {
          playlistQuery = playlistQuery.where(
            sql2`${playlistSongs.playlistId} = ${query.playlistId} AND (${searchCondition})`
          );
        } else {
          playlistQuery = playlistQuery.where(searchCondition);
        }
      }
      playlistQuery = playlistQuery.orderBy(desc(playlistSongs.addedAt));
      if (fetchLimit !== void 0) {
        playlistQuery = playlistQuery.limit(fetchLimit);
      }
      if (fetchOffset !== void 0) {
        playlistQuery = playlistQuery.offset(fetchOffset);
      }
      const plSongs = await playlistQuery;
      results.push(...plSongs.map((song) => ({
        ...song,
        source: "playlist"
      })));
    }
    results.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
    if (shouldPaginateAfterMerge) {
      return results.slice(query.offset, query.offset + query.limit);
    }
    return results;
  }
};
var storage = new DatabaseStorage();

// server/itunes.ts
var BASE_URL = "https://itunes.apple.com";
var ItunesClient = class {
  formatDuration(millis) {
    const minutes = Math.floor(millis / 6e4);
    const seconds = Math.floor(millis % 6e4 / 1e3);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }
  resultToSong(item) {
    return {
      id: item.trackId.toString(),
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName,
      coverUrl: item.artworkUrl100.replace("100x100bb", "600x600bb"),
      duration: this.formatDuration(item.trackTimeMillis),
      previewUrl: item.previewUrl || void 0
    };
  }
  async search(term, limit = 25) {
    try {
      const response = await fetch(
        `${BASE_URL}/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit * 2}`
      );
      if (!response.ok) {
        throw new Error(`iTunes search failed: ${response.statusText}`);
      }
      const data = await response.json();
      const songs = data.results.filter((item) => item.previewUrl).map((item) => this.resultToSong(item)).slice(0, limit);
      return songs;
    } catch (error) {
      console.error("Error searching iTunes:", error);
      return [];
    }
  }
  async lookup(trackId) {
    try {
      const response = await fetch(
        `${BASE_URL}/lookup?id=${trackId}&entity=song`
      );
      if (!response.ok) {
        throw new Error(`iTunes lookup failed: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.results.length > 0 && data.results[0].previewUrl) {
        return this.resultToSong(data.results[0]);
      }
      return null;
    } catch (error) {
      console.error("Error looking up iTunes track:", error);
      return null;
    }
  }
  async searchByGenre(genre, limit = 25) {
    return this.search(genre, limit);
  }
  async searchByArtist(artist, limit = 25) {
    try {
      const response = await fetch(
        `${BASE_URL}/search?term=${encodeURIComponent(artist)}&media=music&entity=song&attribute=artistTerm&limit=${limit * 2}`
      );
      if (!response.ok) {
        throw new Error(`iTunes artist search failed: ${response.statusText}`);
      }
      const data = await response.json();
      const songs = data.results.filter((item) => item.previewUrl).map((item) => this.resultToSong(item)).slice(0, limit);
      return songs;
    } catch (error) {
      console.error("Error searching iTunes by artist:", error);
      return [];
    }
  }
};
var itunesClient = new ItunesClient();

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/songs", async (req, res) => {
    try {
      const queryParams = songQuerySchema.parse(req.query);
      const songs = await storage.getSongs(queryParams);
      res.json(songs);
    } catch (error) {
      console.error("Error fetching songs:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid query parameters", details: error.errors });
      }
      res.status(500).json({ error: "Failed to fetch songs" });
    }
  });
  app2.get("/api/playlists", async (req, res) => {
    try {
      const playlists2 = await storage.getPlaylists();
      res.json(playlists2);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });
  app2.get("/api/playlists/:id", async (req, res) => {
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
  app2.post("/api/playlists", async (req, res) => {
    try {
      const validatedData = insertPlaylistSchema.parse(req.body);
      const playlist = await storage.createPlaylist(validatedData);
      res.status(201).json(playlist);
    } catch (error) {
      console.error("Error creating playlist:", error);
      res.status(400).json({ error: "Failed to create playlist" });
    }
  });
  app2.patch("/api/playlists/:id", async (req, res) => {
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
  app2.delete("/api/playlists/:id", async (req, res) => {
    try {
      await storage.deletePlaylist(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting playlist:", error);
      res.status(error.message?.includes("Cannot delete") ? 403 : 500).json({ error: error.message || "Failed to delete playlist" });
    }
  });
  app2.get("/api/playlists/:id/songs", async (req, res) => {
    try {
      const songs = await storage.getPlaylistSongs(req.params.id);
      res.json(songs);
    } catch (error) {
      console.error("Error fetching playlist songs:", error);
      res.status(500).json({ error: "Failed to fetch playlist songs" });
    }
  });
  app2.post("/api/playlists/:id/songs", async (req, res) => {
    try {
      const validatedData = insertPlaylistSongSchema.parse({
        ...req.body,
        playlistId: req.params.id
      });
      const song = await storage.addSongToPlaylist(validatedData);
      res.status(201).json(song);
    } catch (error) {
      console.error("Error adding song to playlist:", error);
      if (error.message?.includes("already exists") || error.constraint === "unique_playlist_song") {
        return res.status(409).json({ error: "Song already exists in this playlist" });
      }
      res.status(400).json({ error: "Failed to add song to playlist" });
    }
  });
  app2.delete("/api/playlist-songs/:id", async (req, res) => {
    try {
      await storage.removeSongFromPlaylist(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing song from playlist:", error);
      res.status(500).json({ error: "Failed to remove song from playlist" });
    }
  });
  app2.get("/api/playlists/:playlistId/songs/check/:songId", async (req, res) => {
    try {
      const inPlaylist = await storage.isSongInPlaylist(req.params.playlistId, req.params.songId);
      res.json({ inPlaylist });
    } catch (error) {
      console.error("Error checking song in playlist:", error);
      res.status(500).json({ error: "Failed to check song" });
    }
  });
  app2.get("/api/library/songs/check/:songId", async (req, res) => {
    try {
      const inLibrary = await storage.isSongInLibrary(req.params.songId);
      res.json({ inLibrary });
    } catch (error) {
      console.error("Error checking song in library:", error);
      res.status(500).json({ error: "Failed to check song" });
    }
  });
  app2.get("/api/library/songs", async (req, res) => {
    try {
      const songs = await storage.getLibrarySongs();
      res.json(songs);
    } catch (error) {
      console.error("Error fetching library songs:", error);
      res.status(500).json({ error: "Failed to fetch library songs" });
    }
  });
  app2.post("/api/library/songs", async (req, res) => {
    try {
      const validatedData = insertLibrarySongSchema.parse(req.body);
      const song = await storage.addSongToLibrary(validatedData);
      res.status(201).json(song);
    } catch (error) {
      console.error("Error adding song to library:", error);
      res.status(400).json({ error: "Failed to add song to library" });
    }
  });
  app2.delete("/api/library/songs/:id", async (req, res) => {
    try {
      await storage.removeSongFromLibrary(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing song from library:", error);
      res.status(500).json({ error: "Failed to remove song from library" });
    }
  });
  app2.get("/api/library/songs/check/:songId", async (req, res) => {
    try {
      const inLibrary = await storage.isSongInLibrary(req.params.songId);
      res.json({ inLibrary });
    } catch (error) {
      console.error("Error checking song in library:", error);
      res.status(500).json({ error: "Failed to check song" });
    }
  });
  app2.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q;
      const limit = parseInt(req.query.limit) || 25;
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
  app2.get("/api/itunes/search", async (req, res) => {
    try {
      const query = req.query.q;
      const limit = parseInt(req.query.limit) || 25;
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
  app2.get("/api/itunes/lookup/:id", async (req, res) => {
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
  app2.get("/api/itunes/artist/:artist", async (req, res) => {
    try {
      const artist = req.params.artist;
      const limit = parseInt(req.query.limit) || 25;
      const songs = await itunesClient.searchByArtist(artist, limit);
      res.json(songs);
    } catch (error) {
      console.error("Error searching iTunes by artist:", error);
      res.status(500).json({ error: "Failed to search by artist" });
    }
  });
  app2.get("/api/itunes/genre/:genre", async (req, res) => {
    try {
      const genre = req.params.genre;
      const limit = parseInt(req.query.limit) || 25;
      const songs = await itunesClient.searchByGenre(genre, limit);
      res.json(songs);
    } catch (error) {
      console.error("Error searching iTunes by genre:", error);
      res.status(500).json({ error: "Failed to search by genre" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    tailwindcss(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  css: {
    postcss: {
      plugins: []
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
