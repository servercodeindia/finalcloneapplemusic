import { 
  type Playlist,
  type InsertPlaylist,
  type LibrarySong,
  type InsertLibrarySong,
  type PlaylistSong,
  type InsertPlaylistSong,
  type SongDetails,
  type SongQuery,
  playlists,
  librarySongs,
  playlistSongs
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, or, ilike, sql, and } from "drizzle-orm";

export interface IStorage {
  // Playlist methods
  getPlaylists(): Promise<Playlist[]>;
  getPlaylist(id: string): Promise<Playlist | undefined>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  updatePlaylist(id: string, playlist: Partial<InsertPlaylist>): Promise<Playlist | undefined>;
  deletePlaylist(id: string): Promise<void>;
  
  // Playlist songs methods
  getPlaylistSongs(playlistId: string): Promise<PlaylistSong[]>;
  addSongToPlaylist(song: InsertPlaylistSong): Promise<PlaylistSong>;
  removeSongFromPlaylist(id: string): Promise<void>;
  
  // Library methods
  getLibrarySongs(): Promise<LibrarySong[]>;
  addSongToLibrary(song: InsertLibrarySong): Promise<LibrarySong>;
  removeSongFromLibrary(id: string): Promise<void>;
  isSongInLibrary(songId: string): Promise<boolean>;
  
  // Unified song query method
  getSongs(query: SongQuery): Promise<SongDetails[]>;
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export class DatabaseStorage implements IStorage {
  private initialized = false;
  private defaultPlaylistId = "liked-songs-default";

  private async ensureDefaultPlaylist() {
    if (this.initialized) return;
    
    try {
      const existing = await db
        .select()
        .from(playlists)
        .where(eq(playlists.id, this.defaultPlaylistId))
        .limit(1);

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
  async getPlaylists(): Promise<Playlist[]> {
    await this.ensureDefaultPlaylist();
    return await db.select().from(playlists).orderBy(desc(playlists.createdAt));
  }

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    await this.ensureDefaultPlaylist();
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id)).limit(1);
    return playlist;
  }

  async createPlaylist(playlist: InsertPlaylist): Promise<Playlist> {
    await this.ensureDefaultPlaylist();
    const [newPlaylist] = await db
      .insert(playlists)
      .values(playlist)
      .returning();
    return newPlaylist;
  }

  async updatePlaylist(id: string, playlist: Partial<InsertPlaylist>): Promise<Playlist | undefined> {
    await this.ensureDefaultPlaylist();
    const [updated] = await db
      .update(playlists)
      .set({ ...playlist, updatedAt: new Date() })
      .where(eq(playlists.id, id))
      .returning();
    return updated;
  }

  async deletePlaylist(id: string): Promise<void> {
    await this.ensureDefaultPlaylist();
    if (id === this.defaultPlaylistId) {
      throw new Error("Cannot delete the default Liked Songs playlist");
    }
    await db.delete(playlists).where(eq(playlists.id, id));
  }

  // Playlist songs methods
  async getPlaylistSongs(playlistId: string): Promise<PlaylistSong[]> {
    await this.ensureDefaultPlaylist();
    return await db
      .select()
      .from(playlistSongs)
      .where(eq(playlistSongs.playlistId, playlistId))
      .orderBy(desc(playlistSongs.addedAt));
  }

  async addSongToPlaylist(song: InsertPlaylistSong): Promise<PlaylistSong> {
    await this.ensureDefaultPlaylist();
    
    // Check if song already exists in playlist
    const existingSong = await this.isSongInPlaylist(song.playlistId, song.songId);
    if (existingSong) {
      throw new Error("Song already exists in this playlist");
    }
    
    const [newSong] = await db
      .insert(playlistSongs)
      .values(song)
      .returning();
    return newSong;
  }

  async removeSongFromPlaylist(id: string): Promise<void> {
    await this.ensureDefaultPlaylist();
    await db.delete(playlistSongs).where(eq(playlistSongs.id, id));
  }

  async isSongInPlaylist(playlistId: string, songId: string): Promise<boolean> {
    await this.ensureDefaultPlaylist();
    const [result] = await db
      .select()
      .from(playlistSongs)
      .where(and(eq(playlistSongs.playlistId, playlistId), eq(playlistSongs.songId, songId)))
      .limit(1);
    return !!result;
  }

