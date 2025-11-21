import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const playlists = pgTable("playlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  isFavorite: text("is_favorite").default("false").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const librarySongs = pgTable("library_songs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  songId: text("song_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  coverUrl: text("cover_url").notNull(),
  previewUrl: text("preview_url"),
  duration: text("duration"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const playlistSongs = pgTable("playlist_songs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playlistId: varchar("playlist_id").notNull().references(() => playlists.id, { onDelete: "cascade" }),
  songId: text("song_id").notNull(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  coverUrl: text("cover_url").notNull(),
  previewUrl: text("preview_url"),
  duration: text("duration"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
}, (table) => ({
  uniquePlaylistSong: sql`UNIQUE(${table.playlistId}, ${table.songId})`,
}));

// Relations
export const playlistsRelations = relations(playlists, ({ many }) => ({
  songs: many(playlistSongs),
}));

export const playlistSongsRelations = relations(playlistSongs, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistSongs.playlistId],
    references: [playlists.id],
  }),
}));

// Insert schemas
export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLibrarySongSchema = createInsertSchema(librarySongs).omit({
  id: true,
  addedAt: true,
});

export const insertPlaylistSongSchema = createInsertSchema(playlistSongs).omit({
  id: true,
  addedAt: true,
});

// Types
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;

export type InsertLibrarySong = z.infer<typeof insertLibrarySongSchema>;
export type LibrarySong = typeof librarySongs.$inferSelect;

export type InsertPlaylistSong = z.infer<typeof insertPlaylistSongSchema>;
export type PlaylistSong = typeof playlistSongs.$inferSelect;

// Song Details API types
export type SongDetails = {
  id: string;
  songId: string;
  title: string;
  artist: string;
  album: string | null;
  coverUrl: string;
  previewUrl: string | null;
  duration: string | null;
  addedAt: Date;
  source: "library" | "playlist";
  playlistId?: string;
};

// Query parameters schema for /api/songs endpoint
export const songQuerySchema = z.object({
  source: z.enum(["library", "playlist", "all"]).optional().default("all"),
  playlistId: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().nonnegative().optional().default(0)
});

export type SongQuery = z.infer<typeof songQuerySchema>;
