// src/pages/HomePage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PartyPopper } from 'lucide-react';

const HomePage: React.FC = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] ?? null : null;
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const videoId = extractVideoId(youtubeUrl);
    
    if (!videoId) {
      setError('Please enter a valid YouTube URL.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/rooms', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to create room on the server.');
      
      const { roomId } = await response.json();
      navigate(`/room/${roomId}?videoId=${videoId}`);
    } catch (err) {
      setError('Could not create a room. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <PartyPopper size={64} className="text-purple-400 mb-4" />
      <h1 className="text-4xl md:text-6xl font-bold mb-2">Watch Together</h1>
      <p className="text-lg text-gray-400 mb-8 max-w-xl">
        Paste any YouTube link to create a private room and watch videos in sync with your friends.
      </p>
      <form onSubmit={handleCreateRoom} className="w-full max-w-xl flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          className="flex-grow p-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Room'}
        </button>
      </form>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default HomePage;