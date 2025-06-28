import React from 'react';
import { User, Hash, Heart, Bookmark, Sparkles, ChevronLeft, ChevronRight, Calendar, MessageCircle } from 'lucide-react';

const Sidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  showMyDoubts,
  setShowMyDoubts,
  showPopularHashtags,
  setShowPopularHashtags,
  showMostLiked,
  setShowMostLiked,
  showBookmarks,
  setShowBookmarks,
  myDoubts,
  popularHashtags,
  mostLikedQuestions,
  bookmarkedDoubts,
  handleViewDoubt,
  handleHashtagClick,
  handleLikeHashtag
}) => {
  return (
    <div
      className={`lg:w-72 transition-all duration-500 ease-in-out ${
        isSidebarOpen ? 'block' : 'hidden lg:block'
      }`}
    >
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden transition-all duration-500 hover:shadow-3xl hover:border-blue-200/50 mb-6">
        {/* Animated gradient header */}
        <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                {showMyDoubts && (
                  <>
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    My Doubts
                  </>
                )}
                {showPopularHashtags && (
                  <>
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Hash className="w-4 h-4" />
                    </div>
                    Popular Hashtags
                  </>
                )}
                {showMostLiked && (
                  <>
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Heart className="w-4 h-4" />
                    </div>
                    Most Liked
                  </>
                )}
                {showBookmarks && (
                  <>
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Bookmark className="w-4 h-4" />
                    </div>
                    Bookmarks
                  </>
                )}
                {!showMyDoubts && !showPopularHashtags && !showMostLiked && !showBookmarks && (
                  <>
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    Quick Access
                  </>
                )}
              </h3>

              {/* Enhanced Back Button */}
              {(showMyDoubts || showPopularHashtags || showMostLiked || showBookmarks) && (
                <button
                  onClick={() => {
                    setShowMyDoubts(false);
                    setShowPopularHashtags(false);
                    setShowMostLiked(false);
                    setShowBookmarks(false);
                  }}
                  className="group relative p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all duration-300 hover:scale-110 overflow-hidden"
                  title="Back to main menu"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                  <ChevronLeft className="w-5 h-5 text-white relative z-10 transition-transform duration-300 group-hover:-translate-x-1" />
                </button>
              )}
            </div>

            {/* Subtitle with smooth fade-in */}
            <p className="text-blue-100/80 text-sm animate-fade-in">
              {showMyDoubts && `${myDoubts.length} doubts posted`}
              {showPopularHashtags && `${popularHashtags.length} trending tags`}
              {showMostLiked && `${mostLikedQuestions.length} top questions`}
              {showBookmarks && `${bookmarkedDoubts.length} saved items`}
              {!showMyDoubts && !showPopularHashtags && !showMostLiked && !showBookmarks &&
                'Navigate through your learning journey'}
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {showMyDoubts ? (
            <div className="space-y-4">
              {myDoubts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">You haven't posted any doubts yet</p>
                  <p className="text-xs text-gray-400 mt-1">Start your learning journey!</p>
                </div>
              ) : (
                myDoubts.map((doubt, index) => (
                  <div
                    key={doubt._id}
                    className="group relative p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-purple-50 border border-gray-200 hover:border-blue-300 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 transform"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => {
                      handleViewDoubt(doubt);
                      setShowMyDoubts(false);
                      setIsSidebarOpen(false);
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors duration-300">
                        {doubt.title}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(doubt.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {doubt.comments?.length || 0}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-all duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : showPopularHashtags ? (
            <div className="space-y-3">
              {popularHashtags.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <Hash className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No popular hashtags yet</p>
                  <p className="text-xs text-gray-400 mt-1">Be the first to start trending!</p>
                </div>
              ) : (
                popularHashtags.map((hashtag, index) => (
                  <div
                    key={hashtag._id}
                    className="group relative flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-indigo-50 hover:to-blue-50 border border-gray-200 hover:border-indigo-300 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105"
                    style={{ animationDelay: `${index * 80}ms` }}
                    onClick={() => {
                      handleHashtagClick(hashtag.name);
                      setIsSidebarOpen(false);
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="flex items-center relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-lg flex items-center justify-center mr-3 group-hover:from-indigo-500/30 group-hover:to-blue-500/30 transition-all duration-300">
                        <Hash className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors duration-300">
                          #{hashtag.name}
                        </span>
                        <p className="text-xs text-gray-500">{hashtag.count} uses</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeHashtag(hashtag.name);
                        }}
                        className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                          hashtag.isLiked ? 'text-red-600 bg-red-50' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${hashtag.isLiked ? 'fill-current' : ''}`} />
                      </button>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-all duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : showMostLiked ? (
            <div className="space-y-4">
              {mostLikedQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No questions yet</p>
                  <p className="text-xs text-gray-400 mt-1">Ask something amazing!</p>
                </div>
              ) : (
                mostLikedQuestions.map((doubt, index) => (
                  <div
                    key={doubt._id}
                    className="group relative p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-rose-50 hover:to-pink-50 border border-gray-200 hover:border-rose-300 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => {
                      handleViewDoubt(doubt);
                      setShowMostLiked(false);
                      setIsSidebarOpen(false);
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-pink-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-rose-700 transition-colors duration-300">
                        {doubt.title}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-rose-600">
                            <Heart className="w-3 h-3 fill-current" />
                            {doubt.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {doubt.comments?.length || 0}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-rose-500 transition-all duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : showBookmarks ? (
            <div className="space-y-4">
              {bookmarkedDoubts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <Bookmark className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No bookmarked doubts yet</p>
                  <p className="text-xs text-gray-400 mt-1">Save interesting questions!</p>
                </div>
              ) : (
                bookmarkedDoubts.map((doubt, index) => (
                  <div
                    key={doubt._id}
                    className="group relative p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-amber-50 hover:to-yellow-50 border border-gray-200 hover:border-amber-300 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => {
                      handleViewDoubt(doubt);
                      setShowBookmarks(false);
                      setIsSidebarOpen(false);
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors duration-300">
                        {doubt.title}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(doubt.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {doubt.comments?.length || 0}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 transition-all duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowMyDoubts(true);
                  setIsSidebarOpen(true);
                }}
                className="group w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-indigo-50 border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-indigo-500/30 transition-all duration-300">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                      My Doubts
                    </span>
                    <p className="text-xs text-gray-500">{myDoubts.length} questions</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-all duration-300 group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => {
                  setShowBookmarks(true);
                  setIsSidebarOpen(true);
                }}
                className="group w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-amber-50 hover:to-yellow-50 border border-gray-200 hover:border-amber-300 transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-lg flex items-center justify-center group-hover:from-amber-500/30 group-hover:to-yellow-500/30 transition-all duration-300">
                    <Bookmark className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors duration-300">
                      Bookmarks
                    </span>
                    <p className="text-xs text-gray-500">{bookmarkedDoubts.length} saved</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-all duration-300 group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => {
                  setShowPopularHashtags(true);
                  setIsSidebarOpen(true);
                }}
                className="group w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-indigo-50 hover:to-purple-50 border border-gray-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-all duration-300">
                    <Hash className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors duration-300">
                      Popular Hashtags
                    </span>
                    <p className="text-xs text-gray-500">{popularHashtags.length} trending</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-all duration-300 group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => {
                  setShowMostLiked(true);
                  setIsSidebarOpen(true);
                }}
                className="group w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-rose-50 hover:to-pink-50 border border-gray-200 hover:border-rose-300 transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-lg flex items-center justify-center group-hover:from-rose-500/30 group-hover:to-pink-500/30 transition-all duration-300">
                    <Heart className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-gray-900 group-hover:text-rose-700 transition-colors duration-300">
                      Most Liked
                    </span>
                    <p className="text-xs text-gray-500">{mostLikedQuestions.length} questions</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-rose-500 transition-all duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          )}
        </div>

        {/* Enhanced Bottom Accent */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      </div>

      {/* Enhanced CSS Animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-shimmer {
          animation: shimmer 3s infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }

        .group:hover .group-hover\\:shadow-glow {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }

        * {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
};

export default Sidebar;