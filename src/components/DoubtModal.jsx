import React from 'react';
import { X, Paperclip, Hash, Heart, Eye, Bookmark, Pin, Check, Trash2, Send } from 'lucide-react';

const DoubtModal = ({
  selectedDoubt,
  setSelectedDoubt,
  comments,
  newComment,
  setNewComment,
  commentAttachments,
  handleAttachmentClick,
  handleHashtagClick,
  handleLikeDoubt,
  handleBookmarkDoubt,
  handlePinDoubt,
  handleResolveDoubt,
  handleDeleteDoubt,
  handleCreateComment,
  handleCommentFileChange,
  removeCommentAttachment,
  handleLikeComment,
  handleDeleteComment,
  bookmarkedDoubts,
  renderAuthor,
}) => {
  if (!selectedDoubt) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-lg">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{selectedDoubt.title}</h2>
            <button
              onClick={() => setSelectedDoubt(null)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Doubt Content */}
          <div className="mb-6">
            <p className="text-gray-700 mb-4 whitespace-pre-line text-sm">{selectedDoubt.content}</p>
            {selectedDoubt.attachments?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-600 mb-2">Attachments:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDoubt.attachments.map((file, index) => (
                    <button
                      key={index}
                      onClick={() => handleAttachmentClick(file)}
                      className="inline-flex items-center px-2.5 py-1 border border-gray-200 rounded-md hover:bg-gray-50 text-xs text-gray-700"
                    >
                      <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                      <span>
                        {file.url.split('/').pop().length > 15
                          ? `${file.url.split('/').pop().substring(0, 15)}...${file.url
                              .split('.')
                              .pop()}`
                          : file.url.split('/').pop()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedDoubt.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedDoubt.hashtags.map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => handleHashtagClick(tag)}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-blue-100 transition-colors"
                  >
                    <Hash className="w-3 h-3 mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
              <span>
                By{' '}
                <span className="font-medium text-blue-600">{renderAuthor(selectedDoubt.author)}</span>{' '}
                • {new Date(selectedDoubt.createdAt).toLocaleString()}
              </span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleLikeDoubt(selectedDoubt._id)}
                  className={`flex items-center space-x-1 transition-colors ${
                    selectedDoubt.likes?.includes(selectedDoubt._id)
                      ? 'text-red-500'
                      : 'hover:text-red-500'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>{selectedDoubt.likes?.length || 0}</span>
                </button>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{selectedDoubt.views || 0}</span>
                </div>
                <button
                  onClick={() => handleBookmarkDoubt(selectedDoubt._id)}
                  className={`transition-colors ${
                    bookmarkedDoubts.some((bd) => bd._id === selectedDoubt._id)
                      ? 'text-blue-500'
                      : 'hover:text-blue-500'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePinDoubt(selectedDoubt._id)}
                  className={`p-1.5 rounded-md ${
                    selectedDoubt.isPinned
                      ? 'bg-blue-50 text-blue-500'
                      : 'bg-gray-50 text-gray-500'
                  } hover:bg-blue-100 transition-colors`}
                  title={selectedDoubt.isPinned ? 'Unpin Doubt' : 'Pin Doubt'}
                >
                  <Pin className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleResolveDoubt(selectedDoubt._id)}
                  className={`p-1.5 rounded-md ${
                    selectedDoubt.isResolved
                      ? 'bg-green-50 text-green-500'
                      : 'bg-gray-50 text-gray-500'
                  } hover:bg-green-100 transition-colors`}
                  title={selectedDoubt.isResolved ? 'Mark Unresolved' : 'Mark Resolved'}
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteDoubt(selectedDoubt._id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Comments ({comments.length})
            </h3>
            {/* Comment Form */}
            <div className="mb-6">
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) =>
                      e.key === 'Enter' && handleCreateComment(selectedDoubt._id)
                    }
                  />
                  <button
                    onClick={() => handleCreateComment(selectedDoubt._id)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="cursor-pointer">
                    <span className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-xs flex items-center space-x-1.5">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Attach Files</span>
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleCommentFileChange}
                      className="hidden"
                    />
                  </label>
                  {commentAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {commentAttachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-gray-100 px-2 py-1 rounded-md text-xs"
                        >
                          <span className="truncate max-w-[120px]">{file.name}</span>
                          <button
                            onClick={() => removeCommentAttachment(index)}
                            className="ml-2 text-gray-500 hover:text-red-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Comments List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-3 text-sm">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-700 mb-2 whitespace-pre-line text-sm">
                      {comment.content}
                    </p>
                    {comment.attachments?.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-medium text-gray-600 mb-1.5">Attachments:</h4>
                        <div className="flex flex-wrap gap-2">
                          {comment.attachments.map((file, index) => (
                            <button
                              key={index}
                              onClick={() => handleAttachmentClick(file)}
                              className="inline-flex items-center px-2.5 py-1 border border-gray-200 rounded-md hover:bg-gray-50 text-xs text-gray-700"
                            >
                              <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                              <span>
                                {file.url.split('/').pop().length > 15
                                  ? `${file.url
                                      .split('/')
                                      .pop()
                                      .substring(0, 15)}...${file.url.split('.').pop()}`
                                  : file.url.split('/').pop()}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        By{' '}
                        <span className="font-medium text-blue-600">
                          {renderAuthor(comment.author)}
                        </span>{' '}
                        • {new Date(comment.createdAt).toLocaleString()}
                      </span>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleLikeComment(comment._id, selectedDoubt._id)}
                          className={`flex items-center space-x-1 transition-colors ${
                            comment.likes?.includes(comment._id)
                              ? 'text-red-500'
                              : 'hover:text-red-500'
                          }`}
                        >
                          <Heart className="w-3.5 h-3.5" />
                          <span>{comment.likes?.length || 0}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment._id, selectedDoubt._id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoubtModal;