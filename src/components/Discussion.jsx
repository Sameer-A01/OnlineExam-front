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
import toast, { Toaster } from 'react-hot-toast';

// Utility to convert VAPID key
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

// Attachment Popup Component
const AttachmentPopup = ({ file, onClose }) => {
  const filename = file.url.split('/').pop();
  const correctUrl = `${import.meta.env.VITE_API_URL}/uploads/${filename}`;
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

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL, {
      auth: { token: localStorage.getItem('ims_token') },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    setSocket(newSocket);
    newSocket.on('connect', () => {
      console.log('Socket.IO connected:', newSocket.id);
      if (user?.userId) {
        newSocket.emit('joinDiscussion', user.userId); // Join user-specific room
        toast.success('Connected to discussion portal!', {
          duration: 3000,
          position: 'top-right',
        });
      }
    });
    newSocket.on('reconnect', () => {
      console.log('Socket.IO reconnected:', newSocket.id);
      if (user?.userId) {
        newSocket.emit('joinDiscussion', user.userId); // Rejoin room on reconnect
        toast.success('Reconnected to discussion portal!', {
          duration: 3000,
          position: 'top-right',
        });
      }
    });
    newSocket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err.message);
      toast.error('Failed to connect to discussion portal.', {
        duration: 4000,
        position: 'top-right',
      });
    });
    newSocket.on('reconnect_error', (err) => {
      console.error('Socket.IO reconnection error:', err.message);
      toast.error('Failed to reconnect to discussion portal.', {
        duration: 4000,
        position: 'top-right',
      });
    });
    return () => newSocket.disconnect();
  }, [user?.userId]);

  // Join doubt-specific room when selecting a doubt
  useEffect(() => {
    if (socket && selectedDoubt?._id) {
      socket.emit('joinDoubt', selectedDoubt._id);
    }
  }, [socket, selectedDoubt]);

  // Socket.IO event listeners
  useEffect(() => {
    if (!socket || !user?.userId) return;
    socket.on('new_doubt', (doubt) => {
      setDoubts((prev) => [doubt, ...prev]);
      toast.success('New doubt posted!', {
        duration: 3000,
        position: 'top-right',
        icon: '📝',
      });
      fetchDoubts(); // Refresh to ensure consistency
    });
    socket.on('new_comment', (comment) => {
      if (comment.doubtId === selectedDoubt?._id) {
        setComments((prev) => [...prev, comment]);
        toast.success('New comment received!', {
          duration: 3000,
          position: 'top-right',
          icon: '💬',
        });
      }
    });
    socket.on('like_doubt', (data) => {
      setDoubts((prev) =>
        prev.map((d) =>
          d._id === data.doubtId ? { ...d, likes: data.likes } : d
        )
      );
      if (data.doubtId === selectedDoubt?._id) {
        fetchDoubts(); // Refresh to ensure consistency
      }
      toast.success('Doubt liked!', {
        duration: 3000,
        position: 'top-right',
        icon: '❤️',
      });
    });
    socket.on('like_comment', (data) => {
      if (data.doubtId === selectedDoubt?._id) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === data.commentId ? { ...c, likes: data.likes } : c
          )
        );
        toast.success('Comment liked!', {
          duration: 3000,
          position: 'top-right',
          icon: '❤️',
        });
      }
    });
    socket.on('tagged', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      if (document.visibilityState !== 'visible' && notificationPermission === 'granted') {
        new Notification('Tagged in Discussion', {
          body: generateNotificationMessage(notification),
          icon: '/Logo.jpg',
          tag: notification._id || Date.now().toString(),
        });
      }
    });
    return () => {
      socket.off('new_doubt');
      socket.off('new_comment');
      socket.off('like_doubt');
      socket.off('like_comment');
      socket.off('tagged');
    };
  }, [socket, user?.userId, selectedDoubt, notificationPermission]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && notificationPermission !== 'granted' && notificationPermission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission);
        if (permission === 'granted') {
          toast.success('Notifications enabled!', {
            duration: 3000,
            position: 'top-right',
          });
        } else if (permission === 'denied') {
          toast.error('Notifications blocked. Enable them in browser settings.', {
            duration: 4000,
            position: 'top-right',
          });
        }
      }).catch((error) => {
        console.error('Error requesting notification permission:', error);
        toast.error('Failed to request notification permission.', {
          duration: 4000,
          position: 'top-right',
        });
      });
    }
  }, [notificationPermission]);

  // Register service worker and subscribe to push notifications
  const registerServiceWorkerAndSubscribe = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window && user?.userId) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
        });
        await axiosInstance.post('/push/subscribe', {
          userId: user.userId,
          subscription,
        });
        console.log('Push subscription successful');
        toast.success('Subscribed to notifications!', {
          duration: 3000,
          position: 'top-right',
        });
      } catch (err) {
        console.error('Push subscription failed:', err);
        toast.error('Failed to subscribe to notifications. Check if the app is added to the home screen on iOS.', {
          duration: 4000,
          position: 'top-right',
        });
      }
    } else {
      console.error('Service worker or PushManager not available');
      toast.error('Notifications not supported or user not logged in.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  useEffect(() => {
    if (user?.userId) {
      registerServiceWorkerAndSubscribe();
    }
  }, [user?.userId]);

  // Fetch initial data
  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const [doubtsRes, myDoubtsRes, hashtagsRes, likedRes, bookmarksRes, notificationsRes] = await Promise.all([
        axiosInstance.get(`/discussions/doubts?${params}`),
        axiosInstance.get('/discussions/doubts/commented'),
        axiosInstance.get('/discussions/hashtags/popular'),
        axiosInstance.get('/discussions/doubts/most-liked'),
        axiosInstance.get('/discussions/bookmarks'),
        axiosInstance.get('/discussions/notifications'),
      ]);
      setDoubts(doubtsRes.data);
      setMyDoubts(myDoubtsRes.data);
      setPopularHashtags(hashtagsRes.data);
      setMostLikedQuestions(likedRes.data);
      setBookmarkedDoubts(bookmarksRes.data);
      setNotifications(notificationsRes.data);
      setUnreadCount(notificationsRes.data.filter((n) => !n.read).length);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load discussion data.', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, [filters]);

  const handleCreateDoubt = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newDoubt.title);
      formData.append('content', newDoubt.content);
      currentHashtags.forEach((tag) => formData.append('hashtags', tag));
      newDoubt.attachments.forEach((file) => formData.append('attachments', file));
      const response = await axiosInstance.post('/discussions/doubts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      socket.emit('new_doubt', response.data);
      setNewDoubt({ title: '', content: '', attachments: [] });
      setCurrentHashtags([]);
      setShowCreateForm(false);
      fetchDoubts();
      toast.success('Doubt posted successfully!', {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      console.error('Error creating doubt:', error);
      toast.error('Failed to post doubt.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() && commentAttachments.length === 0) return;
    try {
      const formData = new FormData();
      formData.append('content', newComment);
      commentAttachments.forEach((file) => formData.append('attachments', file));
      const response = await axiosInstance.post(`/discussions/doubts/${selectedDoubt._id}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      socket.emit('new_comment', response.data);
      setNewComment('');
      setCommentAttachments([]);
      fetchComments(selectedDoubt._id);
      toast.success('Comment posted successfully!', {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const fetchComments = async (doubtId) => {
    try {
      const response = await axiosInstance.get(`/discussions/doubts/${doubtId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const handleLikeDoubt = async (doubtId) => {
    try {
      const response = await axiosInstance.put(`/discussions/doubts/${doubtId}/like`);
      socket.emit('like_doubt', { doubtId, likes: response.data.likes });
    } catch (error) {
      console.error('Error liking doubt:', error);
      toast.error('Failed to like doubt.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await axiosInstance.put(`/discussions/comments/${commentId}/like`);
      socket.emit('like_comment', { commentId, doubtId: selectedDoubt._id, likes: response.data.likes });
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const handlePinDoubt = async (doubtId) => {
    try {
      await axiosInstance.put(`/discussions/doubts/${doubtId}/pin`);
      fetchDoubts();
      toast.success('Doubt pinned successfully!', {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      console.error('Error pinning doubt:', error);
      toast.error('Failed to pin doubt.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const handleResolveDoubt = async (doubtId) => {
    try {
      await axiosInstance.put(`/discussions/doubts/${doubtId}/resolve`);
      fetchDoubts();
      toast.success('Doubt marked as resolved!', {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      console.error('Error resolving doubt:', error);
      toast.error('Failed to resolve doubt.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const handleDeleteDoubt = async (doubtId) => {
    if (window.confirm('Are you sure you want to delete this doubt?')) {
      try {
        await axiosInstance.delete(`/discussions/doubts/${doubtId}`);
        fetchDoubts();
        if (selectedDoubt?._id === doubtId) setSelectedDoubt(null);
        toast.success('Doubt deleted successfully!', {
          duration: 3000,
          position: 'top-right',
        });
      } catch (error) {
        console.error('Error deleting doubt:', error);
        toast.error('Failed to delete doubt.', {
          duration: 4000,
          position: 'top-right',
        });
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await axiosInstance.delete(`/discussions/comments/${commentId}`);
        fetchComments(selectedDoubt._id);
        toast.success('Comment deleted successfully!', {
          duration: 3000,
          position: 'top-right',
        });
      } catch (error) {
        console.error('Error deleting comment:', error);
        toast.error('Failed to delete comment.', {
          duration: 4000,
          position: 'top-right',
        });
      }
    }
  };

  const handleBookmarkDoubt = async (doubtId) => {
    try {
      await axiosInstance.post(`/discussions/doubts/${doubtId}/bookmark`);
      fetchDoubts();
      toast.success('Doubt bookmarked!', {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      console.error('Error bookmarking doubt:', error);
      toast.error('Failed to bookmark doubt.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await axiosInstance.put(`/discussions/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => prev - 1);
    } catch (error) {
      console.error('Error marking notification read:', error);
      toast.error('Failed to mark notification as read.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await axiosInstance.put('/discussions/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read!', {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      console.error('Error marking all notifications read:', error);
      toast.error('Failed to mark all notifications as read.', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  const handleHashtagClick = (hashtag) => {
    setFilters({ ...filters, hashtag });
    setShowPopularHashtags(false);
  };

  const handleFilterChange = debounce((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, 300);

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === 'doubt') {
      setNewDoubt({ ...newDoubt, attachments: files });
    } else {
      setCommentAttachments(files);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <Toaster />
      <EpicAdminHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <Sidebar
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            showMyDoubts={showMyDoubts}
            setShowMyDoubts={setShowMyDoubts}
            showPopularHashtags={showPopularHashtags}
            setShowPopularHashtags={setShowPopularHashtags}
            showMostLiked={showMostLiked}
            setShowMostLiked={setShowMostLiked}
            showBookmarks={showBookmarks}
            setShowBookmarks={setShowBookmarks}
            popularHashtags={popularHashtags}
            handleHashtagClick={handleHashtagClick}
            mostLikedQuestions={mostLikedQuestions}
            bookmarkedDoubts={bookmarkedDoubts}
            setSelectedDoubt={setSelectedDoubt}
            fetchComments={fetchComments}
          />
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                  <MessageCircle className="text-blue-600 w-8 h-8 sm:w-10 sm:h-10" />
                  Discussion Portal
                </h1>
                <p className="text-gray-600 mt-2 text-sm sm:text-base">Engage with doubts, comments, and hashtags</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Plus size={20} />
                  Post Doubt
                </button>
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Bell size={20} />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter size={20} className="text-gray-500" />
                <span className="font-medium text-gray-700">Filters</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search doubts..."
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Filter by hashtag..."
                      onChange={(e) => handleFilterChange('hashtag', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>
            {loading ? (
              <LakshyaLoader />
            ) : selectedDoubt ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6">
                <button
                  onClick={() => {
                    setSelectedDoubt(null);
                    setComments([]);
                  }}
                  className="flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
                >
                  <ChevronLeft size={20} />
                  Back to Doubts
                </button>
                <DoubtModal
                  doubt={selectedDoubt}
                  comments={comments}
                  renderAuthor={renderAuthor}
                  handleLikeDoubt={handleLikeDoubt}
                  handlePinDoubt={handlePinDoubt}
                  handleResolveDoubt={handleResolveDoubt}
                  handleDeleteDoubt={handleDeleteDoubt}
                  handleBookmarkDoubt={handleBookmarkDoubt}
                  handleLikeComment={handleLikeComment}
                  handleDeleteComment={handleDeleteComment}
                  setSelectedAttachment={setSelectedAttachment}
                />
                <form onSubmit={handleCommentSubmit} className="mt-6">
                  <div className="flex flex-col gap-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                      rows={4}
                    />
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileChange(e, 'comment')}
                      className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-200"
                      accept=".jpg,.jpeg,.png,.gif,.pdf"
                    />
                    {commentAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {commentAttachments.map((file, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-600 flex items-center gap-2"
                          >
                            <Paperclip size={14} />
                            <span>{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="submit"
                      className="self-end bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Send size={16} />
                      Post Comment
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                {(showMyDoubts ? myDoubts : showMostLiked ? mostLikedQuestions : showBookmarks ? bookmarkedDoubts : doubts).map((doubt) => (
                  <div
                    key={doubt._id}
                    className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-l-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/20 ${
                      doubt.isPinned
                        ? 'border-l-yellow-500 bg-gradient-to-r from-yellow-50/50 to-transparent'
                        : doubt.isResolved
                        ? 'border-l-green-500 bg-gradient-to-r from-green-50/50 to-transparent'
                        : 'border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent'
                    }`}
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex-shrink-0">{doubt.title}</h3>
                            {doubt.isPinned && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                                <Pin size={12} className="mr-1" />
                                Pinned
                              </span>
                            )}
                            {doubt.isResolved && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                <CheckCircle size={12} className="mr-1" />
                                Resolved
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-4 leading-relaxed">{doubt.content}</p>
                          {doubt.hashtags?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {doubt.hashtags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 cursor-pointer hover:bg-blue-100 transition-all duration-200"
                                  onClick={() => handleHashtagClick(tag)}
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {doubt.attachments?.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-semibold text-gray-600 mb-2">Attachments ({doubt.attachments.length}):</p>
                              <div className="flex flex-wrap gap-2">
                                {doubt.attachments.map((file, index) => (
                                  <div
                                    key={index}
                                    className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-200 cursor-pointer hover:bg-gray-100 transition-all duration-200"
                                    onClick={() => setSelectedAttachment(file)}
                                  >
                                    <Paperclip size={14} className="inline mr-2" />
                                    {file.url.split('/').pop()}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 space-y-2 sm:space-y-0 sm:space-x-4">
                            <span className="flex items-center">
                              <Calendar size={14} className="mr-1" />
                              {formatDate(doubt.createdAt)}
                            </span>
                            <span>By: {renderAuthor(doubt.author)}</span>
                            <span className="flex items-center">
                              <MessageCircle size={14} className="mr-1" />
                              {doubt.commentCount || 0} Comments
                            </span>
                            <span className="flex items-center">
                              <Heart size={14} className="mr-1" />
                              {doubt.likes?.length || 0} Likes
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              setSelectedDoubt(doubt);
                              fetchComments(doubt._id);
                            }}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105"
                            title="View Doubt"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleLikeDoubt(doubt._id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105"
                            title="Like Doubt"
                          >
                            <Heart size={18} />
                          </button>
                          <button
                            onClick={() => handleBookmarkDoubt(doubt._id)}
                            className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all duration-200 hover:scale-105"
                            title="Bookmark Doubt"
                          >
                            <Bookmark size={18} />
                          </button>
                          {user?.role === 'admin' && (
                            <>
                              <button
                                onClick={() => handlePinDoubt(doubt._id)}
                                className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all duration-200 hover:scale-105"
                                title={doubt.isPinned ? 'Unpin Doubt' : 'Pin Doubt'}
                              >
                                <Pin size={18} />
                              </button>
                              <button
                                onClick={() => handleResolveDoubt(doubt._id)}
                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 hover:scale-105"
                                title="Resolve Doubt"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteDoubt(doubt._id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105"
                                title="Delete Doubt"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {showNotifications && (
            <NotificationsSidebar
              notifications={notifications}
              onClose={() => setShowNotifications(false)}
              markNotificationRead={handleMarkNotificationRead}
              markAllNotificationsRead={handleMarkAllNotificationsRead}
              setSelectedDoubt={setSelectedDoubt}
              fetchComments={fetchComments}
            />
          )}
        </div>
      </div>
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Post a Doubt
                </h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewDoubt({ title: '', content: '', attachments: [] });
                    setCurrentHashtags([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
              <form onSubmit={handleCreateDoubt} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={newDoubt.title}
                    onChange={(e) => setNewDoubt({ ...newDoubt, title: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter doubt title..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Content *</label>
                  <textarea
                    value={newDoubt.content}
                    onChange={(e) => setNewDoubt({ ...newDoubt, content: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                    placeholder="Describe your doubt..."
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hashtags</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && hashtagInput.trim()) {
                          e.preventDefault();
                          setCurrentHashtags((prev) => [...new Set([...prev, hashtagInput.trim().replace('#', '')])]);
                          setHashtagInput('');
                        }
                      }}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Add hashtags (press Enter)..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (hashtagInput.trim()) {
                          setCurrentHashtags((prev) => [...new Set([...prev, hashtagInput.trim().replace('#', '')])]);
                          setHashtagInput('');
                        }
                      }}
                      className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200"
                    >
                      Add
                    </button>
                  </div>
                  {currentHashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {currentHashtags.map((tag, index) => (
                        <div
                          key={index}
                          className="flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => setCurrentHashtags((prev) => prev.filter((_, i) => i !== index))}
                            className="ml-2 text-blue-700 hover:text-blue-900"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Attachments (Max 5 files, 5MB each)</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleFileChange(e, 'doubt')}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-200"
                    accept=".jpg,.jpeg,.png,.gif,.pdf"
                  />
                  {newDoubt.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newDoubt.attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-200"
                        >
                          <Paperclip size={14} className="mr-2" />
                          <span>{file.name}</span>
                          <span className="ml-2 text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewDoubt({ title: '', content: '', attachments: [] });
                      setCurrentHashtags([]);
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
                  >
                    <Send size={16} />
                    Post Doubt
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
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