import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/api';
import { io } from 'socket.io-client';
import LakshyaLoader from '../components/LakshyaLoader';
import NotificationsSidebar from '../components/NotificationsSidebar';
import EpicAdminHeader from '../components/EpicAdminHeader';
import Sidebar from './AllSidebar';
import DoubtModal from './DoubtModal';
import {
  MessageCircle,
  Heart,
  Eye,
  Pin,
  CheckCircle,
  Plus,
  Send,
  Bell,
  Hash,
  Paperclip,
  X,
  Search,
  User,
  ChevronLeft,
  Check,
  Trash2,
  Filter,
  Sparkles,
  Shield,
  Clock,
  ChevronRight,
  Calendar,
  Bookmark,
  Download,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast'; // Import react-hot-toast

// Attachment Popup Component
const AttachmentPopup = ({ file, onClose }) => {
  const filename = file.url.split('/').pop();
  const correctUrl = `${import.meta.env.VITE_API_URL}/${filename}`;
  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(filename);
  const isPDF = /\.pdf$/i.test(filename);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{filename}</h3>
            <div className="flex items-center space-x-2">
              <a
                href={correctUrl}
                download
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
          <div className="flex justify-center items-center">
            {isImage && (
              <img
                src={correctUrl}
                alt={filename}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
            {isPDF && (
              <iframe
                src={`${correctUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                title={filename}
                className="w-full h-[60vh] sm:h-[70vh] border-none rounded-lg"
              />
            )}
            {!isImage && !isPDF && (
              <div className="text-center text-gray-500 py-6 sm:py-8">
                <p className="text-sm sm:text-base">Preview not available for this file type.</p>
                <a
                  href={correctUrl}
                  download
                  className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 mt-3 sm:mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDiscussion = () => {
  const [doubts, setDoubts] = useState([]);
  const [myDoubts, setMyDoubts] = useState([]);
  const [popularHashtags, setPopularHashtags] = useState([]);
  const [mostLikedQuestions, setMostLikedQuestions] = useState([]);
  const [bookmarkedDoubts, setBookmarkedDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [comments, setComments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMyDoubts, setShowMyDoubts] = useState(false);
  const [showPopularHashtags, setShowPopularHashtags] = useState(false);
  const [showMostLiked, setShowMostLiked] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [socket, setSocket] = useState(null);
  const [hashtagInput, setHashtagInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentHashtags, setCurrentHashtags] = useState([]);
  const [newDoubt, setNewDoubt] = useState({
    title: '',
    content: '',
    attachments: [],
  });
  const [newComment, setNewComment] = useState('');
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    hashtag: '',
  });
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(Notification?.permission || 'default');
  const { user } = useAuth();

  // Debounce function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // AdminBadge Component
  const AdminBadge = () => (
    <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ml-1 sm:ml-2">
      <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
      Admin
    </span>
  );

  // Helper to render author with admin badge
  const renderAuthor = (author) => (
    <div className="flex items-center text-xs sm:text-sm">
      <span>{author?.name || 'Anonymous'}</span>
      {author?.role === 'admin' && <AdminBadge />}
    </div>
  );

  // Generate notification message
  const generateNotificationMessage = (notification) => {
    switch (notification.type) {
      case 'new_doubt':
        return `${notification.sender?.name || 'Someone'} posted a new doubt: "${notification.doubt?.title || 'Untitled'}"`;
      case 'new_comment':
        return `${notification.sender?.name || 'Someone'} commented on your doubt: "${notification.doubt?.title || 'a doubt'}"`;
      case 'like_doubt':
        return `${notification.sender?.name || 'Someone'} liked your doubt: "${notification.doubt?.title || 'Untitled'}"`;
      case 'like_comment':
        return `${notification.sender?.name || 'Someone'} liked your comment`;
      case 'tagged':
        return `${notification.sender?.name || 'Someone'} tagged you in a comment`;
      case 'like_hashtag':
        return `${notification.sender?.name || 'Someone'} liked a hashtag (#${notification.hashtag}) you follow`;
      default:
        return 'You have a new notification';
    }
  };

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL, {
      auth: { token: localStorage.getItem('ims_token') },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    setSocket(newSocket);
    newSocket.on('connect', () => console.log('Socket.IO connected:', newSocket.id));
    newSocket.on('connect_error', (err) => console.error('Socket.IO connection error:', err.message));
    return () => newSocket.disconnect();
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && notificationPermission !== 'granted' && notificationPermission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission);
      }).catch((error) => {
        console.error('Error requesting notification permission:', error);
      });
    }
  }, [notificationPermission]);

  // Register service worker and subscribe to push notifications
  const registerServiceWorkerAndSubscribe = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window && user?.userId) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
        });

        await axiosInstance.post('/push/subscribe', {
          userId: user.userId,
          subscription,
        });
        console.log('Push subscription successful');
      } catch (err) {
        console.error('Push subscription failed:', err);
      }
    } else {
      console.error('Service worker or userId not available for push subscription');
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  };

  // Set up socket listeners and push notifications
  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      if (document.visibilityState !== 'visible' && notificationPermission === 'granted') {
        new Notification('New Notification', {
          body: generateNotificationMessage(notification),
          icon: '/notification-icon.png',
          tag: notification._id || Date.now().toString(),
        });
      }
      fetchDoubts(); // Refresh doubts to include new activity
    });

    // Register service worker and subscribe if user is authenticated
    if (user?.userId) {
      registerServiceWorkerAndSubscribe();
    }

    return () => socket.off('notification');
  }, [socket, user, notificationPermission]);

  // Fetch doubts
  const fetchDoubts = useCallback(async (search = filters.search, hashtag = filters.hashtag) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('doubt', search);
      if (hashtag) params.append('hashtag', hashtag);
      const { data } = await axiosInstance.get(`/discussions/doubts?${params}`);
      setDoubts(data.doubts || []);
    } catch (error) {
      console.error('Failed to fetch doubts:', error);
      toast.error('Failed to fetch doubts. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Debounced fetchDoubts
  const debouncedFetchDoubts = useCallback(debounce(fetchDoubts, 300), [fetchDoubts]);

  // Fetch my doubts
  const fetchMyDoubts = async () => {
    try {
      const { data: { doubts = [] } } = await axiosInstance.get('/discussions/doubts', {
        params: { authorOnly: true },
      });
      setMyDoubts(doubts);
    } catch (error) {
      console.error('Failed to fetch my doubts:', error);
      toast.error('Failed to fetch your doubts.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const { data } = await axiosInstance.get('/discussions/notifications');
      setNotifications(data || []);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to fetch notifications.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Fetch popular hashtags
  const fetchPopularHashtags = async () => {
    try {
      const { data } = await axiosInstance.get('/discussions/hashtags/popular');
      setPopularHashtags(data);
    } catch (error) {
      console.error('Failed to fetch popular hashtags:', error);
      toast.error('Failed to fetch popular hashtags.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Fetch most liked questions
  const fetchMostLikedQuestions = async () => {
    try {
      const { data } = await axiosInstance.get('/discussions/doubts/most-liked');
      setMostLikedQuestions(data);
    } catch (error) {
      console.error('Failed to fetch most liked questions:', error);
      toast.error('Failed to fetch most liked questions.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Fetch bookmarked doubts
  const fetchBookmarkedDoubts = async () => {
    try {
      const { data } = await axiosInstance.get('/discussions/bookmarks');
      setBookmarkedDoubts(data);
    } catch (error) {
      console.error('Failed to fetch bookmarked doubts:', error);
      toast.error('Failed to fetch bookmarked doubts.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Fetch comments for a doubt
  const fetchComments = async (doubtId) => {
    try {
      const { data: comments = [] } = await axiosInstance.get(`/discussions/doubts/${doubtId}/comments`);
      setComments(comments);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      toast.error('Failed to fetch comments.', {
        duration: 4000,
        position: 'top-right',
      });
      setComments([]);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDoubts();
    fetchMyDoubts();
    fetchNotifications();
    fetchPopularHashtags();
    fetchMostLikedQuestions();
    fetchBookmarkedDoubts();
  }, []);

  // Handle filter changes
  useEffect(() => {
    debouncedFetchDoubts(filters.search, filters.hashtag);
  }, [filters, debouncedFetchDoubts]);

  // View doubt
  const handleViewDoubt = async (doubt) => {
    try {
      const { data } = await axiosInstance.get(`/discussions/doubts/${doubt._id}`);
      setDoubts((prev) =>
        prev.map((d) => (d._id === doubt._id ? { ...d, views: data.views } : d))
      );
      setSelectedDoubt(data);
      fetchComments(doubt._id);
    } catch (error) {
      console.error('Failed to view doubt:', error);
      toast.error('Failed to view doubt.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Create doubt
  const handleCreateDoubt = async () => {
    if (!newDoubt.title.trim() || !newDoubt.content.trim()) {
      toast.error('Please fill in all required fields.', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', newDoubt.title);
      formData.append('content', newDoubt.content);
      formData.append('hashtags', currentHashtags.join(','));
      newDoubt.attachments.forEach((file) => formData.append('attachments', file));
      await axiosInstance.post('/discussions/doubts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNewDoubt({ title: '', content: '', attachments: [] });
      setCurrentHashtags([]);
      setShowCreateForm(false);
      fetchDoubts();
      fetchMyDoubts();
      toast.success('Doubt posted successfully!', {
        duration: 4000,
        position: 'top-right',
        icon: '🎉',
      });
    } catch (error) {
      console.error('Failed to create doubt:', error);
      toast.error(error.response?.data?.message || 'Error creating doubt. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Delete doubt
  const handleDeleteDoubt = async (doubtId) => {
    if (!window.confirm('Are you sure you want to delete this doubt?')) return;
    try {
      const response = await axiosInstance.delete(`/discussions/doubts/${doubtId}`);
      setDoubts(doubts.filter((d) => d._id !== doubtId));
      setMyDoubts(myDoubts.filter((d) => d._id !== doubtId));
      if (selectedDoubt?._id === doubtId) {
        setSelectedDoubt(null);
      }
      toast.success(response.data.message || 'Doubt deleted successfully!', {
        duration: 4000,
        position: 'top-right',
        icon: '🗑️',
      });
    } catch (error) {
      console.error('Failed to delete doubt:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Failed to delete doubt. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId, doubtId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await axiosInstance.delete(`/discussions/comments/${commentId}`);
      fetchComments(doubtId);
      toast.success('Comment deleted successfully!', {
        duration: 4000,
        position: 'top-right',
        icon: '🗑️',
      });
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error(error.response?.data?.message || 'Failed to delete comment. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Handle hashtag input
  const handleHashtagKeyDown = (e) => {
    if (e.key === 'Enter' && hashtagInput.trim()) {
      const tag = hashtagInput.trim().toLowerCase();
      if (!currentHashtags.includes(tag)) {
        setCurrentHashtags([...currentHashtags, tag]);
        toast.success(`Added hashtag: #${tag}`, {
          duration: 3000,
          position: 'top-right',
          icon: '🏷️',
        });
      } else {
        toast.error(`Hashtag #${tag} is already added.`, {
          duration: 3000,
          position: 'top-right',
        });
      }
      setHashtagInput('');
    }
  };

  // Remove hashtag
  const removeHashtag = (index) => {
    const tag = currentHashtags[index];
    setCurrentHashtags(currentHashtags.filter((_, i) => i !== index));
    toast.success(`Removed hashtag: #${tag}`, {
      duration: 3000,
      position: 'top-right',
      icon: '🗑️',
    });
  };

  // Like doubt
  const handleLikeDoubt = async (doubtId) => {
    try {
      setDoubts((prev) =>
        prev.map((d) =>
          d._id === doubtId
            ? {
                ...d,
                likes: d.likes?.includes(doubtId)
                  ? d.likes.filter((id) => id !== doubtId)
                  : [...(d.likes || []), doubtId],
              }
            : d
        )
      );
      setMyDoubts((prev) =>
        prev.map((d) =>
          d._id === doubtId
            ? {
                ...d,
                likes: d.likes?.includes(doubtId)
                  ? d.likes.filter((id) => id !== doubtId)
                  : [...(d.likes || []), doubtId],
              }
            : d
        )
      );
      if (selectedDoubt?._id === doubtId) {
        setSelectedDoubt((prev) => ({
          ...prev,
          likes: prev.likes?.includes(doubtId)
            ? prev.likes.filter((id) => id !== doubtId)
            : [...(prev.likes || []), doubtId],
        }));
      }
      await axiosInstance.put(`/discussions/doubts/${doubtId}/like`);
      const { data } = await axiosInstance.get(`/discussions/doubts/${doubtId}`);
      setDoubts((prev) =>
        prev.map((d) => (d._id === doubtId ? { ...d, likes: data.likes } : d))
      );
      setMyDoubts((prev) =>
        prev.map((d) => (d._id === doubtId ? { ...d, likes: data.likes } : d))
      );
      if (selectedDoubt?._id === doubtId) {
        setSelectedDoubt((prev) => ({ ...prev, likes: data.likes }));
      }
      toast.success(
        data.likes.includes(user?.userId) ? 'Doubt liked!' : 'Doubt unliked!',
        {
          duration: 3000,
          position: 'top-right',
          icon: data.likes.includes(user?.userId) ? '❤️' : '↩️',
        }
      );
    } catch (error) {
      console.error('Failed to like doubt:', error);
      toast.error('Failed to update like status.', {
        duration: 4000,
        position: 'top-right',
      });
      setDoubts((prev) =>
        prev.map((d) =>
          d._id === doubtId
            ? {
                ...d,
                likes: d.likes?.includes(doubtId)
                  ? d.likes.filter((id) => id !== doubtId)
                  : [...(d.likes || []), doubtId],
              }
            : d
        )
      );
      setMyDoubts((prev) =>
        prev.map((d) =>
          d._id === doubtId
            ? {
                ...d,
                likes: d.likes?.includes(doubtId)
                  ? d.likes.filter((id) => id !== doubtId)
                  : [...(d.likes || []), doubtId],
              }
            : d
        )
      );
      if (selectedDoubt?._id === doubtId) {
        setSelectedDoubt((prev) => ({
          ...prev,
          likes: prev.likes?.includes(doubtId)
            ? prev.likes.filter((id) => id !== doubtId)
            : [...(prev.likes || []), doubtId],
        }));
      }
    }
  };

  // Bookmark doubt
  const handleBookmarkDoubt = async (doubtId) => {
    try {
      const { data } = await axiosInstance.post(`/discussions/doubts/${doubtId}/bookmark`);
      fetchBookmarkedDoubts();
      if (selectedDoubt?._id === doubtId) {
        setSelectedDoubt((prev) => ({
          ...prev,
          isBookmarked: data.bookmarked,
        }));
      }
      setDoubts((prev) =>
        prev.map((d) =>
          d._id === doubtId ? { ...d, isBookmarked: data.bookmarked } : d
        )
      );
      setMyDoubts((prev) =>
        prev.map((d) =>
          d._id === doubtId ? { ...d, isBookmarked: data.bookmarked } : d
        )
      );
      toast.success(
        data.bookmarked ? 'Doubt bookmarked!' : 'Doubt removed from bookmarks!',
        {
          duration: 3000,
          position: 'top-right',
          icon: data.bookmarked ? '🔖' : '↩️',
        }
      );
    } catch (error) {
      console.error('Failed to bookmark doubt:', error);
      toast.error('Failed to bookmark. Please try again later.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Like hashtag
  const handleLikeHashtag = async (hashtagName) => {
    try {
      await axiosInstance.put(`/discussions/hashtags/${hashtagName}/like`);
      fetchPopularHashtags();
      toast.success(`Hashtag #${hashtagName} liked!`, {
        duration: 3000,
        position: 'top-right',
        icon: '❤️',
      });
    } catch (error) {
      console.error('Failed to like hashtag:', error);
      toast.error('Failed to like hashtag.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Create comment with attachments
  const handleCreateComment = async (doubtId) => {
    if (!newComment.trim() && commentAttachments.length === 0) {
      toast.error('Please provide a comment or attach a file.', {
        duration: 4000,
        position: 'top-right',
      });
      return;
    }
    try {
      const formData = new FormData();
      formData.append('content', newComment);
      commentAttachments.forEach((file) => {
        formData.append('attachments', file);
      });
      await axiosInstance.post(`/discussions/doubts/${doubtId}/comments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setNewComment('');
      setCommentAttachments([]);
      fetchComments(doubtId);
      fetchDoubts();
      toast.success('Comment posted successfully!', {
        duration: 4000,
        position: 'top-right',
        icon: '💬',
      });
    } catch (error) {
      console.error('Failed to create comment:', error);
      toast.error(error.response?.data?.message || 'Error posting comment. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Like comment
  const handleLikeComment = async (commentId, doubtId) => {
    try {
      await axiosInstance.put(`/discussions/comments/${commentId}/like`);
      fetchComments(doubtId);
      toast.success('Comment liked!', {
        duration: 3000,
        position: 'top-right',
        icon: '❤️',
      });
    } catch (error) {
      console.error('Failed to like comment:', error);
      toast.error('Failed to like comment.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Pin/Unpin doubt
  const handlePinDoubt = async (doubtId) => {
    try {
      const response = await axiosInstance.put(`/discussions/doubts/${doubtId}/pin`);
      fetchDoubts();
      if (selectedDoubt?._id === doubtId) {
        setSelectedDoubt((prev) => ({ ...prev, isPinned: !prev.isPinned }));
      }
      toast.success(response.data.message, {
        duration: 4000,
        position: 'top-right',
        icon: '📌',
      });
    } catch (error) {
      console.error('Error pinning/unpinning doubt:', error);
      toast.error('Error updating pin status. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Resolve/Unresolve doubt
  const handleResolveDoubt = async (doubtId) => {
    try {
      const response = await axiosInstance.put(`/discussions/doubts/${doubtId}/resolve`);
      fetchDoubts();
      if (selectedDoubt?._id === doubtId) {
        setSelectedDoubt((prev) => ({ ...prev, isResolved: !prev.isResolved }));
      }
      toast.success(response.data.message, {
        duration: 4000,
        position: 'top-right',
        icon: '✅',
      });
    } catch (error) {
      console.error('Error resolving/unresolving doubt:', error);
      toast.error('Error updating resolve status. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Mark notification as read
  const markNotificationRead = async (notificationId) => {
    try {
      await axiosInstance.put(`/discussions/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => prev - 1);
      toast.success('Notification marked as read.', {
        duration: 3000,
        position: 'top-right',
        icon: '✅',
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await axiosInstance.put('/discussions/notifications/mark-all-read');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read!', {
        duration: 4000,
        position: 'top-right',
        icon: '✅',
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark all notifications as read.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Handle hashtag click
  const handleHashtagClick = (tag) => {
    setFilters({ ...filters, search: '', hashtag: tag });
    setShowMyDoubts(false);
    setShowPopularHashtags(false);
    setShowMostLiked(false);
    setShowBookmarks(false);
    toast.success(`Filtering by hashtag: #${tag}`, {
      duration: 3000,
      position: 'top-right',
      icon: '🏷️',
    });
  };

  // Handle file upload for doubts
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewDoubt({ ...newDoubt, attachments: files });
    if (files.length > 0) {
      toast.success(`${files.length} file(s) selected for upload.`, {
        duration: 3000,
        position: 'top-right',
        icon: '📎',
      });
    }
  };

  // Handle file upload for comments
  const handleCommentFileChange = (e) => {
    const files = Array.from(e.target.files);
    setCommentAttachments(files);
    if (files.length > 0) {
      toast.success(`${files.length} file(s) selected for comment.`, {
        duration: 3000,
        position: 'top-right',
        icon: '📎',
      });
    }
  };

  // Remove comment attachment
  const removeCommentAttachment = (index) => {
    const fileName = commentAttachments[index].name;
    setCommentAttachments(commentAttachments.filter((_, i) => i !== index));
    toast.success(`Removed attachment: ${fileName}`, {
      duration: 3000,
      position: 'top-right',
      icon: '🗑️',
    });
  };

  // Handle attachment click
  const handleAttachmentClick = (file) => {
    setSelectedAttachment(file);
    toast.success(`Viewing attachment: ${file.url.split('/').pop()}`, {
      duration: 3000,
      position: 'top-right',
      icon: '📂',
    });
  };

  if (loading) {
    return <LakshyaLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Toaster Component for Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: '#ffffff',
            color: '#333',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            maxWidth: '400px',
          },
          success: {
            style: {
              background: 'linear-gradient(135deg, #e6fffa 0%, #ccfbf1 100%)',
              border: '1px solid #5eead4',
              color: '#115e59',
            },
            iconTheme: {
              primary: '#115e59',
              secondary: '#e6fffa',
            },
          },
          error: {
            style: {
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              border: '1px solid #f87171',
              color: '#991b1b',
            },
            iconTheme: {
              primary: '#991b1b',
              secondary: '#fee2e2',
            },
          },
        }}
      />

      {/* Header */}
      <EpicAdminHeader
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        unreadCount={unreadCount}
      />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 flex-1">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar */}
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            showMyDoubts={showMyDoubts}
            setShowMyDoubts={setShowMyDoubts}
            showPopularHashtags={showPopularHashtags}
            setShowPopularHashtags={setShowPopularHashtags}
            showMostLiked={showMostLiked}
            setShowMostLiked={setShowMostLiked}
            showBookmarks={showBookmarks}
            setShowBookmarks={setShowBookmarks}
            myDoubts={myDoubts}
            popularHashtags={popularHashtags}
            mostLikedQuestions={mostLikedQuestions}
            bookmarkedDoubts={bookmarkedDoubts}
            handleViewDoubt={handleViewDoubt}
            handleHashtagClick={handleHashtagClick}
            handleLikeHashtag={handleLikeHashtag}
            className={`fixed inset-y-0 left-0 z-40 w-64 sm:w-80 bg-white shadow-2xl transform ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out overflow-y-auto`}
          />

          {/* Main Content */}
          <div className="flex-1 space-y-4 sm:space-y-6 mt-0 sm:mt-2 lg:mt-0">
            {/* Filters Section */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 transition-all duration-300 hover:shadow-2xl">
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 group min-w-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200" />
                    <input
                      type="text"
                      placeholder="Search doubts..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/80 placeholder-gray-500 text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Hashtag Filter */}
                <div className="relative group w-full sm:w-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <Hash className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-purple-500 w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200" />
                    <input
                      type="text"
                      placeholder="Filter by hashtag..."
                      value={filters.hashtag}
                      onChange={(e) => setFilters({ ...filters, hashtag: e.target.value })}
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white/80 placeholder-gray-500 text-sm sm:text-base min-w-[120px] sm:min-w-[140px]"
                    />
                  </div>
                </div>

                {/* Clear Filters Button */}
                <button
                  onClick={() => {
                    setFilters({ search: '', hashtag: '' });
                    setShowMyDoubts(false);
                    setShowPopularHashtags(false);
                    setShowMostLiked(false);
                    setShowBookmarks(false);
                    toast.success('Filters cleared!', {
                      duration: 3000,
                      position: 'top-right',
                      icon: '🧹',
                    });
                  }}
                  className="group relative px-4 sm:px-6 py-2 sm:py-3 text-gray-600 hover:text-white transition-all duration-300 rounded-xl overflow-hidden text-sm sm:text-base"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-600 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                  <span className="relative flex items-center gap-1 sm:gap-2">
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    Clear Filters
                  </span>
                </button>

                {/* Mobile Sidebar Toggle */}
                <button
                  onClick={() => {
                    setIsSidebarOpen(!isSidebarOpen);
                    if (!isSidebarOpen) {
                      setShowMyDoubts(false);
                      setShowPopularHashtags(false);
                      setShowMostLiked(false);
                      setShowBookmarks(false);
                    }
                    // toast.success(isSidebarOpen ? 'Sidebar hidden!' : 'Sidebar opened!', {
                    //   duration: 3000,
                    //   position: 'top-right',
                    //   icon: isSidebarOpen ? '🔙' : '📜',
                    // });
                  }}
                  className="lg:hidden group relative px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-105 overflow-hidden text-sm sm:text-base"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative flex items-center gap-1 sm:gap-2">
                    <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                    {isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
                  </span>
                </button>
              </div>
            </div>

            {/* Doubts List */}
            <div className="space-y-4 sm:space-y-6">
              {doubts.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8 text-center transform transition-all duration-500 hover:scale-105">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-sm sm:text-lg mb-3 sm:mb-4">
                    {filters.search || filters.hashtag
                      ? `No doubts found matching "${filters.search || filters.hashtag}"`
                      : 'No doubts found. Be the first to post one!'}
                  </p>
                  {(filters.search || filters.hashtag) && (
                    <button
                      onClick={() => {
                        setFilters({ search: '', hashtag: '' });
                        toast.success('Showing all doubts!', {
                          duration: 3000,
                          position: 'top-right',
                          icon: '📚',
                        });
                      }}
                      className="group relative px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-105 overflow-hidden text-sm sm:text-base"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                      <span className="relative">Show All Doubts</span>
                    </button>
                  )}
                </div>
              ) : (
                doubts.map((doubt, index) => (
                  <div
                    key={doubt._id}
                    className="group bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] sm:hover:scale-[1.02] hover:border-blue-300/50 overflow-hidden"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'slideInUp 0.6s ease-out forwards',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative p-4 sm:p-6 lg:p-8">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                            {doubt.isPinned && (
                              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-700 rounded-full text-xs font-medium animate-pulse">
                                <Pin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                Pinned
                              </div>
                            )}
                            {doubt.isResolved && (
                              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-700 rounded-full text-xs font-medium">
                                <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                Resolved
                              </div>
                            )}
                          </div>
                          <h3
                            className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 cursor-pointer hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all duration-300 mb-2 sm:mb-3 line-clamp-2"
                            onClick={() => handleViewDoubt(doubt)}
                          >
                            {doubt.title}
                          </h3>
                          <p className="text-gray-600 mb-3 sm:mb-4 line-clamp-3 text-sm sm:text-base leading-relaxed">
                            {doubt.content}
                          </p>
                          {doubt.hashtags && doubt.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                              {doubt.hashtags.map((tag, tagIndex) => (
                                <button
                                  key={tagIndex}
                                  onClick={() => handleHashtagClick(tag)}
                                  className="group/tag relative inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-blue-500 hover:to-purple-600 hover:text-white transition-all duration-300 hover:shadow-lg hover:scale-105 overflow-hidden"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 translate-x-full group-hover/tag:translate-x-0 transition-transform duration-300"></div>
                                  <Hash className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 relative" />
                                  <span className="relative">{tag}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {doubt.attachments?.length > 0 && (
                            <div className="mb-4 sm:mb-6">
                              <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                                <Paperclip className="w-3 h-3 sm:w-4 sm:h-4" />
                                Attachments ({doubt.attachments.length})
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                {doubt.attachments.map((file, fileIndex) => (
                                  <button
                                    key={fileIndex}
                                    onClick={() => handleAttachmentClick(file)}
                                    className="group/file flex items-center p-2 sm:p-3 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 hover:shadow-md hover:scale-105"
                                  >
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center mr-2 sm:mr-3 group-hover/file:from-blue-500/30 group-hover/file:to-purple-500/30 transition-all duration-300">
                                      <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover/file:text-blue-700 transition-colors duration-300 truncate">
                                      {file.url.split('/').pop().length > 20
                                        ? `${file.url
                                            .split('/')
                                            .pop()
                                            .substring(0, 20)}...${file.url.split('.').pop()}`
                                        : file.url.split('/').pop()}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm gap-3 sm:gap-0">
                            <div className="flex flex-wrap items-center space-x-2 sm:space-x-4 text-gray-500">
                              <div className="flex items-center gap-1.5 sm:gap-2 ">
                                {renderAuthor(doubt.author)}
                              </div>
                              {doubt.batch && (
                                <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-blue-100 hover:to-purple-100 transition-all duration-300">
                                  {doubt.batch.name}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                {new Date(doubt.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center space-x-2 sm:space-x-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLikeDoubt(doubt._id);
                                }}
                                className={`group/like flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                                  doubt.likes?.includes(doubt._id)
                                    ? 'text-red-600 bg-red-50'
                                    : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                }`}
                              >
                                <Heart
                                  className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 group-hover/like:scale-125 ${
                                    doubt.likes?.includes(doubt._id) ? 'fill-current' : ''
                                  }`}
                                />
                                <span className="font-medium">{doubt.likes?.length || 0}</span>
                              </button>
                              <div className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 text-gray-500 bg-gray-50 rounded-lg">
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="font-medium">{doubt.views || 0}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDoubt(doubt);
                                }}
                                className="group/comment flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 hover:scale-110"
                              >
                                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 group-hover/comment:scale-125" />
                                <span className="font-medium">{doubt.commentCount || 0}</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBookmarkDoubt(doubt._id);
                                }}
                                className={`group/bookmark p-1.5 sm:p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                                  bookmarkedDoubts.some((bd) => bd._id === doubt._id)
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                              >
                                <Bookmark
                                  className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 group-hover/bookmark:scale-125 ${
                                    bookmarkedDoubts.some((bd) => bd._id === doubt._id)
                                      ? 'fill-current'
                                      : ''
                                  }`}
                                />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDoubt(doubt._id);
                                }}
                                className="group/delete p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-300 hover:scale-110"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 group-hover/delete:scale-125" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col space-x-3 sm:space-x-0 sm:space-y-3 ml-0 sm:ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePinDoubt(doubt._id);
                            }}
                            className={`group/pin p-2 sm:p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
                              doubt.isPinned
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 hover:text-white hover:shadow-lg'
                            }`}
                            title={doubt.isPinned ? 'Unpin Doubt' : 'Pin Doubt'}
                          >
                            <Pin className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover/pin:rotate-12" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolveDoubt(doubt._id);
                            }}
                            className={`group/resolve p-2 sm:p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
                              doubt.isResolved
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white hover:shadow-lg'
                            }`}
                            title={doubt.isResolved ? 'Mark Unresolved' : 'Mark Resolved'}
                          >
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover/resolve:scale-110" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notifications Sidebar */}
          {showNotifications && (
            <NotificationsSidebar
              showNotifications={showNotifications}
              setShowNotifications={setShowNotifications}
              notifications={notifications}
              setSelectedDoubt={setSelectedDoubt}
              generateNotificationMessage={generateNotificationMessage}
              markNotificationRead={markNotificationRead}
              markAllNotificationsRead={markAllNotificationsRead}
              handleViewDoubt={handleViewDoubt}
            />
          )}
        </div>
      </div>

      {/* Create Doubt Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">Ask a Doubt</h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    toast.success('Create doubt form closed.', {
                      duration: 3000,
                      position: 'top-right',
                      icon: '🔙',
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newDoubt.title}
                    onChange={(e) => setNewDoubt({ ...newDoubt, title: e.target.value })}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter your doubt title..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newDoubt.content}
                    onChange={(e) => setNewDoubt({ ...newDoubt, content: e.target.value })}
                    rows={4}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Describe your doubt in detail..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Hashtags
                  </label>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    {currentHashtags.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 rounded-full text-xs"
                      >
                        #{tag}
                        <button
                          onClick={() => removeHashtag(index)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={handleHashtagKeyDown}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Type a hashtag and press Enter"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Attachments
                  </label>
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <label className="cursor-pointer">
                      <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-1.5 sm:space-x-2 text-sm sm:text-base">
                        <Paperclip className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Choose Files</span>
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    {newDoubt.attachments.length > 0 && (
                      <span className="text-xs sm:text-sm text-gray-500">
                        {newDoubt.attachments.length} file(s) selected
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-2 sm:space-x-3 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      toast.success('Create doubt form closed.', {
                        duration: 3000,
                        position: 'top-right',
                        icon: '🔙',
                      });
                    }}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateDoubt}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    Post Doubt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doubt Detail Modal */}
      <DoubtModal
        selectedDoubt={selectedDoubt}
        setSelectedDoubt={setSelectedDoubt}
        comments={comments}
        newComment={newComment}
        setNewComment={setNewComment}
        commentAttachments={commentAttachments}
        handleAttachmentClick={handleAttachmentClick}
        handleHashtagClick={handleHashtagClick}
        handleLikeDoubt={handleLikeDoubt}
        handleBookmarkDoubt={handleBookmarkDoubt}
        handlePinDoubt={handlePinDoubt}
        handleResolveDoubt={handleResolveDoubt}
        handleDeleteDoubt={handleDeleteDoubt}
        handleCreateComment={handleCreateComment}
        handleCommentFileChange={handleCommentFileChange}
        removeCommentAttachment={removeCommentAttachment}
        handleLikeComment={handleLikeComment}
        handleDeleteComment={handleDeleteComment}
        bookmarkedDoubts={bookmarkedDoubts}
        renderAuthor={renderAuthor}
      />

      {/* Attachment Popup */}
      {selectedAttachment && (
        <AttachmentPopup
          file={selectedAttachment}
          onClose={() => setSelectedAttachment(null)}
        />
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default AdminDiscussion;