  // Library methods
  async getLibrarySongs(): Promise<LibrarySong[]> {
    await this.ensureDefaultPlaylist();
    return await db
      .select()
      .from(librarySongs)
      .orderBy(desc(librarySongs.addedAt));
  }

  async addSongToLibrary(song: InsertLibrarySong): Promise<LibrarySong> {
    await this.ensureDefaultPlaylist();
    const [newSong] = await db
      .insert(librarySongs)
      .values(song)
      .returning();
    return newSong;
  }

  async removeSongFromLibrary(id: string): Promise<void> {
    await this.ensureDefaultPlaylist();
    await db.delete(librarySongs).where(eq(librarySongs.id, id));
  }

  async isSongInLibrary(songId: string): Promise<boolean> {
    await this.ensureDefaultPlaylist();
    const [result] = await db
      .select()
      .from(librarySongs)
      .where(eq(librarySongs.songId, songId))
      .limit(1);
    return !!result;
  }

  // Unified song query method
  async getSongs(query: SongQuery): Promise<SongDetails[]> {
    await this.ensureDefaultPlaylist();
    
    const results: SongDetails[] = [];
    
    // When fetching from both sources, we need to get enough records to paginate correctly after merging
    // Otherwise, apply pagination directly to the single-source query
    const shouldPaginateAfterMerge = query.source === "all";
    const fetchLimit = shouldPaginateAfterMerge ? undefined : query.limit!;
    const fetchOffset = shouldPaginateAfterMerge ? undefined : query.offset!;
    
    // Fetch library songs if requested
    if (query.source === "library" || query.source === "all") {
      let libraryQuery = db.select().from(librarySongs);
      
      if (query.search) {
        libraryQuery = libraryQuery.where(
          or(
            ilike(librarySongs.title, `%${query.search}%`),
            ilike(librarySongs.artist, `%${query.search}%`),
            ilike(librarySongs.album, `%${query.search}%`)
          )
        ) as any;
      }
      
      libraryQuery = libraryQuery.orderBy(desc(librarySongs.addedAt)) as any;
      
      if (fetchLimit !== undefined) {
        libraryQuery = libraryQuery.limit(fetchLimit) as any;
      }
      if (fetchOffset !== undefined) {
        libraryQuery = libraryQuery.offset(fetchOffset) as any;
      }
      
      const libSongs = await libraryQuery;
      
      results.push(...libSongs.map(song => ({
        ...song,
        source: "library" as const
      })));
    }
    
    // Fetch playlist songs if requested
    if (query.source === "playlist" || query.source === "all") {
      let playlistQuery = db.select().from(playlistSongs);
      
      if (query.playlistId) {
        playlistQuery = playlistQuery.where(eq(playlistSongs.playlistId, query.playlistId)) as any;
      }
      
      if (query.search) {
        const searchCondition = or(
          ilike(playlistSongs.title, `%${query.search}%`),
          ilike(playlistSongs.artist, `%${query.search}%`),
          ilike(playlistSongs.album, `%${query.search}%`)
        );
        
        if (query.playlistId) {
          playlistQuery = playlistQuery.where(
            sql`${playlistSongs.playlistId} = ${query.playlistId} AND (${searchCondition})`
          ) as any;
        } else {
          playlistQuery = playlistQuery.where(searchCondition) as any;
        }
      }
      
      playlistQuery = playlistQuery.orderBy(desc(playlistSongs.addedAt)) as any;
      
      if (fetchLimit !== undefined) {
        playlistQuery = playlistQuery.limit(fetchLimit) as any;
      }
      if (fetchOffset !== undefined) {
        playlistQuery = playlistQuery.offset(fetchOffset) as any;
      }
      
      const plSongs = await playlistQuery;
      
      results.push(...plSongs.map(song => ({
        ...song,
        source: "playlist" as const
      })));
    }
    
    // Sort all results by addedAt descending
    results.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
    
    // Apply pagination after merging if fetching from both sources
    if (shouldPaginateAfterMerge) {
      return results.slice(query.offset!, query.offset! + query.limit!);
    }
    
    return results;
  }
}

export const storage = new DatabaseStorage();
