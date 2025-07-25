import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/api';
import { format } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Trophy, Clock, Target, TrendingUp, BookOpen, AlertCircle, 
  CheckCircle, XCircle, Star, MessageSquare, ThumbsUp, Brain, 
  BarChart3, PieChart as PieChartIcon, Activity, Calendar,
  ArrowLeft, Eye, FileText, Shield, Lightbulb, Timer,
  ChevronRight
} from 'lucide-react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// Backend base URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Function to render LaTeX or plain text
const renderMathOrText = (text) => {
  if (!text) return null;
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
  return parts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      return <BlockMath key={index} math={part.slice(2, -2)} />;
    } else if (part.startsWith('$') && part.endsWith('$')) {
      return <InlineMath key={index} math={part.slice(1, -1)} />;
    } else {
      return <span key={index}>{part}</span>;
    }
  });
};

const MyResult = () => {
  const [exams, setExams] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [attemptStatus, setAttemptStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState({ mood: '', comments: '', rating: null, confidenceLevel: null });
  const [expandedQuestions, setExpandedQuestions] = useState({}); // Track expanded question text

  // Fetch exams and attempts
  useEffect(() => {
    const fetchExamsAndAttempts = async () => {
      try {
        setLoading(true);
        const upcomingResponse = await axiosInstance.get('/exams/upcoming');
        const upcomingExams = upcomingResponse.data.success ? upcomingResponse.data.exams : [];
        console.log('Upcoming Exams:', upcomingExams);

        const attemptsResponse = await axiosInstance.get('/studentAnswers/my-attempts');
        const attemptedExams = attemptsResponse.data.success
          ? attemptsResponse.data.attempts
              .filter(attempt => attempt.isSubmitted && attempt.examId && attempt.examId._id)
              .map(attempt => attempt.examId)
          : [];
        console.log('Attempted Exams:', attemptedExams);

        const allExams = [
          ...attemptedExams,
          ...upcomingExams.filter(
            exam => exam && exam._id && !attemptedExams.some(a => a._id.toString() === exam._id.toString())
          ),
        ].filter(exam => exam && exam._id);
        console.log('All Exams:', allExams);
        setExams(allExams);

        const statusMap = {};
        for (const exam of allExams) {
          try {
            const response = await axiosInstance.get(`/studentAnswers/check/${exam._id}`);
            if (response.data.success) {
              statusMap[exam._id] = response.data.hasAttempted;
            }
          } catch (err) {
            console.error(`Error checking exam ${exam._id}:`, err.message);
          }
        }
        setAttemptStatus(statusMap);
      } catch (err) {
        setError('Error fetching exams or attempts: ' + err.message);
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExamsAndAttempts();
  }, []);

  // Fetch detailed attempt data
  const handleShowResult = async (examId) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/studentAnswers/attempt/${examId}`);
      if (response.data.success) {
        const attempt = response.data.attempt;
        
        // Ensure analytics data exists
        const analytics = attempt.performanceAnalytics || {};
        
        // Calculate correct/incorrect counts if not present
        if (!analytics.correctCount || !analytics.incorrectCount) {
          let correct = 0;
          let incorrect = 0;
          
          attempt.answers.forEach(answer => {
            const question = answer.questionId;
            if (!question) return;
            
            if (question.questionType === 'multipleChoice') {
              const selected = (answer.selectedOptions || []).sort().join(',');
              const correctAnswers = (question.correctAnswers || []).sort().join('');
              
              if (answer.attemptStatus === 'attempted' || answer.attemptStatus === 'marked_for_review') {
                if (selected === correctAnswers && selected !== '') {
                  correct++;
                } else if (answer.selectedOptions.length > 0) {
                  incorrect++;
                }
              }
            } else if (question.questionType === 'numerical') {
              if (answer.attemptStatus === 'attempted' || answer.attemptStatus === 'marked_for_review') {
                if (answer.numericalAnswer !== null && answer.numericalAnswer === question.correctAnswers?.[0]) {
                  correct++;
                } else if (answer.numericalAnswer !== null) {
                  incorrect++;
                }
              }
            }
          });
          
          analytics.correctCount = correct;
          analytics.incorrectCount = incorrect;
          analytics.accuracy = attempt.answers.length > 0 
            ? (correct / attempt.answers.length) * 100 
            : 0;
        }
        
        setSelectedAttempt({
          ...attempt,
          performanceAnalytics: analytics
        });
        
        setFeedback({
          mood: attempt.feedback?.mood || '',
          comments: attempt.feedback?.comments || '',
          rating: attempt.feedback?.rating || null,
          confidenceLevel: attempt.feedback?.confidenceLevel || null,
        });
      }
    } catch (err) {
      setError('Error fetching attempt details: ' + err.message);
      console.error('Error in handleShowResult:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAttempt?.examId?._id) {
      setError('Cannot submit feedback: Invalid exam ID');
      return;
    }
    try {
      setLoading(true);
      const response = await axiosInstance.post(
        `/studentAnswers/feedback/${selectedAttempt.examId._id}`, 
        feedback
      );
      if (response.data.success) {
        setSelectedAttempt({
          ...selectedAttempt,
          feedback: {
            mood: feedback.mood,
            comments: feedback.comments,
            rating: feedback.rating,
            confidenceLevel: feedback.confidenceLevel,
            timestamp: new Date(),
          },
        });
        setFeedback({ mood: '', comments: '', rating: null, confidenceLevel: null });
        setError(null);
      } else {
        setError('Failed to submit feedback');
      }
    } catch (err) {
      setError('Error submitting feedback: ' + err.message);
      console.error('Feedback submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render feedback stars
  const renderStars = (rating, interactive = false) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={interactive ? () => setFeedback({ ...feedback, rating: i + 1 }) : null}
        />
      ));
  };

  // Check if feedback has been submitted
  const isFeedbackSubmitted = selectedAttempt?.feedback && (
    selectedAttempt.feedback.mood ||
    selectedAttempt.feedback.comments ||
    selectedAttempt.feedback.rating ||
    selectedAttempt.feedback.confidenceLevel
  );

  // Format sections display with fallback
  const formatSections = (sections) => {
    if (!sections || sections.length === 0) return 'None';
    return sections.join(', ');
  };

  // Generate chart data
  const generateChartData = () => {
    if (!selectedAttempt) return null;

    const correct = selectedAttempt.performanceAnalytics?.correctCount || 0;
    const incorrect = selectedAttempt.performanceAnalytics?.incorrectCount || 0;
    const unattempted = selectedAttempt.totalQuestions - (correct + incorrect);

    return {
      pieData: [
        { name: 'Correct', value: correct, color: '#10B981' },
        { name: 'Incorrect', value: incorrect, color: '#EF4444' },
        { name: 'Unattempted', value: unattempted, color: '#6B7280' }
      ],
      performanceData: [
        { subject: 'Accuracy', score: selectedAttempt.performanceAnalytics?.accuracy || 0 },
        { subject: 'Speed', score: Math.min(100, (selectedAttempt.questionsAttempted / selectedAttempt.totalQuestions) * 100) },
        { subject: 'Completion', score: (selectedAttempt.questionsAttempted / selectedAttempt.totalQuestions) * 100 },
      ],
      timeData: selectedAttempt.answers?.map((answer, index) => ({
        question: `Q${index + 1}`,
        time: answer.timeSpentSeconds || 0,
        status: answer.attemptStatus
      })) || []
    };
  };

  const chartData = selectedAttempt ? generateChartData() : null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getGradeFromScore = (score) => {
    if (score >= 90) return { grade: 'A+', color: 'bg-green-500' };
    if (score >= 80) return { grade: 'A', color: 'bg-green-400' };
    if (score >= 70) return { grade: 'B', color: 'bg-blue-500' };
    if (score >= 60) return { grade: 'C', color: 'bg-yellow-500' };
    if (score >= 50) return { grade: 'D', color: 'bg-orange-500' };
    return { grade: 'F', color: 'bg-red-500' };
  };

  // Toggle question text expansion
  const toggleQuestionExpansion = (index) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
 fifth element      <div className="container mx-auto p-4 sm:p-6">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                My Exam Results
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">Track your performance and analyze your results</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600 text-sm sm:text-base">Loading amazing results...</span>
          </div>
        ) : (
          <>
            {/* Exams List */}
            {!selectedAttempt ? (
              <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Total Exams</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{exams.length}</p>
                      </div>
                      <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">
                          {Object.values(attemptStatus).filter(Boolean).length}
                        </p>
                      </div>
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                        <p className="text-xl sm:text-2xl font-bold text-orange-600">
                          {Object.values(attemptStatus).filter(status => !status).length}
                        </p>
                      </div>
                      <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Success Rate</p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-600">
                          {exams.length > 0 ? Math.round((Object.values(attemptStatus).filter(Boolean).length / exams.length) * 100) : 0}%
                        </p>
                      </div>
                      <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Exams Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {exams.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-base sm:text-lg">No exams found</p>
                    </div>
                  ) : (
                    exams.map((exam) => (
                      <div
                        key={exam._id}
                        className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h2 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight line-clamp-2">{exam.title}</h2>
                          {attemptStatus[exam._id] ? (
                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              Completed
                            </div>
                          ) : (
                            <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                              Pending
                            </div>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm sm:text-base mb-4 line-clamp-2">{exam.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-xs sm:text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(exam.startTime)}
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-gray-500">
                            <Timer className="w-4 h-4 mr-2" />
                            {exam.duration} minutes
                          </div>
                        </div>

                        {attemptStatus[exam._id] ? (
                          <button
                            onClick={() => handleShowResult(exam._id)}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 font-medium min-h-12"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Results</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="w-full bg-gray-100 text-gray-500 px-4 py-3 rounded-lg text-center font-medium text-sm">
                            Not Attempted
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Detailed Result View */
              <div className="space-y-6">
                {/* Back Button */}
                <button
                  onClick={() => setSelectedAttempt(null)}
                  className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium transition-colors text-sm sm:text-base"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Exams
                </button>

                {/* Result Header */}
                <div className="bg-white rounded-xl p-4 sm:p-8 shadow-lg border border-gray-100">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6">
                    <div>
                      <h2 className="text-xl sm:text-3xl font-bold text-gray-800 line-clamp-2">{selectedAttempt.examId.title}</h2>
                      <p className="text-gray-600 text-sm sm:text-base mt-1">Detailed Performance Analysis</p>
                    </div>
                    <div className="mt-4 sm:mt-0 text-right">
                      {(() => {
                        const { grade, color } = getGradeFromScore(selectedAttempt.score);
                        return (
                          <div className={`${color} text-white px-3 sm:px-4 py-2 rounded-lg font-bold text-lg sm:text-2xl`}>
                            {grade}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Score Overview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6">
                        <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 mx-auto mb-2" />
                        <p className="text-xs sm:text-sm text-gray-600">Overall Score</p>
                        <p className={`text-xl sm:text-3xl font-bold ${getScoreColor(selectedAttempt.score)}`}>
                          {selectedAttempt.score}
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6">
                        <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-xs sm:text-sm text-gray-600">Accuracy</p>
                        <p className="text-xl sm:text-3xl font-bold text-green-600">
                          {(selectedAttempt.performanceAnalytics?.accuracy || 0).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 sm:p-6">
                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-xs sm:text-sm text-gray-600">Completed</p>
                        <p className="text-xl sm:text-3xl font-bold text-purple-600">
                          {selectedAttempt.questionsAttempted}/{selectedAttempt.totalQuestions}
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 sm:p-6">
                        <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mx-auto mb-2" />
                        <p className="text-xs sm:text-sm text-gray-600">Duration</p>
                        <p className="text-xl sm:text-3xl font-bold text-orange-600">
                          {selectedAttempt.durationMinutes || 'N/A'} min
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                {chartData && (
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    {/* Performance Distribution */}
                    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600" />
                        Answer Distribution
                      </h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={chartData.pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {chartData.pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center space-x-4 mt-4">
                        {chartData.pieData.map((item) => (
                          <div key={item.name} className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="text-xs sm:text-sm text-gray-600">{item.name}: {item.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-center mt-4">
                        <span className="text-xs sm:text-sm text-gray-600">Total Score: </span>
                        <span className={`text-xs sm:text-sm font-bold ${getScoreColor(selectedAttempt.score)}`}>
                          {selectedAttempt.score}%
                        </span>
                      </div>
                    </div>

                    {/* Performance Radar */}
                    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600" />
                        Performance Radar
                      </h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <RadarChart data={chartData.performanceData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis domain={[0, 100]} />
                          <Radar
                            name="Performance"
                            dataKey="score"
                            stroke="#6366f1"
                            fill="#6366f1"
                            fillOpacity={0.3}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Time Analysis */}
                    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600" />
                        Time Spent Per Question
                      </h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData.timeData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="question" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="time" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Detailed Stats */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <Brain className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600" />
                      Performance Analytics
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Correct Answers</span>
                        <span className="font-bold text-green-600 text-sm sm:text-base">
                          {selectedAttempt.performanceAnalytics?.correctCount ?? 'Calculating...'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Incorrect Answers</span>
                        <span className="font-bold text-red-600 text-sm sm:text-base">
                          {selectedAttempt.performanceAnalytics?.incorrectCount ?? 'Calculating...'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Avg. Time per Question</span>
                        <span className="font-bold text-blue-600 text-sm sm:text-base">
                          {(selectedAttempt.performanceAnalytics?.timeManagement || 0).toFixed(2)}s
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Strong Sections</span>
                        <span className="font-bold text-green-600 text-sm sm:text-base">
                          {formatSections(selectedAttempt.performanceAnalytics?.strongSections)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Weak Sections</span>
                        <span className="font-bold text-orange-600 text-sm sm:text-base">
                          {formatSections(selectedAttempt.performanceAnalytics?.weakSections)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Security Report */}
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600" />
                      Security Report
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Violation Attempts</span>
                        <span className={`font-bold text-sm sm:text-base ${selectedAttempt.cheatingAttempts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedAttempt.cheatingAttempts || 0}
                        </span>
                      </div>
                      {selectedAttempt.cheatingLogs?.length > 0 ? (
                        <div className="bg-red-50 rounded-lg p-4">
                          <h4 className="font-medium text-red-800 text-sm sm:text-base mb-2">Security Logs:</h4>
                          <ul className="space-y-1">
                            {selectedAttempt.cheatingLogs.map((log, index) => (
                              <li key={index} className="text-xs sm:text-sm text-red-700">
                                {log.type} - {formatDate(log.timestamp)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-green-700 text-xs sm:text-sm">✓ No security violations detected</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Feedback Section */}
                {isFeedbackSubmitted ? (
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600" />
                      Your Feedback
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Mood</p>
                        <p className="font-medium capitalize text-sm sm:text-base">{selectedAttempt.feedback.mood || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Rating</p>
                        <div className="flex">{renderStars(selectedAttempt.feedback.rating)}</div>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Confidence Level</p>
                        <p className="font-medium capitalize text-sm sm:text-base">{selectedAttempt.feedback.confidenceLevel || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Submitted</p>
                        <p className="font-medium text-sm sm:text-base">{selectedAttempt.feedback.timestamp ? formatDate(selectedAttempt.feedback.timestamp) : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Comments</p>
                        <p className="font-medium text-sm sm:text-base">{selectedAttempt.feedback.comments || 'No comments provided'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600" />
                      Submit Your Feedback
                    </h3>
                    <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">How did you feel?</label>
                          <select
                            value={feedback.mood}
                            onChange={(e) => setFeedback({ ...feedback, mood: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg shadow-sm p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            required
                          >
                            <option value="">Select your mood</option>
                            {['happy', 'sad', 'neutral', 'confused', 'stressed', 'confident'].map((mood) => (
                              <option key={mood} value={mood}>
                                {mood.charAt(0).toUpperCase() + mood.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Confidence Level</label>
                          <select
                            value={feedback.confidenceLevel}
                            onChange={(e) => setFeedback({ ...feedback, confidenceLevel: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg shadow-sm p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            required
                          >
                            <option value="">Select confidence level</option>
                            {['low', 'medium', 'high'].map((level) => (
                              <option key={level} value={level}>
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Rate your experience</label>
                        <div className="flex space-x-1">{renderStars(feedback.rating || 0, true)}</div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Additional Comments</label>
                        <textarea
                          value={feedback.comments}
                          onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg shadow-sm p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          rows="4"
                          maxLength="500"
                          placeholder="Share your thoughts about the exam experience..."
                        ></textarea>
                        <p className="text-xs text-gray-500 mt-1">{feedback.comments.length}/500 characters</p>
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2 min-h-12"
                        disabled={loading || !selectedAttempt?.examId?._id}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{loading ? 'Submitting...' : 'Submit Feedback'}</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* Question-wise Analysis */}
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
                    <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-indigo-600" />
                    Question-wise Analysis
                  </h3>
                  <div className="space-y-4 sm:space-y-6">
                    {selectedAttempt.answers.map((answer, index) => {
                      const question = answer.questionId;
                      const explanation = selectedAttempt.questionExplanations?.find(
                        (exp) => exp.questionId.toString() === question._id.toString()
                      );
                      let isCorrect = false;
                      if (question.questionType === 'multipleChoice') {
                        isCorrect =
                          answer.selectedOptions?.sort().join(',') ===
                          question.correctAnswers?.sort().join(',');
                      } else if (question.questionType === 'numerical') {
                        isCorrect = answer.numericalAnswer !== null && answer.numericalAnswer === question.correctAnswers?.[0];
                      }
                      const isExpanded = expandedQuestions[index];

                      return (
                        <div key={answer._id || index} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row items-start justify-between mb-4">
                            <h4 className="font-semibold text-gray-800 flex items-center flex-1">
                              <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs sm:text-sm mr-3">
                                Q{index + 1}
                              </span>
                              <div className={`flex-1 ${!isExpanded ? 'line-clamp-3 sm:line-clamp-2' : ''} break-words`}>
                                {renderMathOrText(question.questionText)}
                              </div>
                            </h4>
                            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                              {isCorrect ? (
                                <div className="flex items-center text-green-600">
                                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                                  <span className="text-xs sm:text-sm font-medium">Correct</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-red-600">
                                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                                  <span className="text-xs sm:text-sm font-medium">Incorrect</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {question.questionText?.length > 100 && (
                            <button
                              onClick={() => toggleQuestionExpansion(index)}
                              className="text-indigo-600 hover:text-indigo-700 text-xs sm:text-sm font-medium mb-4"
                            >
                              {isExpanded ? 'Show Less' : 'Show More'}
                            </button>
                          )}

                          {question.imageUrl && question.imageUrl !== '' && (
                            <div className="mb-4">
                              <img
                                src={`${BASE_URL}${question.imageUrl}`}
                                alt="Question image"
                                className="max-w-full h-auto rounded-lg border border-gray-200"
                                onError={(e) => {
                                  console.error(`Failed to load question image: ${BASE_URL}${question.imageUrl}`);
                                  console.error(`Question ID: ${question._id}, Exam ID: ${selectedAttempt.examId._id}`);
                                  e.target.src = '/placeholder-image.jpg';
                                }}
                                onLoad={() => console.log(`Successfully loaded question image: ${BASE_URL}${question.imageUrl}`)}
                              />
                            </div>
                          )}

                          {question.questionType === 'multipleChoice' ? (
                            <div className="mb-4">
                              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">All Options</p>
                              <div className="space-y-2">
                                {question.options?.map((option, optIndex) => {
                                  const isSelected = answer.selectedOptions?.includes(optIndex);
                                  const isCorrectOption = question.correctAnswers?.includes(optIndex);
                                  return (
                                    <div
                                      key={optIndex}
                                      className={`p-3 rounded-lg flex items-start space-x-2 ${
                                        isCorrectOption
                                          ? 'bg-green-50 border border-green-200'
                                          : isSelected && !isCorrectOption
                                          ? 'bg-red-50 border border-red-200'
                                          : 'bg-gray-50 border border-gray-200'
                                      }`}
                                    >
                                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                                        {String.fromCharCode(65 + optIndex)}:
                                      </span>
                                      <div className="flex-1 break-words">
                                        {renderMathOrText(option.optionText || `Option ${optIndex}`)}
                                        {option.imageUrl && option.imageUrl !== '' && (
                                          <img
                                            src={`${BASE_URL}${option.imageUrl}`}
                                            alt={`Option ${optIndex} image`}
                                            className="mt-2 max-w-full h-auto rounded border border-gray-200"
                                            onError={(e) => {
                                              console.error(`Failed to load option image: ${BASE_URL}${option.imageUrl}`);
                                              e.target.src = '/placeholder-image.jpg';
                                            }}
                                            onLoad={() => console.log(`Successfully loaded option image: ${BASE_URL}${option.imageUrl}`)}
                                          />
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        {isSelected && (
                                          <span className="text-xs sm:text-sm font-medium text-blue-600">Your Answer</span>
                                        )}
                                        {isCorrectOption && (
                                          <CheckCircle className="w-4 h-4 text-green-600" />
                                        )}
                                        {isSelected && !isCorrectOption && (
                                          <XCircle className="w-4 h-4 text-red-600" />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="mb-4">
                              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Question Type</p>
                              <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded">
                                Numerical
                              </span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 gap-4 mb-4">
                            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Your Answer</p>
                              <p className="text-gray-800 text-sm break-words">
                                {question.questionType === 'multipleChoice' ? (
                                  answer.selectedOptions?.length > 0
                                    ? answer.selectedOptions
                                        .map((opt) => renderMathOrText(question.options[opt]?.optionText || `Option ${opt}`))
                                        .reduce((acc, curr, i) => [...acc, i > 0 ? ', ' : '', curr], [])
                                    : 'Not answered'
                                ) : (
                                  answer.numericalAnswer !== null
                                    ? answer.numericalAnswer
                                    : 'Not answered'
                                )}
                              </p>
                              {question.questionType === 'multipleChoice' && answer.selectedOptions?.map((opt, i) => (
                                question.options[opt]?.imageUrl && question.options[opt].imageUrl !== '' ? (
                                  <img
                                    key={i}
                                    src={`${BASE_URL}${question.options[opt].imageUrl}`}
                                    alt={`Option ${opt} image`}
                                    className="mt-2 max-w-full h-auto rounded border border-gray-200"
                                    onError={(e) => {
                                      console.error(`Failed to load option image: ${BASE_URL}${question.options[opt].imageUrl}`);
                                      e.target.src = '/placeholder-image.jpg';
                                    }}
                                    onLoad={() => console.log(`Successfully loaded option image: ${BASE_URL}${question.options[opt].imageUrl}`)}
                                  />
                                ) : null
                              ))}
                            </div>

                            <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Correct Answer</p>
                              <p className="text-green-800 text-sm break-words">
                                {question.questionType === 'multipleChoice' ? (
                                  question.correctAnswers
                                    ?.map((opt) => renderMathOrText(question.options[opt]?.optionText || `Option ${opt}`))
                                    .reduce((acc, curr, i) => [...acc, i > 0 ? ', ' : '', curr], [])
                                ) : (
                                  question.correctAnswers && question.correctAnswers.length > 0
                                    ? question.correctAnswers[0]
                                    : (console.warn(`Correct answer missing for numerical question ID: ${question._id}`), 'Not available')
                                )}
                              </p>
                              {question.questionType === 'multipleChoice' && question.correctAnswers?.map((opt, i) => (
                                question.options[opt]?.imageUrl && question.options[opt].imageUrl !== '' ? (
                                  <img
                                    key={i}
                                    src={`${BASE_URL}${question.options[opt].imageUrl}`}
                                    alt={`Correct option ${opt} image`}
                                    className="mt-2 max-w-full h-auto rounded border border-gray-200"
                                    onError={(e) => {
                                      console.error(`Failed to load correct option image: ${BASE_URL}${question.options[opt].imageUrl}`);
                                      e.target.src = '/placeholder-image.jpg';
                                    }}
                                    onLoad={() => console.log(`Successfully loaded correct option image: ${BASE_URL}${question.options[opt].imageUrl}`)}
                                  />
                                ) : null
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-gray-600 mb-4">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>Time: {answer.timeSpentSeconds || 0}s</span>
                            </div>
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-1" />
                              <span>Status: {answer.attemptStatus || 'N/A'}</span>
                            </div>
                            <div className="flex items-center">
                              <BookOpen className="w-4 h-4 mr-1" />
                              <span>Section: {answer.section || 'N/A'}</span>
                            </div>
                          </div>

                          {(explanation?.explanation || explanation?.explanationImageUrl) && (
                            <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-3 sm:p-4">
                              <div className="flex items-start">
                                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 mt-0.5" />
                                <div>
                                  <p className="font-medium text-blue-800 text-xs sm:text-sm mb-1">Explanation</p>
                                  {explanation.explanation && (
                                    <p className="text-blue-700 text-sm break-words">{renderMathOrText(explanation.explanation)}</p>
                                  )}
                                  {explanation.explanationImageUrl && explanation.explanationImageUrl !== '' && (
                                    <img
                                      src={`${BASE_URL}${explanation.explanationImageUrl}`}
                                      alt="Explanation image"
                                      className="mt-2 max-w-full h-auto rounded border border-gray-200"
                                      onError={(e) => {
                                        console.error(`Failed to load explanation image: ${BASE_URL}${explanation.explanationImageUrl}`);
                                        console.error(`Question ID: ${question._id}, Exam ID: ${selectedAttempt.examId._id}`);
                                        e.target.src = '/placeholder-image.jpg';
                                      }}
                                      onLoad={() => console.log(`Successfully loaded explanation image: ${BASE_URL}${explanation.explanationImageUrl}`)}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Helper function to format date
const formatDate = (date) => {
  try {
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
  } catch (e) {
    console.error('Error formatting date:', date, e);
    return 'Invalid date';
  }
};

export default MyResult;