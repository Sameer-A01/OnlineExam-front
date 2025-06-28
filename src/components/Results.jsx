import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

// Error Boundary for Charts
class ChartErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-red-500 text-center">Error rendering chart</div>;
    }
    return this.props.children;
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Results = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'score', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axiosInstance.get(`/studentAnswers/results/${examId}`);
        setResults(response.data.attempts || []);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch results');
        setLoading(false);
      }
    };

    fetchResults();
  }, [examId]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedResults = [...results].sort((a, b) => {
    const aValue = a[sortConfig.key] || '';
    const bValue = b[sortConfig.key] || '';
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const filteredResults = sortedResults.filter(result => 
    result.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.studentId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = filteredResults.slice(indexOfFirstResult, indexOfLastResult);
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      results.map(result => ({
        'Student Name': result.studentId?.name || 'Unknown',
        'Email': result.studentId?.email || 'Unknown',
        'Score': result.score || 0,
        'Accuracy': result.performanceAnalytics?.accuracy?.toFixed(2) + '%' || '0%',
        'Time Management': result.performanceAnalytics?.timeManagement?.toFixed(2) + 's' || '0s',
        'Strong Sections': result.performanceAnalytics?.strongSections?.join(', ') || 'None',
        'Weak Sections': result.performanceAnalytics?.weakSections?.join(', ') || 'None',
        'Submitted At': result.submittedAt ? new Date(result.submittedAt).toLocaleString() : 'Not submitted',
        'Cheating Attempts': result.cheatingAttempts || 0
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    XLSX.writeFile(workbook, `exam_results_${examId}.xlsx`);
  };

  const exportStudentReport = (studentData) => {
    const docDefinition = {
      content: [
        { text: 'Exam Performance Report', style: 'header' },
        { text: `Student: ${studentData.studentId?.name || 'Unknown'}`, style: 'subheader' },
        { text: `Email: ${studentData.studentId?.email || 'Unknown'}`, style: 'subheader' },
        { text: `Score: ${studentData.score || 0}`, style: 'subheader' },
        { text: `Submitted At: ${studentData.submittedAt ? new Date(studentData.submittedAt).toLocaleString() : 'Not submitted'}`, style: 'subheader' },
        { text: '\nPerformance Overview', style: 'sectionHeader' },
        {
          table: {
            widths: ['*', '*'],
            body: [
              ['Accuracy', `${studentData.performanceAnalytics?.accuracy?.toFixed(2) || 0}%`],
              ['Time Management', `${studentData.performanceAnalytics?.timeManagement?.toFixed(2) || 0}s per question`],
              ['Strong Sections', studentData.performanceAnalytics?.strongSections?.join(', ') || 'None'],
              ['Weak Sections', studentData.performanceAnalytics?.weakSections?.join(', ') || 'None'],
              ['Cheating Attempts', studentData.cheatingAttempts || 0]
            ]
          }
        },
        { text: '\nSection-wise Performance', style: 'sectionHeader' },
        {
          table: {
            widths: ['*', '*', '*'],
            headerRows: 1,
            body: [
              ['Section', 'Correct Answers', 'Accuracy'],
              ...(studentData.performanceAnalytics?.sectionStats
                ? Object.entries(studentData.performanceAnalytics.sectionStats).map(([section, stats]) => [
                    section,
                    `${stats.correct || 0}/${stats.total || 0}`,
                    `${(stats.accuracy || 0).toFixed(2)}%`
                  ])
                : [])
            ]
          }
        },
        ...(studentData.feedback ? [
          { text: '\nStudent Feedback', style: 'sectionHeader' },
          {
            table: {
              widths: ['*', '*'],
              body: [
                ['Mood', studentData.feedback.mood || 'Not provided'],
                ['Rating', studentData.feedback.rating ? `${studentData.feedback.rating}/5` : 'Not provided'],
                ['Confidence Level', studentData.feedback.confidenceLevel || 'Not provided'],
                ['Comments', studentData.feedback.comments || 'No comments']
              ]
            }
          }
        ] : [])
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
      }
    };

    console.log('PDF content:', docDefinition);
    alert('PDF generation would be implemented here with a library like pdfmake');
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading results...</div>;
  if (error) return <div className="text-red-500 text-center mt-8">{error}</div>;

  // Calculate overall statistics
  const overallStats = {
    averageScore: results.length > 0 ? results.reduce((sum, result) => sum + (result.score || 0), 0) / results.length : 0,
    highestScore: results.length > 0 ? Math.max(...results.map(result => result.score || 0)) : 0,
    lowestScore: results.length > 0 ? Math.min(...results.map(result => result.score || 0)) : 0,
    averageAccuracy: results.length > 0 ? results.reduce((sum, result) => sum + (result.performanceAnalytics?.accuracy || 0), 0) / results.length : 0,
    totalCheatingAttempts: results.reduce((sum, result) => sum + (result.cheatingAttempts || 0), 0),
    submissionRate: results.length > 0 ? (results.length / 100) * 100 : 0 // Assuming 100 is total students
  };

  // Prepare section-wise data for charts
  const sectionData = {};
  if (results.length > 0) {
    results.forEach(result => {
      if (!result.performanceAnalytics?.sectionStats) return;
      Object.entries(result.performanceAnalytics.sectionStats).forEach(([section, stats]) => {
        if (!sectionData[section]) {
          sectionData[section] = {
            name: section,
            totalQuestions: 0,
            correctAnswers: 0,
            averageTime: 0,
            count: 0
          };
        }
        sectionData[section].totalQuestions += stats.total || 0;
        sectionData[section].correctAnswers += stats.correct || 0;
        sectionData[section].averageTime += stats.averageTime || 0;
        sectionData[section].count++;
      });
    });
  }

  const sectionChartData = Object.values(sectionData).map(section => ({
    name: section.name,
    accuracy: section.totalQuestions > 0 ? (section.correctAnswers / section.totalQuestions) * 100 : 0,
    averageTime: section.count > 0 ? section.averageTime / section.count : 0
  }));

  const scoreDistribution = Array(10).fill(0).map((_, i) => {
    const min = i * 10;
    const max = (i + 1) * 10;
    return {
      range: `${min}-${max}`,
      count: results.filter(r => (r.score || 0) >= min && (r.score || 0) < max).length
    };
  });

  const trackViewDetails = (result) => {
    if (result && result.performanceAnalytics && result.studentId && result.answers) {
      setSelectedStudent(result);
    } else {
      console.error('Invalid student data:', result);
      alert('Unable to view details: Invalid student data');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Exam Results Dashboard</h1>
      
      {selectedStudent ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              {selectedStudent.studentId?.name || 'Unknown'}'s Performance
            </h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => setSelectedStudent(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Back to Overview
              </button>
              <button 
                onClick={() => exportStudentReport(selectedStudent)}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Export Report
              </button>
            </div>
          </div>

          <div className="flex border-b mb-4">
            <button
              className={`px-4 py-2 ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'answers' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('answers')}
            >
              Answers
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'analytics' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'cheating' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('cheating')}
            >
              Cheating Logs
            </button>
          </div>

          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Score</h3>
                  <p className="text-3xl font-bold">{selectedStudent.score || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Accuracy</h3>
                  <p className="text-3xl font-bold">
                    {selectedStudent.performanceAnalytics?.accuracy?.toFixed(2) || 0}%
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800">Time Spent</h3>
                  <p className="text-3xl font-bold">
                    {selectedStudent.durationMinutes || 0} mins
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-4 border rounded-lg">
                  <h3 className="font-semibold mb-4">Section Performance</h3>
                  <div className="h-64">
                    {sectionChartData.length > 0 && sectionChartData.every(d => !isNaN(d.accuracy)) ? (
                      <ChartErrorBoundary>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={sectionChartData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="name" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                            <Radar name="Accuracy" dataKey="accuracy" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </ChartErrorBoundary>
                    ) : (
                      <div className="text-center text-gray-500">No section performance data available</div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-4 border rounded-lg">
                  <h3 className="font-semibold mb-4">Strong & Weak Areas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-600">Strong Sections</h4>
                      <ul className="list-disc pl-5 mt-2">
                        {selectedStudent.performanceAnalytics?.strongSections?.map((section, i) => (
                          <li key={i}>{section}</li>
                        )) || <li className="text-gray-500">No strong sections identified</li>}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-red-600">Weak Sections</h4>
                      <ul className="list-disc pl-5 mt-2">
                        {selectedStudent.performanceAnalytics?.weakSections?.map((section, i) => (
                          <li key={i}>{section}</li>
                        )) || <li className="text-gray-500">No weak sections identified</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {selectedStudent.feedback && (
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <h3 className="font-semibold mb-2">Student Feedback</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Mood</p>
                      <p className="font-medium">{selectedStudent.feedback.mood || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Rating</p>
                      <p className="font-medium">
                        {selectedStudent.feedback.rating ? `${selectedStudent.feedback.rating}/5` : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Confidence Level</p>
                      <p className="font-medium">{selectedStudent.feedback.confidenceLevel || 'Not provided'}</p>
                    </div>
                    {selectedStudent.feedback.comments && (
                      <div className="col-span-3">
                        <p className="text-sm text-gray-600">Comments</p>
                        <p className="font-medium">{selectedStudent.feedback.comments}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
{activeTab === 'answers' && (
  <div>
    <h3 className="font-semibold mb-4">Question-wise Answers</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border">Question</th>
            <th className="py-2 px-4 border">Section</th>
            <th className="py-2 px-4 border">Selected</th>
            <th className="py-2 px-4 border">Correct</th>
            <th className="py-2 px-4 border">Time Spent</th>
            <th className="py-2 px-4 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {selectedStudent.answers?.map((answer, index) => {
            // Safely access question data with multiple fallbacks
            const question = answer.questionId || {};
            const questionText = question.questionText 
              ? question.questionText.substring(0, 50) + (question.questionText.length > 50 ? '...' : '')
              : question._id 
                ? `Question ID: ${question._id.toString().substring(0, 8)}...`
                : 'Question data not available';
            
            const correctAnswers = question.correctAnswers 
              ? question.options 
                ? question.correctAnswers.map(opt => 
                    question.options[opt]?.optionText || `Option ${opt}`
                  ).join(', ')
                : question.correctAnswers.join(', ')
              : 'Correct answers not available';
            
            const isCorrect = question.correctAnswers && answer.selectedOptions &&
              JSON.stringify(answer.selectedOptions.sort()) === 
              JSON.stringify(question.correctAnswers.sort());
            
            return (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-2 px-4 border">
                  {questionText}
                </td>
                <td className="py-2 px-4 border">{answer.section || 'Unknown'}</td>
               <td className="py-2 px-4 border">
  {answer.selectedOptions?.length
    ? question.options
      ? answer.selectedOptions.map(opt => 
          question.options[opt]?.optionText || `Option ${opt + 1}`
        ).join(', ')
      : answer.selectedOptions.map(i => `Option ${i + 1}`).join(', ')
    : 'Not attempted'}
</td>

                <td className="py-2 px-4 border">
                  {correctAnswers}
                </td>
                <td className="py-2 px-4 border">
                  {answer.timeSpentSeconds || 0}s
                </td>
                <td className="py-2 px-4 border">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    isCorrect ? 'bg-green-100 text-green-800' : 
                    answer.attemptStatus === 'marked_for_review' ? 'bg-yellow-100 text-yellow-800' :
                    answer.attemptStatus === 'attempted' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {isCorrect ? 'Correct' : 
                     answer.attemptStatus === 'marked_for_review' ? 'Marked for Review' :
                     answer.attemptStatus === 'attempted' ? 'Incorrect' : 'Not Attempted'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
)}

          {activeTab === 'analytics' && (
            <div>
              <h3 className="font-semibold mb-4">Detailed Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Time Management</h4>
                  <div className="h-64">
                    {selectedStudent.answers?.length > 0 ? (
                      <ChartErrorBoundary>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={selectedStudent.answers.map(a => ({
                              name: a.questionId?.text?.substring(0, 20) + (a.questionId?.text?.length > 20 ? '...' : '') || 'Unknown',
                              time: a.timeSpentSeconds || 0
                            }))}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Bar dataKey="time" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartErrorBoundary>
                    ) : (
                      <div className="text-center text-gray-500">No time management data available</div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Attempt Status Distribution</h4>
                  <div className="h-64">
                    {selectedStudent.performanceAnalytics?.correctCount || selectedStudent.performanceAnalytics?.incorrectCount || selectedStudent.totalQuestions ? (
                      <ChartErrorBoundary>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Correct', value: selectedStudent.performanceAnalytics?.correctCount || 0 },
                                { name: 'Incorrect', value: selectedStudent.performanceAnalytics?.incorrectCount || 0 },
                                { name: 'Not Attempted', value: (selectedStudent.totalQuestions || 0) - (selectedStudent.questionsAttempted || 0) }
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {[0, 1, 2].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartErrorBoundary>
                    ) : (
                      <div className="text-center text-gray-500">No attempt status data available</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cheating' && (
            <div>
              <h3 className="font-semibold mb-4">Cheating Detection Logs</h3>
              {selectedStudent.cheatingAttempts > 0 ? (
                <div>
                  <div className="bg-red-50 p-3 rounded-lg mb-4">
                    <p className="text-red-800 font-medium">
                      Total Cheating Attempts: {selectedStudent.cheatingAttempts}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="py-2 px-4 border">Timestamp</th>
                          <th className="py-2 px-4 border">Type</th>
                          <th className="py-2 px-4 border">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudent.cheatingLogs?.map((log, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="py-2 px-4 border">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown'}
                            </td>
                            <td className="py-2 px-4 border capitalize">
                              {log.type?.replace(/_/g, ' ') || 'Unknown'}
                            </td>
                            <td className="py-2 px-4 border">
                              {log.description || 'No additional details'}
                            </td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan="3" className="py-4 text-center text-gray-500">
                              No cheating logs available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-green-800">No cheating attempts detected for this student.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Overall Exam Statistics</h2>
              <button 
                onClick={exportToExcel}
                className="bg-green-600 text-white px-4 py-2 rounded flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to Excel
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-600">Average Score</p>
                <p className="text-2xl font-bold">{overallStats.averageScore.toFixed(2)}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-600">Highest Score</p>
                <p className="text-2xl font-bold">{overallStats.highestScore}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-600">Lowest Score</p>
                <p className="text-2xl font-bold">{overallStats.lowestScore}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-sm text-purple-600">Average Accuracy</p>
                <p className="text-2xl font-bold">{overallStats.averageAccuracy.toFixed(2)}%</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-600">Cheating Attempts</p>
                <p className="text-2xl font-bold">{overallStats.totalCheatingAttempts}</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg">
                <p className="text-sm text-indigo-600">Submission Rate</p>
                <p className="text-2xl font-bold">{overallStats.submissionRate}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-4 border rounded-lg">
                <h3 className="font-semibold mb-4">Score Distribution</h3>
                <div className="h-64">
                  {scoreDistribution.some(d => d.count > 0) ? (
                    <ChartErrorBoundary>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scoreDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartErrorBoundary>
                  ) : (
                    <div className="text-center text-gray-500">No score distribution data available</div>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 border rounded-lg">
                <h3 className="font-semibold mb-4">Section-wise Performance</h3>
                <div className="h-64">
                  {sectionChartData.length > 0 && sectionChartData.every(d => !isNaN(d.accuracy)) ? (
                    <ChartErrorBoundary>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sectionChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="accuracy" fill="#8884d8" name="Accuracy (%)" />
                          <Bar dataKey="averageTime" fill="#82ca9d" name="Avg Time (s)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartErrorBoundary>
                  ) : (
                    <div className="text-center text-gray-500">No section performance data available</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Student Results</h2>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Search students..."
                  className="border rounded px-3 py-2 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select 
                  className="border rounded px-3 py-2 text-sm"
                  value={sortConfig.key}
                  onChange={(e) => handleSort(e.target.value)}
                >
                  <option value="score">Sort by Score</option>
                  <option value="submittedAt">Sort by Submission Time</option>
                  <option value="studentId.name">Sort by Name</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th 
                      className="py-3 px-4 border cursor-pointer"
                      onClick={() => handleSort('studentId.name')}
                    >
                      Student Name {sortConfig.key === 'studentId.name' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="py-3 px-4 border cursor-pointer"
                      onClick={() => handleSort('score')}
                    >
                      Score {sortConfig.key === 'score' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="py-3 px-4 border">Accuracy</th>
                    <th className="py-3 px-4 border">Time Spent</th>
                    <th className="py-3 px-4 border">Cheating Attempts</th>
                    <th 
                      className="py-3 px-4 border cursor-pointer"
                      onClick={() => handleSort('submittedAt')}
                    >
                      Submitted At {sortConfig.key === 'submittedAt' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="py-3 px-4 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentResults.length > 0 ? (
                    currentResults.map((result, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-3 px-4 border">
                          {result.studentId?.name || 'Unknown'}
                          <p className="text-xs text-gray-500">{result.studentId?.email || 'Unknown'}</p>
                        </td>
                        <td className="py-3 px-4 border font-medium">
                          {result.score || 0}
                        </td>
                        <td className="py-3 px-4 border">
                          {result.performanceAnalytics?.accuracy?.toFixed(2) || 0}%
                        </td>
                        <td className="py-3 px-4 border">
                          {result.durationMinutes || 0} mins
                        </td>
                        <td className="py-3 px-4 border">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                            result.cheatingAttempts > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {result.cheatingAttempts || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 border">
                          {result.submittedAt ? new Date(result.submittedAt).toLocaleString() : 'Not submitted'}
                        </td>
                        <td className="py-3 px-4 border">
                          <button
                            onClick={() => trackViewDetails(result)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-4 text-center text-gray-500">
                        No results found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredResults.length > resultsPerPage && (
              <div className="flex justify-between items-center mt-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Showing {indexOfFirstResult + 1} to {Math.min(indexOfLastResult, filteredResults.length)} of {filteredResults.length} results
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400'}`}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400'}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Results;