// Import the VideoInfo type from your central types file
import type { VideoInfo } from '../types';

export const parseVideoUrl = (url: string): VideoInfo => {
  // YouTube Regex for various URL formats
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = url.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return { source: 'youtube', id: ytMatch[1] };
  }

  // Google Drive Regex to extract only the file ID
  const gdRegex = /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
  const gdMatch = url.match(gdRegex);
  if (gdMatch && gdMatch[1]) {
    return { source: 'gdrive', id: gdMatch[1] };
  }
  
  // If no match is found, return an 'unknown' state
  return { source: 'unknown', id: null };
};