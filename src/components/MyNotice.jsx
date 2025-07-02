import React, { useState, useEffect } from 'react';
import { Bell, Users, Calendar, Paperclip, X, Eye, Download, FileText, Image, File, ChevronDown, ChevronUp, Filter, AlertCircle } from 'lucide-react';
import axiosInstance from '../utils/api';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_API_URL;

const MyNotice = () => {
  const [notices, setNotices] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [expandedNotices, setExpandedNotices] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    audience: '',
    isImportant: '',
    batchId: '',
  });
  const [notificationPermission, setNotificationPermission] = useState(Notification?.permission || 'default');
  const { user } = useAuth();

  // Initialize Socket.IO client
  const socket = io(SOCKET_URL, {
    auth: {
      token: localStorage.getItem('ims_token'),
    },
    transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
  });

  useEffect(() => {
    // Debug Socket.IO connection
    console.log('Socket URL:', SOCKET_URL);
    console.log('Token:', localStorage.getItem('ims_token'));
    console.log('User:', user);
    socket.on('connect', () => console.log('Socket.IO connected:', socket.id));
    socket.on('connect_error', (err) => console.error('Socket.IO connection error:', err.message));

    // Request notification permission
    requestNotificationPermission();

    // Register service worker and subscribe if user is authenticated
    if (user?.userId) {
      registerServiceWorkerAndSubscribe();
    } else {
      console.error('No userId available, skipping push subscription');
    }

    // Fetch user batches and join Socket.IO rooms
    fetchBatches();

    // Fetch initial notices
    fetchNotices();

    // Listen for new notice events
    socket.on('new-notice', (notice) => {
      if (isNoticeRelevant(notice)) {
        showBrowserNotification(notice);
        fetchNotices();
      }
    });

    // Cleanup Socket.IO connection
    return () => {
      socket.disconnect();
    };
  }, [filters, user]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && notificationPermission !== 'granted' && notificationPermission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  const registerServiceWorkerAndSubscribe = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
        });

        // Use user.userId from AuthContext
        const userId = user.userId;
        console.log('User ID for subscription:', userId);

        if (!userId) {
          console.error('User ID not found for push subscription');
          return;
        }

        const response = await axiosInstance.post('/push/subscribe', {
          userId,
          subscription,
        });
        console.log('Push subscription response:', response.data);
      } catch (err) {
        console.error('Push subscription failed:', err);
      }
    }
  };

  Ascending
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  };

  const isNoticeRelevant = (notice) => {
    if (notice.audience === 'all') return true;
    if (notice.audience === 'batch' && notice.batchIds) {
      const userBatchIds = batches.map((batch) => batch._id);
      return notice.batchIds.some((batchId) => userBatchIds.includes(batchId));
    }
    return false;
  };

  const showBrowserNotification = (notice) => {
    console.log('Attempting to show notification:', notice);
    if (notificationPermission === 'granted' && 'Notification' in window) {
      const notification = new Notification(notice.title, {
        body: notice.message,
        icon: '/path/to/notification-icon.png',
        tag: notice._id || Date.now().toString(),
      });
      console.log('Notification created:', notification);
      notification.onclick = () => {
        console.log('Notification clicked:', notice.title);
        window.focus();
      };
    } else {
      console.log('Notifications not shown. Permission:', notificationPermission);
    }
  };

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });
      params.append('status', 'active');

      const response = await axiosInstance.get(`/notices?${params}`);
      setNotices(response.data);
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await axiosInstance.get('/batches');
      const userBatches = response.data.data || [];
      setBatches(userBatches);

      // Join Socket.IO rooms for each batch
      userBatches.forEach((batch) => {
        socket.emit('joinBatch', batch._id);
      });
    } catch (error) {
      console.error('Error fetching batches:', error);
      setBatches([]);
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

  const openAttachmentModal = (attachments) => {
    setSelectedAttachments(attachments.map((att) => `${BASE_URL}/${att}`));
    setShowAttachmentModal(true);
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return <Image className="w-5 h-5" />;
    } else if (['pdf'].includes(extension)) {
      return <FileText className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  const toggleNoticeExpansion = (noticeId) => {
    const newExpanded = new Set(expandedNotices);
    if (newExpanded.has(noticeId)) {
      newExpanded.delete(noticeId);
    } else {
      newExpanded.add(noticeId);
    }
    setExpandedNotices(newExpanded);
  };

  const truncateMessage = (message, limit = 150) => {
    if (message.length <= limit) return message;
    return message.substring(0, limit) + '...';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                <Bell className="text-blue-600 w-8 h-8 sm:w-10 sm:h-10" />
                My Notices
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">View notices sent to you</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4 sm:mb-0">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-500" />
              <span className="font-medium text-gray-700">Filters</span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center gap-2 text-blue-600 font-medium"
            >
              {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>

          <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <select
                value={filters.batchId}
                onChange={(e) => setFilters({ ...filters, batchId: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
              >
                <option value="">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.audience}
                onChange={(e) => setFilters({ ...filters, audience: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
              >
                <option value="">All Audiences</option>
                <option value="all">General</option>
                <option value="batch">Batch Specific</option>
              </select>

              <select
                value={filters.isImportant}
                onChange={(e) => setFilters({ ...filters, isImportant: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
              >
                <option value="">All Priority</option>
                <option value="true">Important Only</option>
                <option value="false">Normal Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Attachment Modal */}
        {showAttachmentModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Paperclip className="text-blue-600" />
                  Attachments ({selectedAttachments.length})
                </h3>
                <button
                  onClick={() => setShowAttachmentModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedAttachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 border border-gray-200"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-white rounded-lg shadow-sm">{getFileIcon(attachment)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{attachment.split('/').pop()}</p>
                          <p className="text-sm text-gray-500">Click to download</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 text-sm font-medium"
                        >
                          <Eye size={14} />
                          View
                        </a>
                        <a
                          href={attachment}
                          download
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 text-sm font-medium"
                        >
                          <Download size={14} />
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notices List */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <div
                  className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-indigo-400 mx-auto animate-spin"
                  style={{ animationDelay: '0.1s', animationDuration: '1.2s' }}
                ></div>
              </div>
              <p className="text-gray-600 mt-6 font-medium">Loading notices...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No notices found</h3>
              <p className="text-gray-600">There are no notices available at this time</p>
            </div>
          ) : (
            notices.map((notice) => (
              <div
                key={notice._id}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-l-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/20 ${
                  notice.isImportant
                    ? 'border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent'
                    : 'border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent'
                }`}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex-shrink-0">{notice.title}</h3>
                        {notice.isImportant && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                            <AlertCircle size={12} className="mr-1" />
                            Important
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                            notice.audience === 'all'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}
                        >
                          <Users size={12} className="mr-1" />
                          {notice.audience === 'all' ? 'All Students' : 'Specific Batches'}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-gray-700 leading-relaxed">
                          {expandedNotices.has(notice._id) ? notice.message : truncateMessage(notice.message)}
                        </p>
                        {notice.message.length > 150 && (
                          <button
                            onClick={() => toggleNoticeExpansion(notice._id)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 flex items-center gap-1 transition-colors"
                          >
                            {expandedNotices.has(notice._id) ? (
                              <>
                                Show less <ChevronUp size={14} />
                              </>
                            ) : (
                              <>
                                Show more <ChevronDown size={14} />
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {notice.batchIds && notice.batchIds.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-600 mb-2">Target Batches:</p>
                          <div className="flex flex-wrap gap-2">
                            {notice.batchIds.map((batch) => (
                              <span
                                key={batch._id}
                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                              >
                                {batch.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {notice.attachments && notice.attachments.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-gray-600">
                              Attachments ({notice.attachments.length}):
                            </p>
                            <button
                              onClick={() => openAttachmentModal(notice.attachments)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors ml-2"
                            >
                              <Eye size={14} />
                              View All
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {notice.attachments.slice(0, 3).map((attachment, index) => (
                              <div
                                key={index}
                                className="inline-flex items-center px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-100 transition-all duration-200"
                              >
                                <div className="mr-2">{getFileIcon(attachment)}</div>
                                <span className="truncate max-w-[150px]">{attachment.split('/').pop()}</span>
                              </div>
                            ))}
                            {notice.attachments.length > 3 && (
                              <span className="inline-flex items-center px-3 py-2 text-gray-500 text-sm font-medium">
                                +{notice.attachments.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 space-y-2 sm:space-y-0 sm:space-x-4">
                        <span className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {formatDate(notice.sentAt)}
                        </span>
                        <span>By: {notice.sentBy?.name || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyNotice;