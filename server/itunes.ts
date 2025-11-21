import type { Song } from "@shared/types";

const BASE_URL = "https://itunes.apple.com";

export interface ItunesResult {
  wrapperType: string;
  kind: string;
  artistId: number;
  collectionId: number;
  trackId: number;
  artistName: string;
  collectionName: string;
  trackName: string;
  collectionCensoredName: string;
  trackCensoredName: string;
  artistViewUrl: string;
  collectionViewUrl: string;
  trackViewUrl: string;
  previewUrl: string;
  artworkUrl30: string;
  artworkUrl60: string;
  artworkUrl100: string;
  collectionPrice: number;
  trackPrice: number;
  releaseDate: string;
  collectionExplicitness: string;
  trackExplicitness: string;
  discCount: number;
  discNumber: number;
  trackCount: number;
  trackNumber: number;
  trackTimeMillis: number;
  country: string;
  currency: string;
  primaryGenreName: string;
  isStreamable: boolean;
}

interface ItunesSearchResponse {
  resultCount: number;
  results: ItunesResult[];
}

class ItunesClient {
  private formatDuration(millis: number): string {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  private resultToSong(item: ItunesResult): Song {
    return {
      id: item.trackId.toString(),
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName,
      coverUrl: item.artworkUrl100.replace("100x100bb", "600x600bb"),
      duration: this.formatDuration(item.trackTimeMillis),
      previewUrl: item.previewUrl || undefined
    };
  }

  async search(term: string, limit: number = 25): Promise<Song[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit * 2}`
      );
      
      if (!response.ok) {
        throw new Error(`iTunes search failed: ${response.statusText}`);
      }

      const data: ItunesSearchResponse = await response.json();
      
      const songs = data.results
        .filter((item: ItunesResult) => item.previewUrl)
        .map((item: ItunesResult) => this.resultToSong(item))
        .slice(0, limit);
      
      return songs;
    } catch (error) {
      console.error("Error searching iTunes:", error);
      return [];
    }
  }

  async lookup(trackId: string): Promise<Song | null> {
    try {
      const response = await fetch(
        `${BASE_URL}/lookup?id=${trackId}&entity=song`
      );
      
      if (!response.ok) {
        throw new Error(`iTunes lookup failed: ${response.statusText}`);
      }

      const data: ItunesSearchResponse = await response.json();
      
      if (data.results.length > 0 && data.results[0].previewUrl) {
        return this.resultToSong(data.results[0]);
      }
      
      return null;
    } catch (error) {
      console.error("Error looking up iTunes track:", error);
      return null;
    }
  }

  async searchByGenre(genre: string, limit: number = 25): Promise<Song[]> {
    return this.search(genre, limit);
  }

  async searchByArtist(artist: string, limit: number = 25): Promise<Song[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/search?term=${encodeURIComponent(artist)}&media=music&entity=song&attribute=artistTerm&limit=${limit * 2}`
      );
      
      if (!response.ok) {
        throw new Error(`iTunes artist search failed: ${response.statusText}`);
      }

      const data: ItunesSearchResponse = await response.json();
      
      const songs = data.results
        .filter((item: ItunesResult) => item.previewUrl)
        .map((item: ItunesResult) => this.resultToSong(item))
        .slice(0, limit);
      
      return songs;
    } catch (error) {
      console.error("Error searching iTunes by artist:", error);
      return [];
    }
  }
}

export const itunesClient = new ItunesClient();
