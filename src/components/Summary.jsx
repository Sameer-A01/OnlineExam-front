
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth for consistent user data
import { useNavigate } from 'react-router-dom'; // For redirecting to login
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Users, BookOpen, Calendar, MessageCircle, Bell, TrendingUp,
  Award, UserCheck, AlertCircle, CheckCircle, Clock, Star,
  GraduationCap, FileText, HelpCircle, Activity
} from 'lucide-react';
import axiosInstance from '../utils/api';
import LakshyaLoader from '../components/LakshyaLoader';

const Dashboard = () => {
  const { user } = useAuth(); // Get user from AuthContext
  const navigate = useNavigate(); // For redirecting to login
  const [dashboardData, setDashboardData] = useState({
    userCount: 0,
    batchCount: 0,
    examCount: 0,
    doubtCount: 0,
    instructorCount: 0,
    noticeCount: 0
  });
  const [users, setUsers] = useState([]);
  const [notices, setNotices] = useState([]);
  const [exams, setExams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({ role: 'user', name: 'User' });

  useEffect(() => {
    if (!user?.userId) {
      setError('Please log in to access your dashboard');
      setLoading(false);
      navigate('/login'); // Redirect to login if user is not authenticated
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
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
          role: userResponse.data.user.role
        });
      } else {
        throw new Error('Failed to fetch user data');
      }

      // Fetch dashboard overview
      const overviewResponse = await axiosInstance.get('/dashboard/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(overviewResponse.data.data);

      // Fetch additional data based on user role
      const promises = [
        axiosInstance.get('/dashboard/notices', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axiosInstance.get('/dashboard/exams', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axiosInstance.get('/dashboard/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ];

      if (userResponse.data.user.role === 'admin') {
        promises.push(axiosInstance.get('/dashboard/users', {
          headers: { Authorization: `Bearer ${token}` }
        }));
      }

      const [noticesRes, examsRes, notificationsRes, usersRes] = await Promise.all(promises);
      
      setNotices(noticesRes.data.data || []);
      setExams(examsRes.data.data || []);
      setNotifications(notificationsRes.data.data || []);
      if (usersRes) setUsers(usersRes.data.data || []);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to fetch dashboard data. Please try again.');
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

  // Process data for charts
  const getChartData = () => {
    const statusData = [
      { name: 'Active Users', value: dashboardData.userCount, color: '#3B82F6' },
      { name: 'Active Batches', value: dashboardData.batchCount, color: '#10B981' },
      { name: 'Total Exams', value: dashboardData.examCount, color: '#F59E0B' },
      { name: 'Open Doubts', value: dashboardData.doubtCount, color: '#EF4444' }
    ];

    const examStatusData = exams.reduce((acc, exam) => {
      const status = new Date(exam.examDate) > new Date() ? 'upcoming' : 'completed';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const examChartData = [
      { name: 'Upcoming', value: examStatusData.upcoming || 0, color: '#3B82F6' },
      { name: 'Completed', value: examStatusData.completed || 0, color: '#10B981' }
    ];

    const noticeTypeData = notices.reduce((acc, notice) => {
      const type = notice.isImportant ? 'Important' : 'Regular';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const noticeChartData = [
      { name: 'Important', value: noticeTypeData.Important || 0, color: '#EF4444' },
      { name: 'Regular', value: noticeTypeData.Regular || 0, color: '#6B7280' }
    ];

    return { statusData, examChartData, noticeChartData };
  };

  const { statusData, examChartData, noticeChartData } = getChartData();

  if (loading) {
    return (
      <LakshyaLoader/>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-center mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {userData.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                {userData.role === 'admin' ? 'Admin Dashboard' : 'Student Dashboard'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-600" />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.userCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">Active learners</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Batches</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.batchCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Activity className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-sm text-blue-600">Currently running</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.examCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Calendar className="w-4 h-4 text-orange-500 mr-1" />
              <span className="text-sm text-orange-600">Assessments</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Doubts</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.doubtCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <MessageCircle className="w-4 h-4 text-purple-500 mr-1" />
              <span className="text-sm text-purple-600">Need attention</span>
            </div>
          </div>
        </div>

        {/* Admin Stats */}
        {userData.role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Instructors</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.instructorCount}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Notices</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.noticeCount}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Overview Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
                <Bar dataKey="value" fill="#3B82F6" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Exam Status Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={examChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {examChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Notices */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Notices</h3>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {notices.slice(0, 5).map((notice) => (
                <div key={notice._id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 ${notice.isImportant ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{notice.title}</p>
                    <p className="text-gray-600 text-xs mt-1">{notice.message.substring(0, 100)}...</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(notice.sentAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {notices.length === 0 && (
                <p className="text-gray-500 text-center py-4">No notices available</p>
              )}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <Bell className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {notifications.slice(0, 5).map((notification) => (
                <div 
                  key={notification._id} 
                  className={`flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                  }`}
                  onClick={() => !notification.isRead && markNotificationAsRead(notification._id)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {notification.type.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      From: {notification.sender?.name || 'System'}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-gray-500 text-center py-4">No notifications</p>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Exams */}
        {exams.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Exams</h3>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams
                .filter(exam => new Date(exam.examDate) > new Date())
                .slice(0, 6)
                .map((exam) => (
                  <div key={exam._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="font-medium text-gray-900">{exam.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{exam.subject}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {new Date(exam.examDate).toLocaleDateString()}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {exam.duration} min
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
