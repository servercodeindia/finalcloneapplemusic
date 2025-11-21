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

export async function searchMusic(term: string, limit = 25): Promise<Song[]> {
  try {
    const response = await fetch(`${BASE_URL}/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit * 2}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch music");
    }

    const data = await response.json();
    
    const songs = data.results
      .filter((item: ItunesResult) => item.previewUrl)
      .map((item: ItunesResult) => ({
        id: item.trackId.toString(),
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName,
        coverUrl: item.artworkUrl100.replace("100x100bb", "600x600bb"),
        duration: formatDuration(item.trackTimeMillis),
        previewUrl: item.previewUrl
      }))
      .slice(0, limit);
    
    return songs;
  } catch (error) {
    console.error("Error searching music:", error);
    return [];
  }
}

function formatDuration(millis: number): string {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
}
