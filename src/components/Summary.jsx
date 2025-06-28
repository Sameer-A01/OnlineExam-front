import React from 'react';
import { 
  LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, BarChart, Bar
} from 'recharts';
import { 
  Bell, User, Book, Users, FileText, MessageSquare, 
  Award, Calendar, Search, ChevronRight, Edit3, Clock
} from 'lucide-react';

// Mock data for charts and statistics
const examScoreData = [
  { name: 'Physics', average: 75 },
  { name: 'Math', average: 82 },
  { name: 'Chemistry', average: 68 },
  { name: 'Biology', average: 79 },
  { name: 'English', average: 88 },
];

const submissionData = [
  { name: 'Assignment 1', complete: 38, pending: 12 },
  { name: 'Assignment 2', complete: 45, pending: 5 },
  { name: 'Quiz 1', complete: 42, pending: 8 },
  { name: 'Project', complete: 30, pending: 20 },
];

const courseDistributionData = [
  { name: 'Science', value: 35, color: '#6366F1' },
  { name: 'Arts', value: 25, color: '#EC4899' },
  { name: 'Commerce', value: 20, color: '#10B981' },
  { name: 'Computer Science', value: 20, color: '#F59E0B' },
];

const recentActivities = [
  { id: 1, activity: 'New assignment posted', course: 'Physics', time: '2 hours ago', icon: <FileText size={16} /> },
  { id: 2, activity: 'Exam scheduled', course: 'Mathematics', time: '5 hours ago', icon: <Calendar size={16} /> },
  { id: 3, activity: 'New discussion topic', course: 'Biology', time: 'Yesterday', icon: <MessageSquare size={16} /> },
  { id: 4, activity: 'Grades published', course: 'Chemistry', time: 'Yesterday', icon: <Award size={16} /> },
  { id: 5, activity: 'Course material updated', course: 'English', time: '2 days ago', icon: <Book size={16} /> },
];

const upcomingExams = [
  { id: 1, subject: 'Physics Midterm', date: 'May 25, 2025', time: '10:00 AM' },
  { id: 2, subject: 'Mathematics Quiz', date: 'May 28, 2025', time: '1:00 PM' },
  { id: 3, subject: 'Biology Lab Test', date: 'June 2, 2025', time: '11:30 AM' },
];

const pendingAssignments = [
  { id: 1, title: 'Chemical Equations', course: 'Chemistry', deadline: 'May 23, 2025' },
  { id: 2, title: 'Literary Analysis', course: 'English', deadline: 'May 26, 2025' },
  { id: 3, title: 'Data Structures Problem Set', course: 'Computer Science', deadline: 'May 29, 2025' },
];

const Dashboard = () => {
  return (
    <div className="h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-indigo-700">Lakshay Institute</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="relative p-2 rounded-full hover:bg-gray-100">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
              <User size={18} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6 overflow-auto h-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard 
            title="Total Students" 
            value="1,280" 
            trend="+12%" 
            trendUp={true} 
            icon={<Users className="text-indigo-500" />} 
          />
          <StatCard 
            title="Courses" 
            value="42" 
            trend="+3" 
            trendUp={true} 
            icon={<Book className="text-green-500" />} 
          />
          <StatCard 
            title="Assignments" 
            value="156" 
            trend="+24" 
            trendUp={true} 
            icon={<FileText className="text-orange-500" />} 
          />
          <StatCard 
            title="Pass Rate" 
            value="92%" 
            trend="+5.4%" 
            trendUp={true} 
            icon={<Award className="text-purple-500" />} 
          />
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Average Exam Scores</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={examScoreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="average" stroke="#6366F1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Assignment Submissions</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={submissionData}
                  layout="vertical"
                  barSize={20}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="complete" fill="#10B981" name="Completed" />
                  <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Course Distribution</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={courseDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label
                  >
                    {courseDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Recent Activities</h2>
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">View All</button>
            </div>
            <div className="space-y-4 overflow-y-auto h-64 pr-2">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
                  <div className="p-2 bg-indigo-100 rounded-md text-indigo-600">
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{activity.activity}</p>
                    <p className="text-xs text-gray-500">
                      {activity.course} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Discussion Forum</h2>
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">View All</button>
            </div>
            <div className="space-y-4 overflow-y-auto h-64 pr-2">
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">S</div>
                  <div>
                    <p className="text-sm font-medium">Sarah Johnson</p>
                    <p className="text-xs text-gray-500">Physics • 1 hour ago</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">Can someone explain the concept of quantum entanglement?</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span className="flex items-center mr-3"><MessageSquare size={12} className="mr-1" /> 5 replies</span>
                  <span className="flex items-center"><Award size={12} className="mr-1" /> 2 solutions</span>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">M</div>
                  <div>
                    <p className="text-sm font-medium">Michael Chen</p>
                    <p className="text-xs text-gray-500">Math • 3 hours ago</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">Having trouble with the differentiation formulas in calculus...</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span className="flex items-center mr-3"><MessageSquare size={12} className="mr-1" /> 7 replies</span>
                  <span className="flex items-center"><Award size={12} className="mr-1" /> 1 solution</span>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">R</div>
                  <div>
                    <p className="text-sm font-medium">Rachel Kim</p>
                    <p className="text-xs text-gray-500">Computer Science • 5 hours ago</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">Could someone explain recursion in programming?</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span className="flex items-center mr-3"><MessageSquare size={12} className="mr-1" /> 12 replies</span>
                  <span className="flex items-center"><Award size={12} className="mr-1" /> 3 solutions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Upcoming Exams</h2>
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">View Calendar</button>
            </div>
            <div className="divide-y">
              {upcomingExams.map((exam) => (
                <div key={exam.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-md text-purple-600">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{exam.subject}</p>
                      <p className="text-xs text-gray-500">{exam.date} • {exam.time}</p>
                    </div>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-indigo-600">
                    <ChevronRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Pending Assignments</h2>
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">View All</button>
            </div>
            <div className="divide-y">
              {pendingAssignments.map((assignment) => (
                <div key={assignment.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-md text-green-600">
                      <Edit3 size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{assignment.title}</p>
                      <p className="text-xs text-gray-500">{assignment.course} • Due {assignment.deadline}</p>
                    </div>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-indigo-600">
                    <ChevronRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Online Examination Results</h2>
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">View Complete Results</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">A</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Alex Johnson</div>
                        <div className="text-sm text-gray-500">ID: STU2025001</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Physics</div>
                    <div className="text-xs text-gray-500">Midterm Exam</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">May 18, 2025</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">87/100</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Passed</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-indigo-600 hover:text-indigo-900">View Details</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mr-3">S</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Sara Williams</div>
                        <div className="text-sm text-gray-500">ID: STU2025042</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Math</div>
                    <div className="text-xs text-gray-500">Quiz 2</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">May 19, 2025</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">92/100</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Passed</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-indigo-600 hover:text-indigo-900">View Details</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">J</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">James Lee</div>
                        <div className="text-sm text-gray-500">ID: STU2025113</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Biology</div>
                    <div className="text-xs text-gray-500">Final Exam</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">May 20, 2025</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">65/100</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Average</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-indigo-600 hover:text-indigo-900">View Details</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component for stats cards
const StatCard = ({ title, value, trend, trendUp, icon }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1 text-gray-800">{value}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-md">
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-center">
        <span className={`text-xs font-medium ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
          {trend}
        </span>
        <span className="text-xs text-gray-500 ml-1">vs last month</span>
      </div>
    </div>
  );
};

export default Dashboard;

