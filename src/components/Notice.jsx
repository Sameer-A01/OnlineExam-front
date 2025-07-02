import React, { useState, useEffect } from 'react';
import { Bell, Plus, Archive, Trash2, Edit, AlertCircle, Users, Calendar, Paperclip, X, Send, Filter, ArchiveRestore, Eye, Download, FileText, Image, File, ChevronDown, ChevronUp } from 'lucide-react';
import axiosInstance from '../utils/api';
import io from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_URL; // Backend base URL for file serving
const SOCKET_URL = import.meta.env.VITE_API_URL; // Socket.IO server URL

const Notice = () => {
  const [notices, setNotices] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [expandedNotices, setExpandedNotices] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    audience: '',
    isImportant: '',
    status: 'active',
    batchId: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    audience: 'all',
    batchIds: [],
    isImportant: false,
    attachments: []
  });

  // Initialize Socket.IO client
  const socket = io(SOCKET_URL, {
    auth: {
      token: localStorage.getItem('ims_token') // Assumes JWT token is stored in localStorage
    }
  });

  useEffect(() => {
    // Fetch initial notices and batches
    fetchNotices();
    fetchBatches();

    // Join general room for all notices
    socket.emit('joinGeneral');

    // Listen for new notice events
    socket.on('new-notice', (notice) => {
      fetchNotices(); // Refresh notices list
    });

    // Listen for updated notice events
    socket.on('update-notice', (updatedNotice) => {
      fetchNotices(); // Refresh notices list
    });

    // Cleanup Socket.IO connection
    return () => {
      socket.disconnect();
    };
  }, [filters]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
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
      const batchData = response.data.data || [];
      setBatches(batchData);

      // Join batch rooms for admin (optional, if admin needs to monitor specific batches)
      batchData.forEach(batch => {
        socket.emit('joinBatch', batch._id);
      });
    } catch (error) {
      console.error('Error fetching batches:', error);
      setBatches([]);
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (formData.audience === 'batch' && formData.batchIds.length === 0) {
      alert('Please select at least one batch.');
      return;
    }
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('message', formData.message);
      formDataToSend.append('audience', formData.audience);
      formDataToSend.append('isImportant', formData.isImportant);

      if (formData.audience === 'batch') {
        formData.batchIds.forEach(id => formDataToSend.append('batchIds', id));
      }

      formData.attachments.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      const response = await axiosInstance.post('/notices', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Emit new notice event to Socket.IO
      socket.emit('new-notice', {
        ...response.data,
        audience: formData.audience,
        batchIds: formData.audience === 'batch' ? formData.batchIds : []
      });

      setShowCreateForm(false);
      resetForm();
      fetchNotices();
    } catch (error) {
      console.error('Error creating notice:', error);
      alert('Failed to create notice. Please try again.');
    }
  };

  const handleUpdateNotice = async (e) => {
    e.preventDefault();
    if (formData.audience === 'batch' && formData.batchIds.length === 0) {
      alert('Please select at least one batch.');
      return;
    }
    try {
      const response = await axiosInstance.put(`/notices/${editingNotice._id}`, {
        title: formData.title,
        message: formData.message,
        audience: formData.audience,
        batchIds: formData.audience === 'batch' ? formData.batchIds : [],
        isImportant: formData.isImportant
      });

      // Emit update notice event to Socket.IO
      socket.emit('update-notice', {
        ...response.data,
        audience: formData.audience,
        batchIds: formData.audience === 'batch' ? formData.batchIds : []
      });

      setEditingNotice(null);
      resetForm();
      fetchNotices();
    } catch (error) {
      console.error('Error updating notice:', error);
      alert('Failed to update notice. Please try again.');
    }
  };

  const handleArchiveNotice = async (id) => {
    try {
      await axiosInstance.patch(`/notices/${id}/archive`);
      fetchNotices();
    } catch (error) {
      console.error('Error archiving notice:', error);
    }
  };

  const handleUnarchiveNotice = async (id) => {
    try {
      await axiosInstance.put(`/notices/${id}`, { status: 'active' });
      fetchNotices();
    } catch (error) {
      console.error('Error unarchiving notice:', error);
    }
  };

  const handleDeleteNotice = async (id) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        await axiosInstance.delete(`/notices/${id}`);
        fetchNotices();
      } catch (error) {
        console.error('Error deleting notice:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      audience: 'all',
      batchIds: [],
      isImportant: false,
      attachments: []
    });
    setShowCreateForm(false);
  };

  const startEdit = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      message: notice.message,
      audience: notice.audience,
      batchIds: notice.batchIds?.map(batch => batch._id) || [],
      isImportant: notice.isImportant,
      attachments: []
    });
    setShowCreateForm(true);
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, attachments: Array.from(e.target.files) });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openAttachmentModal = (attachments) => {
    setSelectedAttachments(attachments.map(att => `${BASE_URL}/${att}`));
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
                Notice Management
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">Create and manage notices for students and batches</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus size={20} />
              Create Notice
            </button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                value={filters.batchId}
                onChange={(e) => setFilters({ ...filters, batchId: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
              >
                <option value="">All Batches</option>
                {batches.map(batch => (
                  <option key={batch._id} value={batch._id}>{batch.name}</option>
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

              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Create/Edit Notice Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden">
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6 z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {editingNotice ? 'Edit Notice' : 'Create New Notice'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingNotice(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
                <form onSubmit={editingNotice ? handleUpdateNotice : handleCreateNotice} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter notice title..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                      placeholder="Enter notice message..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Audience *
                    </label>
                    <select
                      value={formData.audience}
                      onChange={(e) => setFormData({ ...formData, audience: e.target.value, batchIds: [] })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      <option value="all">All Students</option>
                      <option value="batch">Specific Batches</option>
                    </select>
                  </div>

                  {formData.audience === 'batch' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Select Batches * {formData.batchIds.length > 0 ? `(${formData.batchIds.length} selected)` : ''}
                      </label>
                      {batches.length === 0 ? (
                        <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-xl">No batches available</p>
                      ) : (
                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gray-50">
                          {batches.map(batch => (
                            <label key={batch._id} className="flex items-center space-x-3 mb-3 cursor-pointer hover:bg-white p-2 rounded-lg transition-all duration-200">
                              <input
                                type="checkbox"
                                checked={formData.batchIds.includes(batch._id)}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    batchIds: e.target.checked
                                      ? [...formData.batchIds, batch._id]
                                      : formData.batchIds.filter(id => id !== batch._id)
                                  });
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 font-medium">{batch.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="important"
                      checked={formData.isImportant}
                      onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor="important" className="text-sm font-semibold text-red-700 flex items-center gap-2">
                      <AlertCircle size={16} />
                      Mark as Important
                    </label>
                  </div>

                  {!editingNotice && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Attachments (Max 5 files, 5MB each)
                      </label>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-200"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      {formData.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {Array.from(formData.attachments).map((file, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                              {getFileIcon(file.name)}
                              <span>{file.name}</span>
                              <span className="text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingNotice(null);
                        resetForm();
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
                      {editingNotice ? 'Update Notice' : 'Send Notice'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

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
                  onClick={() => setShowAttackModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedAttachments.map((attachment, index) => (
                    <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 hover:from-gray-100 hover:to-gray-200 transition-all duration-200 border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          {getFileIcon(attachment)}
                        </div>
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
                <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-indigo-400 mx-auto animate-spin" style={{ animationDelay: '0.1s', animationDuration: '1.2s' }}></div>
              </div>
              <p className="text-gray-600 mt-6 font-medium">Loading notices...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No notices found</h3>
              <p className="text-gray-600">Create your first notice to get started</p>
            </div>
          ) : (
            notices.map(notice => (
              <div key={notice._id} className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-l-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/20 ${
                notice.status === 'archived' 
                  ? 'border-l-gray-400 opacity-75' 
                  : notice.isImportant 
                    ? 'border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent' 
                    : 'border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent'
              }`}>
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex-shrink-0">{notice.title}</h3>
                        {notice.status === 'archived' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            <Archive size={12} className="mr-1" />
                            Archived
                          </span>
                        )}
                        {notice.isImportant && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                            <AlertCircle size={12} className="mr-1" />
                            Important
                          </span>
                        )}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                          notice.audience === 'all' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }`}>
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
                              <>Show less <ChevronUp size={14} /></>
                            ) : (
                              <>Show more <ChevronDown size={14} /></>
                            )}
                          </button>
                        )}
                      </div>

                      {notice.batchIds && notice.batchIds.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-600 mb-2">Target Batches:</p>
                          <div className="flex flex-wrap gap-2">
                            {notice.batchIds.map(batch => (
                              <span key={batch._id} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                                {batch.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {notice.attachments && notice.attachments.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-gray-600">Attachments ({notice.attachments.length}):</p>
                            <button
                              onClick={() => openAttachmentModal(notice.attachments)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors"
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
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => startEdit(notice)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105"
                        title="Edit Notice"
                      >
                        <Edit size={18} />
                      </button>
                      {notice.status === 'active' ? (
                        <button
                          onClick={() => handleArchiveNotice(notice._id)}
                          className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all duration-200 hover:scale-105"
                          title="Archive Notice"
                        >
                          <Archive size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnarchiveNotice(notice._id)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 hover:scale-105"
                          title="Unarchive Notice"
                        >
                          <ArchiveRestore size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotice(notice._id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105"
                        title="Delete Notice"
                      >
                        <Trash2 size={18} />
                      </button>
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

export default Notice;