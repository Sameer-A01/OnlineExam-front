import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/api';
import { User, Mail, MapPin, Shield, Users, Calendar, BookOpen, Edit3, Save, X, Eye, EyeOff, Clock, GraduationCap } from 'lucide-react';

const Profile = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'user',
    batch: null,
    profilePic: ''
  });
  const [originalPassword, setOriginalPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/users/${user.userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ims_token")}`,
          },
        });
        if (response.data.success) {
          const userInfo = {
            name: response.data.user.name,
            email: response.data.user.email,
            address: response.data.user.address,
            role: response.data.user.role,
            batch: response.data.user.batch,
            profilePic: response.data.user.profilePic || '',
            password: ''
          };
          setUserData(userInfo);
          setOriginalPassword(response.data.user.password);
        }
      } catch (error) {
        console.error(error);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user.userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const updateData = { ...userData };
    if (updateData.password === '' || updateData.password === originalPassword) {
      delete updateData.password;
    }

    try {
      const response = await axiosInstance.put(`/users/${user.userId}`, updateData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ims_token")}`
        }
      });
      
      if (response.data.success) {
        setUserData({ 
          name: response.data.user.name,
          email: response.data.user.email,
          address: response.data.user.address,
          role: response.data.user.role,
          batch: response.data.user.batch,
          profilePic: response.data.user.profilePic || '',
          password: ''
        });
        setOriginalPassword(response.data.user.password);
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setError('Failed to update user information');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setUserData(prev => ({ ...prev, password: '' }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && !userData.name) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            User Profile
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg shadow-sm animate-pulse">
            <div className="flex items-center">
              <Save className="h-5 w-5 text-green-400 mr-3" />
              <p className="text-green-800 font-medium">Profile updated successfully!</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <X className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center transform hover:scale-105 transition-all duration-300">
              <div className="relative mb-6">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-1 shadow-2xl">
                  <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {userData.profilePic ? (
                      <img 
                        src={userData.profilePic} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full p-2 shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{userData.name}</h2>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 mb-4">
                <Shield className="w-4 h-4 mr-1" />
                {userData.role === 'admin' ? 'Administrator' : 'Student'}
              </div>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-3 text-indigo-500" />
                  <span className="text-sm truncate">{userData.email}</span>
                </div>
                <div className="flex items-start text-gray-600">
                  <MapPin className="w-4 h-4 mr-3 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{userData.address || 'No address provided'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Information */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <User className="w-6 h-6 mr-2" />
                    Profile Information
                  </h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2 backdrop-blur-sm"
                      disabled={loading}
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={userData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={userData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        name="address"
                        value={userData.address}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        rows="3"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-200 resize-none"
                        placeholder="Enter your complete address"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        New Password
                      </label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={userData.password || ''}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter new password (optional)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <X className="w-5 h-5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Batch Information - Only show for users with batch */}
            {userData.role === 'user' && userData.batch && (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-6">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <GraduationCap className="w-6 h-6 mr-2" />
                    Batch Information
                  </h3>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 the">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Batch Name
                        </label>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{userData.batch.name}</p>
                            {userData.batch.description && (
                              <p className="text-sm text-gray-600">{userData.batch.description}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {userData.batch.instructor && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Instructor
                          </label>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-lg flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <p className="font-medium text-gray-800">{userData.batch.instructor}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {userData.batch.startDate && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Duration
                          </label>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-lg flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {formatDate(userData.batch.startDate)} - {formatDate(userData.batch.endDate)}
                              </p>
                              {userData.batch.duration && (
                                <p className="text-sm text-gray-600">{userData.batch.duration}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {userData.batch.totalStudents && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Class Size
                          </label>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-lg flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <p className="font-medium text-gray-800">{userData.batch.totalStudents} Students</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {userData.batch.technologies && userData.batch.technologies.length > 0 && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Technologies & Skills
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {userData.batch.technologies.map((tech, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {userData.batch.status && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Status
                        </label>
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            userData.batch.status === 'active' ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                            userData.batch.status === 'completed' ? 'bg-gradient-to-r from-blue-400 to-indigo-400' :
                            'bg-gradient-to-r from-yellow-400 to-orange-400'
                          }`}>
                            <Clock className="w-5 h-5 text-white" />
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            userData.batch.status === 'active' ? 'bg-green-100 text-green-700' :
                            userData.batch.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {userData.batch.status.charAt(0).toUpperCase() + userData.batch.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 py-6 text-center text-gray-600">
          <p>Designed and Developed by <a href="https://webaziz.in" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200">webaziz.in</a></p>
        </footer>
      </div>
    </div>
  );
};

export default Profile;