import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseVideoUrl } from '../utils/video'; 
const HomePage: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // The parseVideoUrl function is now gone from here!

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // We now use the imported function
    const videoInfo = parseVideoUrl(videoUrl);

    if (videoInfo.source === 'unknown' || !videoInfo.id) {
      setError('Please enter a valid YouTube or Google Drive URL.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URI}/api/rooms`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to create room on the server.');

      const { roomId } = await response.json();
      
      const searchParams = new URLSearchParams({
        source: videoInfo.source,
        id: videoInfo.id,
      }).toString();

      navigate(`/room/${roomId}?${searchParams}`);

    } catch (err) {
      setError('Could not create a room. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-900 text-white">
      <img src="/party.png" alt="Watch Together" className="w-20 h-20 mb-4" />
      <h1 className="text-4xl md:text-6xl font-bold mb-2">Watch Together</h1>
      <p className="text-lg text-gray-400 mb-8 max-w-xl">
        Paste a YouTube or Google Drive link to create a private room and watch videos in sync with your friends.
      </p>
      <form onSubmit={handleCreateRoom} className="w-full max-w-xl flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Paste YouTube or Google Drive link here..."
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