import React, { useState } from 'react';
import { Search, Users, BookOpen, Calendar, PlusCircle, Send, CheckCircle, AlertCircle, Activity, Download, BarChart } from 'lucide-react';

const Assignment = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Mock data for students
  const students = [
    { id: 1, name: 'Alex Johnson', email: 'alex@example.com', course: 'Computer Science', avatar: '/api/placeholder/50/50' },
    { id: 2, name: 'Jamie Smith', email: 'jamie@example.com', course: 'Physics', avatar: '/api/placeholder/50/50' },
    { id: 3, name: 'Chris Wilson', email: 'chris@example.com', course: 'Mathematics', avatar: '/api/placeholder/50/50' },
    { id: 4, name: 'Taylor Brown', email: 'taylor@example.com', course: 'Biology', avatar: '/api/placeholder/50/50' },
    { id: 5, name: 'Morgan Davis', email: 'morgan@example.com', course: 'Chemistry', avatar: '/api/placeholder/50/50' },
  ];

  // Mock data for assignments
  const assignments = [
    { id: 1, title: 'Database Design Project', dueDate: '2025-06-15', course: 'Computer Science', status: 'active' },
    { id: 2, title: 'Quantum Physics Essay', dueDate: '2025-06-10', course: 'Physics', status: 'active' },
    { id: 3, title: 'Calculus Problem Set', dueDate: '2025-05-25', course: 'Mathematics', status: 'active' },
    { id: 4, title: 'Molecular Biology Lab Report', dueDate: '2025-05-30', course: 'Biology', status: 'completed' },
  ];

  // Mock data for analytics
  const analyticsData = {
    submissionRate: 76,
    averageGrade: 85,
    onTimeSubmission: 82,
    feedbackResponses: 68
  };

  const handleSelectStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(student => student.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSendAssignment = () => {
    // Simulating sending assignment
    setShowSuccessAlert(true);
    setTimeout(() => {
      setShowSuccessAlert(false);
      setSelectedStudents([]);
      setSelectAll(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">EduAdmin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button className="bg-indigo-800 hover:bg-indigo-900 px-4 py-2 rounded-md text-sm font-medium flex items-center">
              <PlusCircle size={16} className="mr-2" />
              New Assignment
            </button>
            <div className="bg-indigo-800 rounded-full h-10 w-10 flex items-center justify-center">
              <span className="font-bold">AD</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto flex flex-col md:flex-row flex-1 p-6 space-x-0 md:space-x-6 space-y-6 md:space-y-0">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow-md p-4">
          <nav className="space-y-2">
            <button
              className={`flex items-center space-x-3 w-full p-3 rounded-md transition ${activeTab === 'create' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('create')}
            >
              <PlusCircle size={20} />
              <span className="font-medium">Create & Assign</span>
            </button>

            <button
              className={`flex items-center space-x-3 w-full p-3 rounded-md transition ${activeTab === 'students' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('students')}
            >
              <Users size={20} />
              <span className="font-medium">Students</span>
            </button>

            <button
              className={`flex items-center space-x-3 w-full p-3 rounded-md transition ${activeTab === 'assignments' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('assignments')}
            >
              <BookOpen size={20} />
              <span className="font-medium">Assignments</span>
            </button>

            <button
              className={`flex items-center space-x-3 w-full p-3 rounded-md transition ${activeTab === 'analytics' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart size={20} />
              <span className="font-medium">Analytics</span>
            </button>
          </nav>

          {/* Quick Stats */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-500 mb-3">QUICK STATS</h3>
            <div className="space-y-4">
              <div className="bg-green-50 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-green-700 font-medium">Active Assignments</span>
                  <span className="bg-green-200 text-green-800 rounded-full px-2 py-1 text-xs font-medium">5</span>
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-medium">Pending Reviews</span>
                  <span className="bg-blue-200 text-blue-800 rounded-full px-2 py-1 text-xs font-medium">12</span>
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-yellow-700 font-medium">Due Today</span>
                  <span className="bg-yellow-200 text-yellow-800 rounded-full px-2 py-1 text-xs font-medium">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1">
          {/* Success Alert */}
          {showSuccessAlert && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded shadow-md flex items-center">
              <CheckCircle size={20} className="mr-2" />
              <div>
                <p className="font-bold">Success!</p>
                <p>Assignment has been sent to {selectedStudents.length} students.</p>
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6">Create & Assign</h2>
              
              {/* Assignment Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">1. Select Assignment</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="relative w-full">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pl-10 p-2.5"
                        placeholder="Search assignments..."
                      />
                    </div>
                    <button className="ml-3 bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
                      New
                    </button>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {assignments.map(assignment => (
                          <tr 
                            key={assignment.id} 
                            className={`hover:bg-gray-50 cursor-pointer ${selectedAssignment === assignment.id ? 'bg-indigo-50' : ''}`}
                            onClick={() => setSelectedAssignment(assignment.id)}
                          >
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">{assignment.title}</td>
                            <td className="py-3 px-4 text-sm text-gray-500">{assignment.dueDate}</td>
                            <td className="py-3 px-4 text-sm text-gray-500">{assignment.course}</td>
                            <td className="py-3 px-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                assignment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {assignment.status === 'active' ? 'Active' : 'Completed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              {/* Student Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">2. Select Recipients</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="relative w-full">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pl-10 p-2.5"
                        placeholder="Search students..."
                      />
                    </div>
                    <button
                      className="ml-3 bg-gray-200 hover:bg-gray-300 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center"
                      onClick={handleSelectAll}
                    >
                      <CheckCircle size={16} className="mr-2" />
                      {selectAll ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {students.map(student => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 text-indigo-600 rounded"
                                checked={selectedStudents.includes(student.id)}
                                onChange={() => handleSelectStudent(student.id)}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full overflow-hidden mr-3">
                                  <img src={student.avatar} alt={student.name} />
                                </div>
                                <span className="text-sm font-medium text-gray-900">{student.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">{student.email}</td>
                            <td className="py-3 px-4 text-sm text-gray-500">{student.course}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              {/* Assignment Options */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">3. Assignment Options</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Date & Time</label>
                      <input type="datetime-local" className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Submission Format</label>
                      <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5">
                        <option>PDF Document</option>
                        <option>Word Document</option>
                        <option>Text Submission</option>
                        <option>URL Link</option>
                        <option>Multiple Files</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Points Possible</label>
                      <input type="number" className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5" placeholder="100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                      <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5">
                        <option>Visible to students</option>
                        <option>Hidden until start date</option>
                        <option>Draft (hidden)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Instructions</label>
                    <textarea 
                      className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5" 
                      rows="3"
                      placeholder="Enter any additional instructions for students..."
                    ></textarea>
                  </div>
                  
                  <div className="mt-4">
                    <label className="inline-flex items-center">
                      <input type="checkbox" className="form-checkbox text-indigo-600" />
                      <span className="ml-2 text-sm text-gray-700">Allow late submissions</span>
                    </label>
                  </div>
                  
                  <div className="mt-4">
                    <label className="inline-flex items-center">
                      <input type="checkbox" className="form-checkbox text-indigo-600" />
                      <span className="ml-2 text-sm text-gray-700">Send email notifications to students</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium mr-2"
                >
                  Save as Draft
                </button>
                <button 
                  className={`bg-indigo-700 hover:bg-indigo-800 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center ${
                    !selectedAssignment || selectedStudents.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={!selectedAssignment || selectedStudents.length === 0}
                  onClick={handleSendAssignment}
                >
                  <Send size={16} className="mr-2" />
                  Send Assignment
                </button>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Student Management</h2>
              
              <div className="flex items-center justify-between mb-6">
                <div className="relative w-full max-w-md">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pl-10 p-2.5"
                    placeholder="Search students..."
                  />
                </div>
                <div className="flex space-x-2">
                  <button className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                    <Download size={16} className="mr-2" />
                    Export
                  </button>
                  <button className="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                    <PlusCircle size={16} className="mr-2" />
                    Add Student
                  </button>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.map(student => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                              <img src={student.avatar} alt={student.name} />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{student.email}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{student.course}</td>
                        <td className="py-3 px-4">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${Math.floor(Math.random() * 100)}%` }}></div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button className="text-indigo-600 hover:text-indigo-900 font-medium text-sm">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Assignment Tracking</h2>
              
              <div className="flex items-center justify-between mb-6">
                <div className="relative w-full max-w-md">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pl-10 p-2.5"
                    placeholder="Search assignments..."
                  />
                </div>
                <div>
                  <button className="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                    <PlusCircle size={16} className="mr-2" />
                    Create Assignment
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-blue-700 text-sm font-medium">Active Assignments</p>
                      <p className="text-blue-900 text-xl font-bold">6</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <BookOpen size={20} className="text-blue-700" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-green-700 text-sm font-medium">Completed Assignments</p>
                      <p className="text-green-900 text-xl font-bold">24</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle size={20} className="text-green-700" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-yellow-700 text-sm font-medium">Pending Reviews</p>
                      <p className="text-yellow-900 text-xl font-bold">12</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <AlertCircle size={20} className="text-yellow-700" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {assignments.map(assignment => (
                      <tr key={assignment.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-900">{assignment.title}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{assignment.course}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{assignment.dueDate}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            assignment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {assignment.status === 'active' ? 'Active' : 'Completed'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {Math.floor(Math.random() * 20) + 1}/{students.length}
                        </td>
                        <td className="py-3 px-4">
                          <button className="text-indigo-600 hover:text-indigo-900 font-medium text-sm">Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6">Assignment Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex flex-col">
                    <span className="text-blue-700 text-sm font-medium">Submission Rate</span>
                    <span className="text-blue-900 text-2xl font-bold">{analyticsData.submissionRate}%</span>
                    <div className="w-full bg-blue-200 rounded-full h-2.5 mt-2">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${analyticsData.submissionRate}%` }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex flex-col">
                    <span className="text-green-700 text-sm font-medium">Average Grade</span>
                    <span className="text-green-900 text-2xl font-bold">{analyticsData.averageGrade}%</span>
                    <div className="w-full bg-green-200 rounded-full h-2.5 mt-2">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${analyticsData.averageGrade}%` }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex flex-col">
                    <span className="text-purple-700 text-sm font-medium">On-Time Submission</span>
                    <span className="text-purple-900 text-2xl font-bold">{analyticsData.onTimeSubmission}%</span>
                    <div className="w-full bg-purple-200 rounded-full h-2.5 mt-2">
                      <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${analyticsData.onTimeSubmission}%` }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex flex-col">
                    <span className="text-yellow-700 text-sm font-medium">Feedback Responses</span>
                    <span className="text-yellow-900 text-2xl font-bold">{analyticsData.feedbackResponses}%</span>
                    <div className="w-full bg-yellow-200 rounded-full h-2.5 mt-2">
                      <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: `${analyticsData.feedbackResponses}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Performance by Assignment Chart (Sample Visualization) */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Performance by Assignment</h3>
                <div className="h-64 bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-center">
                  {/* This is a placeholder for a chart - in a real app, you would use a charting library */}
                  <div className="w-full h-full flex">
                    {['Assignment 1', 'Assignment 2', 'Assignment 3', 'Assignment 4', 'Assignment 5'].map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center justify-end h-full pb-4 space-y-2">
                        <div 
                          className="w-12 bg-indigo-600 rounded-t-lg"
                          style={{ height: `${Math.floor(Math.random() * 50) + 30}%` }}
                        ></div>
                        <span className="text-xs text-gray-600 font-medium">Asn {index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Student Performance Table */}
              <div>
                <h3 className="text-lg font-medium mb-4">Student Performance</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignments Completed</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Score</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On-Time Rate</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map(student => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full overflow-hidden mr-3">
                                <img src={student.avatar} alt={student.name} />
                              </div>
                              <span className="text-sm font-medium text-gray-900">{student.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {Math.floor(Math.random() * 10) + 5}/{assignments.length + 10}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {Math.floor(Math.random() * 20) + 75}%
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {Math.floor(Math.random() * 30) + 70}%
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <Activity size={16} className="text-indigo-600 mr-1" />
                              <div className="w-20 h-4 flex items-center">
                                {[1, 2, 3, 4, 5].map((_, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`w-1 mx-0.5 rounded-sm ${
                                      Math.random() > 0.5 ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                                    style={{ height: `${Math.floor(Math.random() * 12) + 4}px` }}
                                  ></div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Assignment;