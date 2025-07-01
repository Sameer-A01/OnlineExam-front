import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth from your AuthContext
import { useNavigate } from 'react-router-dom'; // For redirecting to login
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  BookOpen, Calendar, MessageCircle, Bell, Clock, CheckCircle,
  AlertCircle, Star, BookmarkIcon, HelpCircle, TrendingUp,
  Award, Target, Activity, FileText, Users, Brain,
  PlayCircle, Zap, GraduationCap
} from 'lucide-react';
import axiosInstance from '../utils/api';

const UserDashboard = () => {
  const { user } = useAuth(); // Get user from AuthContext
  const navigate = useNavigate(); // For redirecting to login
  const [dashboardData, setDashboardData] = useState({
    userCount: 0,
    batchCount: 0,
    examCount: 0,
    doubtCount: 0
  });
  const [notices, setNotices] = useState([]);
  const [exams, setExams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({
    name: 'Student',
    batch: null,
    email: '',
    role: 'user'
  });

  useEffect(() => {
    if (!user?.userId) {
      setError('Please log in to access your dashboard');
      setLoading(false);
      navigate('/login'); // Redirect to login if user is not authenticated
      return;
    }
    fetchUserDashboardData();
  }, [user, navigate]);

  const fetchUserDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ims_token');

      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Fetch user info from the backend
      const userResponse = await axiosInstance.get(`/users/${user.userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (userResponse.data.success) {
        setUserData({
          name: userResponse.data.user.name,
          email: userResponse.data.user.email,
          role: userResponse.data.user.role,
          batch: userResponse.data.user.batch
        });
      } else {
        throw new Error('Failed to fetch user data');
      }

      // Fetch all user-specific data
      const [overviewRes, noticesRes, examsRes, notificationsRes] = await Promise.all([
        axiosInstance.get('/dashboard/overview', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axiosInstance.get('/dashboard/notices', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axiosInstance.get('/dashboard/exams', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axiosInstance.get('/dashboard/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setDashboardData(overviewRes.data.data);
      setNotices(noticesRes.data.data || []);
      setExams(examsRes.data.data || []);
      setNotifications(notificationsRes.data.data || []);

    } catch (err) {
      console.error('User dashboard fetch error:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('ims_token');
      await axiosInstance.put(`/dashboard/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const bookmarkDoubt = async (doubtId) => {
    try {
      const token = localStorage.getItem('ims_token');
      const response = await axiosInstance.put(`/dashboard/doubts/${doubtId}/bookmark`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Bookmark toggled:', response.data);
    } catch (err) {
      console.error('Error bookmarking doubt:', err);
    }
  };

  // Process real data for charts
  const getChartData = () => {
    const currentDate = new Date();

    // Real exam status data
    const completedExams = exams.filter(exam => new Date(exam.examDate) < currentDate);
    const upcomingExams = exams.filter(exam => new Date(exam.examDate) >= currentDate);

    const examStatusData = [
      { name: 'Completed', value: completedExams.length, color: '#10B981' },
      { name: 'Upcoming', value: upcomingExams.length, color: '#3B82F6' }
    ];

    // Real notification types
    const notificationTypes = notifications.reduce((acc, notif) => {
      const type = notif.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const notificationChartData = Object.entries(notificationTypes).map(([type, count], index) => ({
      name: type,
      value: count,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]
    }));

    // Real notices by importance
    const importantNotices = notices.filter(notice => notice.isImportant).length;
    const regularNotices = notices.length - importantNotices;

    const noticeTypeData = [
      { name: 'Important', value: importantNotices, color: '#EF4444' },
      { name: 'Regular', value: regularNotices, color: '#6B7280' }
    ];

    return { examStatusData, notificationChartData, noticeTypeData };
  };

  const { examStatusData, notificationChartData, noticeTypeData } = getChartData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 border border-red-100">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-center mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  const recentNotices = notices.slice(0, 3);
  const upcomingExams = exams.filter(exam => new Date(exam.examDate) > new Date()).slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {userData.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Welcome back, {userData.name}!
                  </h1>
                  <p className="text-gray-600 mt-1">Ready to continue your learning journey?</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Bell className="w-6 h-6 text-gray-600" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Today</p>
                  <p className="font-semibold text-gray-900">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">My Exams</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.examCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Calendar className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-sm text-blue-600">Available assessments</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Doubts</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.doubtCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <MessageCircle className="w-4 h-4 text-orange-500 mr-1" />
              <span className="text-sm text-orange-600">Need resolution</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Batch Members</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.userCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <GraduationCap className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">Fellow students</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Zap className="w-4 h-4 text-purple-500 mr-1" />
              <span className="text-sm text-purple-600">{unreadNotifications} unread</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Exam Status Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-blue-600" />
              Exam Status
            </h3>
            {examStatusData.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={examStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  >
                    {examStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No exams assigned yet</p>
                </div>
              </div>
            )}
          </div>

          {/* Notification Types */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-purple-600" />
              Notification Activity
            </h3>
            {notificationChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={notificationChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
2
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="value" fill="#8B5CF6" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No notifications yet</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Notices */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-green-600" />
                Recent Notices
              </h3>
              <span className="text-sm text-gray-500">{notices.length} total</span>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentNotices.map((notice) => (
                <div key={notice._id} className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        {notice.title}
                        {notice.isImportant && (
                          <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            Important
                          </span>
                        )}
                      </h4>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {notice.message}
                      </p>
                      <p className="text-gray-400 text-xs mt-2">
                        {new Date(notice.sentAt).toLocaleDateString()} • By {notice.sentBy?.name || 'Admin'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {notices.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No notices available</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-purple-600" />
                Recent Notifications
              </h3>
              <span className="text-sm text-gray-500">{unreadNotifications} unread</span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {notifications.slice(0, 6).map((notification) => (
                <div
                  key={notification._id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm ${
                    !notification.isRead
                      ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => !notification.isRead && markNotificationAsRead(notification._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {notification.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-gray-600 text-xs mt-1">
                        From: {notification.sender?.name || 'System'}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    )}
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Exams */}
        {upcomingExams.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Upcoming Exams
              </h3>
              <span className="text-sm text-gray-500">{upcomingExams.length} scheduled</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {upcomingExams.map((exam) => {
                const examDate = new Date(exam.examDate);
                const isNear = (examDate - new Date()) / (1000 * 60 * 60 * 24) <= 7; // Within 7 days

                return (
                  <div
                    key={exam._id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
                      isNear ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900 text-sm">{exam.title}</h4>
                      {isNear && (
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{exam.subject || 'General'}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {examDate.toLocaleDateString()}
                       

                        </span>
                        <span className="text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {exam.duration || 'N/A'} min
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          exam.visibility === 'public'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {exam.visibility || 'assigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => navigate('/employee-dashboard/Discussions')} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-left transition-all duration-200 hover:scale-105">
              <HelpCircle className="w-6 h-6 mb-2" />
              <p className="font-medium">Ask a Doubt</p>
              <p className="text-sm opacity-90">Get help from peers</p>
            </button>
            <button onClick={() => navigate('/employee-dashboard/MyExams')}className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-left transition-all duration-200 hover:scale-105">
              <BookOpen className="w-6 h-6 mb-2" />
              <p className="font-medium">Take Test</p>
              <p className="text-sm opacity-90">Prepare for exams</p>
            </button>
            <button onClick={() => navigate('/employee-dashboard/Discussions')} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-4 text-left transition-all duration-200 hover:scale-105">
              <Star className="w-6 h-6 mb-2" />
              <p className="font-medium">View Bookmarks</p>
              <p className="text-sm opacity-90">Saved doubts & notes</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;