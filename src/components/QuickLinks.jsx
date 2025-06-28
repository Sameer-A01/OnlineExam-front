import React from 'react';
import { User, Bookmark, Hash, Heart } from 'lucide-react';

const QuickLinks = ({ 
  setShowMyDoubts, 
  setShowBookmarks, 
  setShowPopularHashtags, 
  setShowMostLiked 
}) => {
  return (
    <div className="space-y-2">
      <button
        onClick={() => {
          setShowMyDoubts(true);
          setShowPopularHashtags(false);
          setShowMostLiked(false);
          setShowBookmarks(false);
        }}
        className="w-full flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
      >
        <User className="w-4 h-4" />
        <span>My Doubts</span>
      </button>
      <button
        onClick={() => {
          setShowBookmarks(true);
          setShowMyDoubts(false);
          setShowPopularHashtags(false);
          setShowMostLiked(false);
        }}
        className="w-full flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
      >
        <Bookmark className="w-4 h-4" />
        <span>Bookmarks</span>
      </button>
      <button
        onClick={() => {
          setShowPopularHashtags(true);
          setShowMyDoubts(false);
          setShowBookmarks(false);
          setShowMostLiked(false);
        }}
        className="w-full flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
      >
        <Hash className="w-4 h-4" />
        <span>Popular Hashtags</span>
      </button>
      <button
        onClick={() => {
          setShowMostLiked(true);
          setShowMyDoubts(false);
          setShowPopularHashtags(false);
          setShowBookmarks(false);
        }}
        className="w-full flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
      >
        <Heart className="w-4 h-4" />
        <span>Most Liked</span>
      </button>
    </div>
  );
};

export default QuickLinks;