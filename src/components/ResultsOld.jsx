import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Download, ChevronDown, ChevronUp, AlertTriangle, Clock, Award,
  CheckCircle, XCircle, HelpCircle, Filter, Calendar, User
} from 'lucide-react';
import axiosInstance from '../utils/api';

const Results = () => {
  const { examId } = useParams();
  const [results, setResults] = useState([]);
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAttempt, setExpandedAttempt] = useState(null);
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [dashboardView, setDashboardView] = useState('summary');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    minScore: 0,
    maxScore: 100,
    hasCheatingAttempts: false,
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const sections = ['Physics', 'Chemistry', 'Math'];

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/studentAnswers/results/${examId}`);
        setResults(response.data.attempts || []);
        
        const examResponse = await axiosInstance.get(`/exams/${examId}`);
        setExamData(examResponse.data.exam);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to load results');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId]);

  const toggleAttemptDetails = (attemptId) => {
    setExpandedAttempt(expandedAttempt === attemptId ? null : attemptId);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const filteredResults = [...results]
    .filter(result => {
      const searchMatch = !searchTerm || 
        (result.studentId?.name && result.studentId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (result.studentId?.email && result.studentId.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const scoreMatch = (result.score >= filterOptions.minScore && result.score <= filterOptions.maxScore);
      
      const cheatingMatch = !filterOptions.hasCheatingAttempts || 
        (result.cheatingAttempts && result.cheatingAttempts > 0);
      
      return searchMatch && scoreMatch && cheatingMatch;
    });

  const sortedResults = filteredResults.sort((a, b) => {
    let compareA, compareB;
    
    switch (sortBy) {
      case 'name':
        compareA = a.studentId?.name || '';
        compareB = b.studentId?.name || '';
        break;
      case 'email':
        compareA = a.studentId?.email || '';
        compareB = b.studentId?.email || '';
        break;
      case 'timeSpent':
        compareA = a.answers?.reduce((sum, ans) => sum + (ans.timeSpentSeconds || 0), 0) || 0;
        compareB = b.answers?.reduce((sum, ans) => sum + (ans.timeSpentSeconds || 0), 0) || 0;
        break;
      case 'cheatingAttempts':
        compareA = a.cheatingAttempts || 0;
        compareB = b.cheatingAttempts || 0;
        break;
      case 'questionsAttempted':
        compareA = a.questionsAttempted || 0;
        compareB = b.questionsAttempted || 0;
        break;
      case 'score':
      default:
        compareA = a.score || 0;
        compareB = b.score || 0;
        break;
    }
    
    if (sortOrder === 'asc') {
      return compareA > compareB ? 1 : -1;
    } else {
      return compareA < compareB ? 1 : -1;
    }
  });

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateQuestionStats = (attempt) => {
    if (!attempt.answers || !attempt.answers.length) return {};
    
    const correct = attempt.answers.filter(ans => {
      const question = ans.questionId;
      if (!question || !question.correctAnswers) return false;
      
      const selected = [...(ans.selectedOptions || [])].sort().join(',');
      const correct = [...(question.correctAnswers || [])].sort().join(',');
      return selected === correct;
    }).length;
    
    const incorrect = attempt.answers.filter(ans => {
      const question = ans.questionId;
      if (!question || !question.correctAnswers) return false;
      
      if (ans.selectedOptions && ans.selectedOptions.length > 0) {
        const selected = [...(ans.selectedOptions || [])].sort().join(',');
        const correct = [...(question.correctAnswers || [])].sort().join(',');
        return selected !== correct;
      }
      return false;
    }).length;
    
    const skipped = attempt.totalQuestions - (correct + incorrect);
    
    return { correct, incorrect, skipped };
  };

  const getSelectedOptionText = (answer) => {
    if (!answer.questionId || !answer.questionId.options || !answer.selectedOptions) {
      return 'N/A';
    }
    
    return answer.selectedOptions.map(index => {
      const option = answer.questionId.options[index];
      return option ? `${index + 1}. ${option.optionText}` : `Option ${index + 1}`;
    }).join(', ');
  };

  const getCorrectOptionText = (question) => {
    if (!question || !question.options || !question.correctAnswers) {
      return 'N/A';
    }
    
    return question.correctAnswers.map(index => {
      const option = question.options[index];
      return option ? `${index + 1}. ${option.optionText}` : `Option ${index + 1}`;
    }).join(', ');
  };

  const getDifficultyBadgeStyles = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      case 'none':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const prepareScoreDistributionData = () => {
    const buckets = {
      '0-20': { name: '0-20%', count: 0 },
      '21-40': { name: '21-40%', count: 0 },
      '41-60': { name: '41-60%', count: 0 },
      '61-80': { name: '61-80%', count: 0 },
      '81-100': { name: '81-100%', count: 0 }
    };
    
    results.forEach(result => {
      const score = result.score || 0;
      if (score <= 20) buckets['0-20'].count++;
      else if (score <= 40) buckets['21-40'].count++;
      else if (score <= 60) buckets['41-60'].count++;
      else if (score <= 80) buckets['61-80'].count++;
      else buckets['81-100'].count++;
    });
    
    return Object.values(buckets);
  };

  const prepareQuestionDifficultyData = () => {
    const difficultyData = {
      easy: { name: 'Easy', correct: 0, incorrect: 0, skipped: 0, total: 0 },
      medium: { name: 'Medium', correct: 0, incorrect: 0, skipped: 0, total: 0 },
      hard: { name: 'Hard', correct: 0, incorrect: 0, skipped: 0, total: 0 },
      none: { name: 'Unspecified', correct: 0, incorrect: 0, skipped: 0, total: 0 }
    };
    
    results.forEach(attempt => {
      attempt.answers?.forEach(ans => {
        const question = ans.questionId;
        if (!question) return;
        
        const difficulty = (question.difficulty || 'none').toLowerCase();
        
        if (!difficultyData[difficulty]) {
          difficultyData[difficulty] = { name: question.difficulty, correct: 0, incorrect: 0, skipped: 0, total: 0 };
        }
        
        difficultyData[difficulty].total++;
        
        if (!ans.selectedOptions || ans.selectedOptions.length === 0) {
          difficultyData[difficulty].skipped++;
        } else {
          const selected = [...(ans.selectedOptions || [])].sort().join(',');
          const correct = [...(question.correctAnswers || [])].sort().join(',');
          
          if (selected === correct) {
            difficultyData[difficulty].correct++;
          } else {
            difficultyData[difficulty].incorrect++;
          }
        }
      });
    });
    
    return Object.values(difficultyData).filter(d => d.total > 0);
  };

  const prepareTimeSpentData = () => {
    return sortedResults.slice(0, 10).map(attempt => {
      const totalTimeSpent = attempt.answers?.reduce((sum, ans) => sum + (ans.timeSpentSeconds || 0), 0) || 0;
      return {
        name: attempt.studentId?.name?.split(' ')[0] || `Student ${attempt._id.slice(-4)}`,
        timeSpent: Math.round(totalTimeSpent / 60),
        score: attempt.score || 0
      };
    });
  };

  const prepareCheatingAttemptsData = () => {
    const withCheating = results.filter(r => r.cheatingAttempts && r.cheatingAttempts > 0).length;
    const withoutCheating = results.length - withCheating;
    
    return [
      { name: 'No Cheating', value: withoutCheating },
      { name: 'Cheating Detected', value: withCheating }
    ];
  };

  const prepareQuestionPerformanceData = () => {
    const questionPerformance = {};
    
    results.forEach(attempt => {
      attempt.answers?.forEach((ans, idx) => {
        const question = ans.questionId;
        if (!question) return;
        
        const qKey = `Q${idx + 1}`;
        if (!questionPerformance[qKey]) {
          questionPerformance[qKey] = { name: qKey, correct: 0, incorrect: 0, skipped: 0, total: 0 };
        }
        
        questionPerformance[qKey].total++;
        
        if (!ans.selectedOptions || ans.selectedOptions.length === 0) {
          questionPerformance[qKey].skipped++;
        } else {
          const selected = [...(ans.selectedOptions || [])].sort().join(',');
          const correct = [...(question.correctAnswers || [])].sort().join(',');
          
          if (selected === correct) {
            questionPerformance[qKey].correct++;
          } else {
            questionPerformance[qKey].incorrect++;
          }
        }
      });
    });
    
    return Object.values(questionPerformance);
  };

  const generateOverallStats = () => {
    if (!results.length) return {};
    
    const totalStudents = results.length;
    const scores = results.map(r => r.score || 0);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / totalStudents;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / totalStudents;
    const stdDev = Math.sqrt(variance);
    
    const sortedScores = [...scores].sort((a, b) => a - b);
    const midpoint = Math.floor(sortedScores.length / 2);
    const median = sortedScores.length % 2 === 0
      ? (sortedScores[midpoint - 1] + sortedScores[midpoint]) / 2
      : sortedScores[midpoint];
    
    const passRate = scores.filter(score => score >= 40).length / totalStudents * 100;
    const excellenceRate = scores.filter(score => score >= 80).length / totalStudents * 100;
    
    return {
      avgScore,
      maxScore,
      minScore,
      stdDev,
      median,
      passRate,
      excellenceRate
    };
  };

  const FilterModal = () => (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center ${showFilterModal ? '' : 'hidden'}`}>
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Filter Results</h3>
          <button onClick={() => setShowFilterModal(false)} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Score Range</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="100"
                value={filterOptions.minScore}
                onChange={(e) => setFilterOptions({...filterOptions, minScore: Number(e.target.value)})}
                className="w-20 p-2 border rounded"
              />
              <span>to</span>
              <input
                type="number"
                min="0"
                max="100"
                value={filterOptions.maxScore}
                onChange={(e) => setFilterOptions({...filterOptions, maxScore: Number(e.target.value)})}
                className="w-20 p-2 border rounded"
              />
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="cheatingFilter"
              checked={filterOptions.hasCheatingAttempts}
              onChange={(e) => setFilterOptions({...filterOptions, hasCheatingAttempts: e.target.checked})}
              className="h-4 w-4 text-indigo-600 rounded"
            />
            <label htmlFor="cheatingFilter" className="ml-2 text-sm text-gray-700">
              Show only students with cheating attempts
            </label>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => {
              setFilterOptions({
                minScore: 0,
                maxScore: 100,
                hasCheatingAttempts: false
              });
            }}
            className="px-4 py-2 text-sm border rounded text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={() => setShowFilterModal(false)}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading exam results...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch the data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md max-w-lg mx-auto mt-20 text-center">
        <div className="inline-flex h-16 w-16 rounded-full bg-red-100 p-3 text-red-500 mb-4">
          <AlertTriangle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Results</h2>
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <p className="text-gray-600 mb-6">There was a problem fetching the exam results. Please try again or contact support if the issue persists.</p>
        <button 
          onClick={() => window.location.reload()}
          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md max-w-lg mx-auto mt-20 text-center">
        <div className="inline-flex h-16 w-16 rounded-full bg-blue-100 p-3 text-blue-500 mb-4">
          <HelpCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">No Results Found</h2>
        <p className="text-gray-600 mb-6">There are no submissions for this exam yet. Check back later when students have completed the assessment.</p>
        <Link 
          to="/admin-dashboard/exam"
          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-block font-medium"
        >
          Back to Exams
        </Link>
      </div>
    );
  }

  const stats = generateOverallStats();

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <FilterModal />
      
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-8 px-4 shadow-md">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Award className="mr-2" size={28} />
                Exam Results Dashboard
              </h1>
              {examData && (
                <div className="mt-2">
                  <h2 className="text-xl font-medium">{examData.title}</h2>
                  <div className="flex items-center mt-1 text-indigo-100">
                    <Calendar className="mr-1" size={14} />
                    <span className="mr-4 text-sm">{new Date(examData.createdAt).toLocaleDateString()}</span>
                    <User className="mr-1" size={14} />
                    <span className="text-sm">{results.length} Submissions</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Link 
                to="/admin-dashboard/exam"
                className="px-4 py-2 bg-white bg-opacity-20 text-white rounded hover:bg-opacity-30 transition-colors flex items-center"
              >
                Back to Exams
              </Link>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white text-indigo-700 rounded hover:bg-indigo-100 transition-colors flex items-center font-medium"
              >
                <Download className="mr-1" size={16} />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto max-w-7xl px-4 mt-6">
        <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex space-x-1">
            <button
              onClick={() => setDashboardView('summary')}
              className={`px-4 py-2 rounded ${dashboardView === 'summary' 
                ? 'bg-indigo-100 text-indigo-700 font-medium' 
                : 'hover:bg-gray-100'}`}
            >
              Summary
            </button>
            <button
              onClick={() => setDashboardView('detailed')}
              className={`px-4 py-2 rounded ${dashboardView === 'detailed' 
                ? 'bg-indigo-100 text-indigo-700 font-medium' 
                : 'hover:bg-gray-100'}`}
            >
              Detailed Results
            </button>
            <button
              onClick={() => setDashboardView('charts')}
              className={`px-4 py-2 rounded ${dashboardView === 'charts' 
                ? 'bg-indigo-100 text-indigo-700 font-medium' 
                : 'hover:bg-gray-100'}`}
            >
              Analytics
            </button>
          </div>
          
          <div className="flex w-full sm:w-auto space-x-2">
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 border rounded w-full"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <button
              onClick={() => setShowFilterModal(true)}
              className="px-3 py-2 border rounded hover:bg-gray-50 flex items-center whitespace-nowrap"
            >
              <Filter size={16} className="mr-1" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {dashboardView === 'summary' && (
        <div className="container mx-auto max-w-7xl px-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-indigo-500">
              <h3 className="text-gray-500 font-medium mb-1 text-sm">Average Score</h3>
              <div className="flex items-end">
                <p className="text-3xl font-bold text-indigo-600">{stats.avgScore.toFixed(1)}</p>
                <p className="text-gray-400 ml-1 mb-1">/ 100</p>
              </div>
              <div className="flex items-center mt-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  stats.avgScore >= 70 ? 'bg-green-100 text-green-800' : 
                  stats.avgScore >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'}`}
                >
                  {stats.avgScore >= 70 ? 'Excellent' : stats.avgScore >= 40 ? 'Satisfactory' : 'Needs Improvement'}
                </span>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-green-500">
              <h3 className="text-gray-500 font-medium mb-1 text-sm">Highest Score</h3>
              <div className="flex items-end">
                <p className="text-3xl font-bold text-green-600">{stats.maxScore}</p>
                <p className="text-gray-400 ml-1 mb-1">/ 100</p>
              </div>
              <div className="flex items-center mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Top Performer
                </span>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-red-500">
              <h3 className="text-gray-500 font-medium mb-1 text-sm">Pass Rate</h3>
              <div className="flex items-end">
                <p className="text-3xl font-bold text-blue-600">{stats.passRate.toFixed(1)}%</p>
              </div>
              <div className="flex items-center mt-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  stats.passRate >= 80 ? 'bg-green-100 text-green-800' : 
                  stats.passRate >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'}`}
                >
                  {stats.passRate >= 80 ? 'Excellent' : stats.passRate >= 50 ? 'Average' : 'Below Average'}
                </span>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-yellow-500">
              <h3 className="text-gray-500 font-medium mb-1 text-sm">Excellence Rate</h3>
              <div className="flex items-end">
                <p className="text-3xl font-bold text-yellow-600">{stats.excellenceRate.toFixed(1)}%</p>
              </div>
              <div className="flex items-center mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Above 80% Score
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-bold mb-4">Score Distribution</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={prepareScoreDistributionData()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} students`, "Count"]} />
                  <Legend />
                  <Bar dataKey="count" name="Number of Students" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-bold mb-4">Top Performers</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedResults.slice(0, 5).map((attempt, index) => {
                    const stats = calculateQuestionStats(attempt);
                    const totalTimeSpent = attempt.answers?.reduce((sum, ans) => sum + (ans.timeSpentSeconds || 0), 0) || 0;
                    
                    return (
                      <tr key={attempt._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-200 text-gray-800' :
                            index === 2 ? 'bg-amber-100 text-amber-800' :
                            'bg-white border text-gray-500'
                          } font-bold`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-9 w-9 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                              {(attempt.studentId?.name?.charAt(0) || 'U').toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {attempt.studentId?.name || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {attempt.studentId?.email || 'No email'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{attempt.score || 0}/100</div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${attempt.score || 0}%` }}></div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock size={14} className="mr-1 text-gray-400" />
                            {formatTime(totalTimeSpent)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex space-x-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              {stats.correct || 0} <CheckCircle size={12} className="ml-1" />
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              {stats.incorrect || 0} <XCircle size={12} className="ml-1" />
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {stats.skipped || 0} <HelpCircle size={12} className="ml-1" />
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4">Cheating Attempts Overview</h2>
              <div className="h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareCheatingAttemptsData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {prepareCheatingAttemptsData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#EF4444'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} students`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4">Time vs Score Correlation</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={prepareTimeSpentData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" label={{ value: 'Time (minutes)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Score', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="timeSpent" name="Time Spent (mins)" stroke="#4F46E5" activeDot={{ r: 8 }} />
                    <Line yAxisId="right" type="monotone" dataKey="score" name="Score" stroke="#10B981" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {dashboardView === 'detailed' && (
        <div className="container mx-auto max-w-7xl px-4 mt-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Student 
                        {sortBy === 'name' && (
                          <span className="ml-1">{sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center">
                        Email
                        {sortBy === 'email' && (
                          <span className="ml-1">{sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('score')}
                    >
                      <div className="flex items-center">
                        Score
                        {sortBy === 'score' && (
                          <span className="ml-1">{sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('questionsAttempted')}
                    >
                      <div className="flex items-center">
                        Questions
                        {sortBy === 'questionsAttempted' && (
                          <span className="ml-1">{sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('timeSpent')}
                    >
                      <div className="flex items-center">
                        Time
                        {sortBy === 'timeSpent' && (
                          <span className="ml-1">{sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('cheatingAttempts')}
                    >
                      <div className="flex items-center">
                        Cheating
                        {sortBy === 'cheatingAttempts' && (
                          <span className="ml-1">{sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedResults.map((attempt, index) => {
                    const stats = calculateQuestionStats(attempt);
                    const totalTimeSpent = attempt.answers?.reduce((sum, ans) => sum + (ans.timeSpentSeconds || 0), 0) || 0;
                    
                    return (
                      <React.Fragment key={attempt._id}>
                        <tr className={`hover:bg-gray-50 ${expandedAttempt === attempt._id ? 'bg-indigo-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-200 text-gray-800' :
                              index === 2 ? 'bg-amber-100 text-amber-800' :
                              'bg-white border text-gray-500'
                            } font-bold text-xs`}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                                {(attempt.studentId?.name?.charAt(0) || 'U').toUpperCase()}
                              </div>
                              <div className="ml-3 text-sm font-medium text-gray-900">
                                {attempt.studentId?.name || 'Unknown'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {attempt.studentId?.email || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {attempt.score || 0}
                              <div className="w-16 bg-gray-200 rounded-full h-1.5 ml-2">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    (attempt.score || 0) >= 70 ? 'bg-green-600' : 
                                    (attempt.score || 0) >= 40 ? 'bg-yellow-500' : 
                                    'bg-red-500'
                                  }`} 
                                  style={{ width: `${attempt.score || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                {stats.correct || 0} <CheckCircle size={10} className="ml-1" />
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                {stats.incorrect || 0} <XCircle size={10} className="ml-1" />
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {stats.skipped || 0} <HelpCircle size={10} className="ml-1" />
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock size={14} className="mr-1 text-gray-400" />
                              {formatTime(totalTimeSpent)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {attempt.cheatingAttempts > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                {attempt.cheatingAttempts} <AlertTriangle size={10} className="ml-1" />
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">0</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => toggleAttemptDetails(attempt._id)}
                              className={`px-3 py-1 rounded border ${
                                expandedAttempt === attempt._id 
                                  ? 'bg-indigo-100 text-indigo-700 border-indigo-300' 
                                  : 'text-indigo-600 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {expandedAttempt === attempt._id ? 'Hide Details' : 'View Details'}
                            </button>
                          </td>
                        </tr>
                        {expandedAttempt === attempt._id && (
                          <tr>
                            <td colSpan="8" className="px-6 py-6 bg-gray-50">
                              <div className="space-y-4">
                                <div className="flex flex-wrap gap-4 mb-4">
                                  <div className="bg-white p-3 rounded shadow-sm">
                                    <h4 className="font-semibold text-sm text-gray-500">Started at</h4>
                                    <p className="font-medium">{new Date(attempt.startedAt).toLocaleString()}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded shadow-sm">
                                    <h4 className="font-semibold text-sm text-gray-500">Submitted at</h4>
                                    <p className="font-medium">{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : 'Not submitted'}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded shadow-sm">
                                    <h4 className="font-semibold text-sm text-gray-500">Total Time</h4>
                                    <p className="font-medium">{formatTime(totalTimeSpent)}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded shadow-sm">
                                    <h4 className="font-semibold text-sm text-gray-500">Final Score</h4>
                                    <p className="font-medium">{attempt.score || 0}/100</p>
                                  </div>
                                </div>
                                
                                {attempt.cheatingLogs && attempt.cheatingLogs.length > 0 && (
                                  <div className="mb-4">
                                    <h3 className="font-semibold text-red-600 flex items-center mb-2">
                                      <AlertTriangle size={16} className="mr-1" />
                                      Cheating Attempts Detected:
                                    </h3>
                                    <div className="bg-red-50 p-4 rounded border border-red-200">
                                      <ul className="list-disc list-inside space-y-1">
                                        {attempt.cheatingLogs.map((log, idx) => (
                                          <li key={idx} className="text-sm text-red-800">
                                            <span className="font-medium">{new Date(log.timestamp).toLocaleTimeString()}</span>: {log.type} - {log.description}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                                
                                <h3 className="font-semibold mb-2 text-gray-700 flex items-center">
                                  <CheckCircle size={16} className="mr-1 text-indigo-500" />
                                  Answers Analysis:
                                </h3>
                                <div className="space-y-6">
                                  {sections.map((section) => {
                                    const sectionAnswers = attempt.answers?.filter(ans => ans.questionId?.section === section) || [];
                                    if (sectionAnswers.length === 0) return null;
                                    
                                    return (
                                      <div key={section} className="border-t pt-4">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-3">{section}</h4>
                                        <div className="space-y-3">
                                          {sectionAnswers.map((answer, idx) => {
                                            const question = answer.questionId;
                                            if (!question) return null;
                                            
                                            const selected = [...(answer.selectedOptions || [])].sort().join(',');
                                            const correct = [...(question.correctAnswers || [])].sort().join(',');
                                            const isCorrect = selected === correct;
                                            const isSkipped = !answer.selectedOptions || answer.selectedOptions.length === 0;
                                            
                                            return (
                                              <div 
                                                key={idx} 
                                                className={`p-4 rounded-lg border ${
                                                  isSkipped
                                                    ? 'bg-gray-50 border-gray-200' 
                                                    : isCorrect 
                                                      ? 'bg-green-50 border-green-200' 
                                                      : 'bg-red-50 border-red-200'
                                                }`}
                                              >
                                                <div className="flex justify-between items-start mb-2">
                                                  <h5 className="font-medium flex items-start">
                                                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full mr-2 ${
                                                      isSkipped ? 'bg-gray-200 text-gray-700' :
                                                      isCorrect ? 'bg-green-200 text-green-800' :
                                                      'bg-red-200 text-red-800'
                                                    } text-xs font-bold`}>
                                                      {idx + 1}
                                                    </span>
                                                    {question.questionText}
                                                  </h5>
                                                  <div className="text-sm">
                                                    {answer.timeSpentSeconds > 0 && (
                                                      <span className="inline-block mr-2 text-gray-500 flex items-center">
                                                        <Clock size={14} className="mr-1" />
                                                        {formatTime(answer.timeSpentSeconds)}
                                                      </span>
                                                    )}
                                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                                      answer.attemptStatus === 'not_attempted' ? 'bg-gray-100 text-gray-800' :
                                                      answer.attemptStatus === 'marked_for_review' ? 'bg-yellow-100 text-yellow-800' :
                                                      'bg-blue-100 text-blue-800'
                                                    }`}>
                                                      {answer.attemptStatus === 'not_attempted' ? 'Not attempted' :
                                                       answer.attemptStatus === 'marked_for_review' ? 'Marked for review' :
                                                       'Attempted'}
                                                    </span>
                                                  </div>
                                                </div>
                                                
                                                <div className="mt-3 space-y-2">
                                                  <div className="flex flex-col sm:flex-row gap-4">
                                                    <div className="flex-1 p-3 bg-white rounded border">
                                                      <p className="text-sm font-medium text-gray-700">Student's Answer:</p>
                                                      <p className="text-sm mt-1">
                                                        {answer.selectedOptions && answer.selectedOptions.length > 0 
                                                          ? getSelectedOptionText(answer)
                                                          : <span className="italic text-gray-500">No answer provided</span>
                                                        }
                                                      </p>
                                                    </div>
                                                    <div className="flex-1 p-3 bg-white rounded border">
                                                      <p className="text-sm font-medium text-gray-700">Correct Answer:</p>
                                                      <p className="text-sm mt-1">{getCorrectOptionText(question)}</p>
                                                    </div>
                                                  </div>
                                                  
                                                  {question.explanation && (
                                                    <div className="text-sm mt-2 bg-blue-50 p-3 rounded border border-blue-100">
                                                      <span className="font-medium block mb-1 text-blue-700">Explanation:</span>
                                                      <p className="text-gray-700">{question.explanation}</p>
                                                    </div>
                                                  )}
                                                  
                                                  <div className="flex flex-wrap gap-2 mt-2">
                                                    {question.difficulty && (
                                                      <div>
                                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getDifficultyBadgeStyles(question.difficulty)}`}>
                                                          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                                                        </span>
                                                      </div>
                                                    )}
                                                    
                                                    {question.tags && question.tags.length > 0 && question.tags.map((tag, tagIdx) => (
                                                      <span
                                                        key={tagIdx}
                                                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded"
                                                      >
                                                        {tag}
                                                      </span>
                                                    ))}
                                                    
                                                    <span className="inline-block text-xs px-2 py-0.5 rounded ml-auto">
                                                      {isCorrect 
                                                        ? <span className="text-green-700">{`+${question.marks || 1} marks`}</span>
                                                        : isSkipped 
                                                          ? <span className="text-gray-500">0 marks (not attempted)</span>
                                                          : <span className="text-red-700">{`-${question.negativeMarks || 0} marks (negative marking)`}</span>
                                                      }
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {dashboardView === 'charts' && (
        <div className="container mx-auto max-w-7xl px-4 mt-6">
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-bold mb-4">Question Performance Analysis</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={prepareQuestionPerformanceData()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  barGap={0}
                  barCategoryGap="15%"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="correct" name="Correct Answers" stackId="a" fill="#10B981" />
                  <Bar dataKey="incorrect" name="Incorrect Answers" stackId="a" fill="#EF4444" />
                  <Bar dataKey="skipped" name="Skipped" stackId="a" fill="#9CA3AF" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-bold mb-4">Difficulty Analysis</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={prepareQuestionDifficultyData()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  barGap={0}
                  barCategoryGap="15%"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="correct" name="Correct Answers" fill="#10B981" />
                  <Bar dataKey="incorrect" name="Incorrect Answers" fill="#EF4444" />
                  <Bar dataKey="skipped" name="Skipped" fill="#9CA3AF" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4">Time Spent vs. Score</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={prepareTimeSpentData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" label={{ value: 'Time (minutes)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Score', angle: 90, position: 'insideRight' }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="timeSpent" name="Time Spent (mins)" stroke="#4F46E5" activeDot={{ r: 8 }} />
                    <Line yAxisId="right" type="monotone" dataKey="score" name="Score" stroke="#10B981" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-right">
                <button
                  onClick={() => {
                    const data = prepareTimeSpentData();
                    const csv = [
                      'Student,Time Spent (mins),Score',
                      ...data.map(row => `${row.name},${row.timeSpent},${row.score}`)
                    ].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'time_vs_score.csv';
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center"
                >
                  <Download size={16} className="mr-1" />
                  Export Chart Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;