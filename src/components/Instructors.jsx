import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit3, Trash2, User, Mail, Phone, Clock, MapPin, GraduationCap, Calendar, X, Save, UserCheck, Filter, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import axiosInstance from '../utils/api';

const Instructors = () => {
  const [instructors, setInstructors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentInstructor, setCurrentInstructor] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Other',
    dateOfBirth: '',
    contact: { email: '', phone: '', alternatePhone: '', address: { street: '', city: '', state: '', pincode: '' } },
    qualifications: [],
    experienceYears: 0,
    availability: [{ day: 'Monday', from: '', to: '' }],
    isVisitingFaculty: false,
    batchesAssigned: [],
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const limit = 10;

  useEffect(() => {
    fetchInstructors();
    fetchBatches();
  }, [page, search, filterType]);

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const params = { page, limit, search };
      if (filterType !== 'all') {
        params.isVisitingFaculty = filterType === 'visiting';
      }
      const response = await axiosInstance.get('/instructors', { params });
      setInstructors(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await axiosInstance.get('/batches');
      setBatches(response.data.data || response.data); // Adjust based on your API response structure
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleInputChange = (e, nestedField = null, index = null) => {
    const { name, value } = e.target;
    if (nestedField === 'availability' && index !== null) {
      setFormData(prev => ({
        ...prev,
        availability: prev.availability.map((item, i) =>
          i === index ? { ...item, [name]: value } : item
        ),
      }));
    } else if (nestedField === 'address') {
      setFormData(prev => ({
        ...prev,
        contact: {
          ...prev.contact,
          address: { ...prev.contact.address, [name]: value },
        },
      }));
    } else if (nestedField === 'contact') {
      setFormData(prev => ({
        ...prev,
        contact: { ...prev.contact, [name]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBatchChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormData(prev => ({ ...prev, batchesAssigned: selectedOptions }));
  };

  const handleQualificationAdd = () => {
    setFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, ''],
    }));
  };

  const handleQualificationChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.map((q, i) => (i === index ? value : q)),
    }));
  };

  const handleQualificationRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index),
    }));
  };

  const handleAvailabilityAdd = () => {
    setFormData(prev => ({
      ...prev,
      availability: [...prev.availability, { day: 'Monday', from: '', to: '' }],
    }));
  };

  const handleAvailabilityRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let instructorId;
      if (currentInstructor) {
        const response = await axiosInstance.put(`/instructors/${currentInstructor._id}`, formData);
        instructorId = currentInstructor._id;
      } else {
        const response = await axiosInstance.post('/instructors/add', formData);
        instructorId = response.data._id;
      }
      // Assign batches
      if (formData.batchesAssigned.length > 0) {
        await axiosInstance.put(`/instructors/assign-batches/${instructorId}`, { batchIds: formData.batchesAssigned });
      }
      fetchInstructors();
      setIsModalOpen(false);
      setCurrentInstructor(null);
      resetForm();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      gender: 'Other',
      dateOfBirth: '',
      contact: { email: '', phone: '', alternatePhone: '', address: { street: '', city: '', state: '', pincode: '' } },
      qualifications: [],
      experienceYears: 0,
      availability: [{ day: 'Monday', from: '', to: '' }],
      isVisitingFaculty: false,
      batchesAssigned: [],
    });
  };

  const handleEdit = (instructor) => {
    setCurrentInstructor(instructor);
    setFormData({
      fullName: instructor.fullName,
      gender: instructor.gender,
      dateOfBirth: instructor.dateOfBirth.split('T')[0],
      contact: instructor.contact,
      qualifications: instructor.qualifications,
      experienceYears: instructor.experienceYears,
      availability: instructor.availability,
      isVisitingFaculty: instructor.isVisitingFaculty,
      batchesAssigned: instructor.batchesAssigned.map(batch => batch._id),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this instructor?')) {
      try {
        await axiosInstance.delete(`/instructors/${id}`);
        fetchInstructors();
      } catch (error) {
        console.error('Error deleting instructor:', error);
      }
    }
  };

  const handleAddInstructor = () => {
    setCurrentInstructor(null);
    resetForm();
    setIsModalOpen(true);
  };

  const formatAvailability = (availability) => {
    if (!availability || availability.length === 0) return 'Not set';
    return availability.map(a => `${a.day}: ${a.from}-${a.to}`).join(', ');
  };

  const formatBatches = (batchesAssigned) => {
    if (!batchesAssigned || batchesAssigned.length === 0) return 'None';
    return batchesAssigned.map(batch => batch.name).join(', ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Instructor Management
                </h1>
                <p className="text-slate-600 mt-1">Manage and organize your teaching faculty</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-200/60">
                <span className="text-sm text-slate-600">Total Instructors: </span>
                <span className="font-semibold text-slate-800">{instructors.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter Bar */}
        <div className="mb-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search instructors by name or email..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border-0 bg-white/80 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all duration-200 placeholder:text-slate-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="pl-10 pr-8 py-3 rounded-xl border-0 bg-white/80 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer transition-all duration-200"
                >
                  <option value="all">All Instructors</option>
                  <option value="regular">Regular Faculty</option>
                  <option value="visiting">Visiting Faculty</option>
                </select>
              </div>
              
              <button
                className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 transform hover:scale-105"
                onClick={handleAddInstructor}
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                <span className="font-medium">Add Instructor</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Instructors Grid */}
        {!loading && instructors.length === 0 && (
          <div className="text-center py-8 text-slate-600">No instructors found.</div>
        )}
        {!loading && instructors.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {instructors.map((instructor) => (
              <div key={instructor._id} className="group bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {instructor.fullName}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {instructor.isVisitingFaculty ? (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
                            Visiting Faculty
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                            Regular Faculty
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => handleEdit(instructor)}
                      className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors duration-200"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(instructor._id)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm truncate">{instructor.contact.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{instructor.contact.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{instructor.contact.address.city}, {instructor.contact.address.state}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{instructor.experienceYears} years experience</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm">{formatBatches(instructor.batchesAssigned)}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-200/60">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Availability</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {formatAvailability(instructor.availability)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/60 shadow-lg">
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-white/80 text-slate-600 rounded-lg hover:bg-white hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600">Page</span>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg font-medium">{page}</span>
            <span className="text-sm text-slate-600">of {Math.ceil(total / limit)}</span>
          </div>
          
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-white/80 text-slate-600 rounded-lg hover:bg-white hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            disabled={page === Math.ceil(total / limit)}
            onClick={() => setPage(page + 1)}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl transform transition-all duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {currentInstructor ? 'Edit Instructor' : 'Add New Instructor'}
                    </h2>
                    <p className="text-indigo-100 text-sm">
                      {currentInstructor ? 'Update instructor information' : 'Fill in the details to add a new instructor'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div className="bg-slate-50/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                    <User className="w-5 h-5 text-indigo-600" />
                    <span>Personal Information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-slate-50/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-indigo-600" />
                    <span>Contact Information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.contact.email}
                        onChange={(e) => handleInputChange(e, 'contact')}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.contact.phone}
                        onChange={(e) => handleInputChange(e, 'contact')}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Alternate Phone</label>
                      <input
                        type="text"
                        name="alternatePhone"
                        value={formData.contact.alternatePhone}
                        onChange={(e) => handleInputChange(e, 'contact')}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Experience (Years)</label>
                      <input
                        type="number"
                        name="experienceYears"
                        value={formData.experienceYears}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <h4 className="text-md font-medium text-slate-700 mb-3 flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span>Address</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Street</label>
                      <input
                        type="text"
                        name="street"
                        value={formData.contact.address.street}
                        onChange={(e) => handleInputChange(e, 'address')}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.contact.address.city}
                        onChange={(e) => handleInputChange(e, 'address')}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.contact.address.state}
                        onChange={(e) => handleInputChange(e, 'address')}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.contact.address.pincode}
                        onChange={(e) => handleInputChange(e, 'address')}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="bg-slate-50/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    <span>Professional Information</span>
                  </h3>
                  
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-slate-700">Qualifications</label>
                      <button
                        type="button"
                        onClick={handleQualificationAdd}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.qualifications.map((qual, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={qual}
                            onChange={(e) => handleQualificationChange(index, e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                            placeholder="Enter qualification"
                          />
                          <button
                            type="button"
                            onClick={() => handleQualificationRemove(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-slate-700">Assigned Batches</label>
                    </div>
                    <select
                      multiple
                      value={formData.batchesAssigned}
                      onChange={handleBatchChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                    >
                      {batches.map(batch => (
                        <option key={batch._id} value={batch._id}>
                          {batch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="isVisitingFaculty"
                      checked={formData.isVisitingFaculty}
                      onChange={(e) => setFormData(prev => ({ ...prev, isVisitingFaculty: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                    />
                    <label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      <span>Visiting Faculty</span>
                    </label>
                  </div>
                </div>

                {/* Availability */}
                <div className="bg-slate-50/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <span>Availability Schedule</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {formData.availability.map((avail, index) => (
                      <div key={index} className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-slate-200">
                        <select
                          name="day"
                          value={avail.day}
                          onChange={(e) => handleInputChange(e, 'availability', index)}
                          className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                        >
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                        <input
                          type="time"
                          name="from"
                          value={avail.from}
                          onChange={(e) => handleInputChange(e, 'availability', index)}
                          className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                        />
                        <input
                          type="time"
                          name="to"
                          value={avail.to}
                          onChange={(e) => handleInputChange(e, 'availability', index)}
                          className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleAvailabilityRemove(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAvailabilityAdd}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Availability</span>
                    </button>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{currentInstructor ? 'Update' : 'Create'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Instructors;