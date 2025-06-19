import React, { useState } from 'react';

type VideoInfo = {
  source: 'youtube' | 'gdrive';
  id: string;
};

const parseVideoUrl = (url: string): VideoInfo | null => {
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = url.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return { source: 'youtube', id: ytMatch[1] };
  }

  const gdRegex = /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
  const gdMatch = url.match(gdRegex);
  if (gdMatch && gdMatch[1]) {
    const previewLink = `https://drive.google.com/file/d/${gdMatch[1]}/preview`;
    return { source: 'gdrive', id: previewLink };
  }

  return null;
};

interface VideoURLInputProps {
  onVideoChange: (video: VideoInfo) => void;
}

const VideoURLInput: React.FC<VideoURLInputProps> = ({ onVideoChange }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoInfo = parseVideoUrl(url);
    if (videoInfo) {
      onVideoChange(videoInfo);
      setUrl('');
    } else {
      alert('Invalid YouTube or Google Drive URL');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste new YouTube or Google Drive URL and press Enter"
        className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md transition-colors"
      >
        Change Video
      </button>
    </form>
  );
};

export default VideoURLInput;
