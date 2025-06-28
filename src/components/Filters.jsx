import { Search } from 'lucide-react';

const Filters = ({
  filters,
  setFilters,
  showMyDoubts,
  showPopularHashtags,
  showMostLiked,
  showBookmarks,
  setShowMyDoubts,
  setShowPopularHashtags,
  setShowMostLiked,
  setShowBookmarks
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search hashtags..."
            value={filters.hashtag}
            onChange={(e) => setFilters({ ...filters, hashtag: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Batch ID..."
            value={filters.batchId}
            onChange={(e) => setFilters({ ...filters, batchId: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => {
            setFilters({ hashtag: '', batchId: '', search: '' });
            setShowMyDoubts(false);
            setShowPopularHashtags(false);
            setShowMostLiked(false);
            setShowBookmarks(false);
          }}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Clear Filters
        </button>
        <button
          onClick={() => {
            const show = !(showMyDoubts || showPopularHashtags || showMostLiked || showBookmarks);
            setShowMyDoubts(show);
            setShowPopularHashtags(false);
            setShowMostLiked(false);
            setShowBookmarks(false);
          }}
          className="lg:hidden px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {showMyDoubts || showPopularHashtags || showMostLiked || showBookmarks ? 'Hide Sidebar' : 'Show Sidebar'}
        </button>
      </div>
    </div>
  );
};

export default Filters;