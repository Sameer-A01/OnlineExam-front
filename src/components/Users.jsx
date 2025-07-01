import React, { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  User,
  UserPlus,
  Mail,
  MapPin,
  Shield,
  BookOpen,
  X,
  Eye,
  EyeOff,
  Users as UsersIcon,
  GraduationCap,
  UserCheck,
  Filter,
  Save
} from 'lucide-react';
import axiosInstance from "../utils/api";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    password: "",
    role: "user",
    batch: "",
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/users");
      if (response.data.success) {
        setUsers(response.data.users);
        setFilteredUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await axiosInstance.get("/batches");
      if (response.data) {
        setBatches(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBatches();
  }, []);

  useEffect(() => {
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  const handleSubmit = async () => {
    try {
      let response;
      if (isEditing) {
        response = await axiosInstance.put(`/users/${currentUserId}`, formData);
      } else {
        response = await axiosInstance.post("/users/add", formData);
      }
      
      if (response.data.success) {
        fetchUsers();
        resetForm();
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleEdit = (user) => {
    setFormData({
      name: user.name,
      address: user.address || "",
      email: user.email,
      password: "",
      role: user.role,
      batch: user.batch?._id || "",
    });
    setIsEditing(true);
    setCurrentUserId(user._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await axiosInstance.delete(`/users/${id}`);
        if (response.data.success) {
          setUsers((prev) => prev.filter((user) => user._id !== id));
          setFilteredUsers((prev) => prev.filter((user) => user._id !== id));
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleRoleChange = (role) => {
    setFormData({
      ...formData,
      role,
      batch: role === "admin" ? "" : formData.batch
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      email: "",
      password: "",
      role: "user",
      batch: "",
    });
    setIsEditing(false);
    setCurrentUserId(null);
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const RoleBadge = ({ role }) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      user: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    const icons = {
      admin: Shield,
      user: User
    };
    
    const Icon = icons[role];
    
    return (
      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${colors[role] || colors.user} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const StatsCard = ({ title, count, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1">{count}</p>
        </div>
        <div className={`p-2 sm:p-3 rounded-full ${color}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const totalUsers = users.length;
  const adminCount = users.filter(user => user.role === 'admin').length;
  const studentCount = users.filter(user => user.role === 'user').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-6">
      <div className="max-w-full sm:max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl smgat:text-4xl font-bold text-gray-900 mb-2">Users Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage students and administrators in your coaching institute</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatsCard 
            title="Total Users" 
            count={totalUsers} 
            icon={UsersIcon} 
            color="bg-gradient-to-r from-blue-500 to-purple-500"
          />
          <StatsCard 
            title="Students" 
            count={studentCount} 
            icon={GraduationCap} 
            color="bg-gradient-to-r from-green-500 to-emerald-500"
          />
          <StatsCard 
            title="Administrators" 
            count={adminCount} 
            icon={Shield} 
            color="bg-gradient-to-r from-orange-500 to-red-500"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full sm:w-auto pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-sm"
                >
                  <option value="">All Roles</option>
                  <option value="user">Students</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
            </div>

            <button
              onClick={openModal}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm justify-center"
            >
              <UserPlus className="h-4 w-4" />
              Add New User
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Role
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Batch
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Contact
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center flex-col sm:flex-row gap-2 sm:gap-0">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                            <span className="text-white font-medium text-xs sm:text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="sm:ml-4 text-center sm:text-left">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs sm:text-sm text-gray-500 flex items-0 sm:flex items-center gap-1">
                            <Mail className="h-3 w-3 inline-block mr-1 sm:mr-0" />
                            <span className="block sm:inline">{user.email}</span>
                          </div>
                          <div className="sm:hidden mt-2 space-y-1">
                            <RoleBadge role={user.role} />
                            <div className="text-xs text-gray-900">
                              {user.batch ? (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 justify-center">
                                  <BookOpen className="h-3 w-3" />
                                  {batches.find(b => b._id === user.batch?._id)?.name || "N/A"}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">No batch assigned</span>
                              )}
                            </div>
                            {user.address && (
                              <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {user.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden md:table-cell text-sm text-gray-900">
                      {user.batch ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                          <BookOpen className="h-3 w-3" />
                          {batches.find(b => b._id === user.batch?._id)?.name || "N/A"}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">No batch assigned</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden lg:table-cell text-sm text-gray-500">
                      {user.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {user.address}
                        </div>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 justify-center text-xs sm:text-sm"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 justify-center text-xs sm:text-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <UsersIcon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  {searchTerm || roleFilter ? 'Try adjusting your search or filter criteria.' : 'Get started by adding a new user.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Edit3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                        Edit User
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                        Add New User
                      </>
                    )}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    required
                    disabled={isEditing}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Password {!isEditing && '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={isEditing ? "Leave blank to keep current password" : "Enter password"}
                      className="w-full p-2 sm:p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      required={!isEditing}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {isEditing && (
                    <p className="text-xs text-gray-500 mt-1">Leave password blank to keep current password</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter address"
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    <Shield className="inline h-4 w-4 mr-1" />
                    Role *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleRoleChange('user')}
                      className={`p-2 sm:p-3 rounded-lg border-2 transition-all text-xs sm:text-sm ${
                        formData.role === 'user'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1" />
                      <div className="font-medium">Student</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange('admin')}
                      className={`p-2 sm:p-3 rounded-lg border-2 transition-all text-xs sm:text-sm ${
                        formData.role === 'admin'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1" />
                      <div className="font-medium">Admin</div>
                    </button>
                  </div>
                </div>

                {formData.role === "user" && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      <BookOpen className="inline h-4 w-4 mr-1" />
                      Batch *
                    </label>
                    <select
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      required={formData.role === "user"}
                    >
                      <option value="">Select a batch</option>
                      {batches.map((batch) => (
                        <option key={batch._id} value={batch._id}>
                          {batch.name} ({batch.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 sm:py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg flex items-center justify-center gap-2 text-sm"
                  >
                    {isEditing ? (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Create User
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;