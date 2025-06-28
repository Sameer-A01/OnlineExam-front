import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, MapPin, Clock, BookOpen, Filter, ChevronLeft, ChevronRight, GraduationCap, Calendar } from 'lucide-react';
import axiosInstance from '../utils/api';

const MyInstructors = () => {
  const [instructors, setInstructors] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const limit = 10;

  useEffect(() => {
    fetchInstructors();
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
                  My Instructors
                </h1>
                <p className="text-slate-600 mt-1">View your instructors and their details</p>
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-200/60">
              <span className="text-sm text-slate-600">Total Instructors: </span>
              <span className="font-semibold text-slate-800">{instructors.length}</span>
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
              <div key={instructor._id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">{instructor.fullName}</h3>
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
    </div>
  );
};

export default MyInstructors;