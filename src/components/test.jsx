import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle, Flag, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import axiosInstance from '../utils/api';
import { useAuth } from '../context/AuthContext';

const StudentExamPortal = () => {
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('examsList');
  const [currentExam, setCurrentExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [examEnded, setExamEnded] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [submissionInProgress, setSubmissionInProgress] = useState(false);
  const [cheatingAttempts, setCheatingAttempts] = useState(0);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { examId } = useParams();

  // Get exam status
  const getExamStatus = (exam) => {
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(exam.endTime);

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'ongoing';
    return 'ended';
  };

  // Fetch upcoming and ongoing exams
  const fetchUpcomingExams = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/exams/upcoming');
      const exams = response.data.exams || [];
      
      // Check for attempts
      const attemptsResponse = await axiosInstance.get('/studentAnswers/my-attempts');
      const attemptedExamIds = attemptsResponse.data.attempts.map(a => a.examId._id);
      
      const examsWithAttemptStatus = exams.map(exam => ({
        ...exam,
        hasAttempted: attemptedExamIds.includes(exam._id)
      }));
      
      setUpcomingExams(examsWithAttemptStatus);
    } catch (error) {
      console.error("Error fetching exams", error);
      alert("Failed to load exams");
    }
    setLoading(false);
  };

  // Fetch exam details by ID
  const fetchExamDetails = async (id) => {
    try {
      const response = await axiosInstance.get(`/exams/${id}`);
      const exam = response.data.exam;
      
      // Check if exam is available
      const status = getExamStatus(exam);
      if (status === 'ended') {
        alert("This exam has already ended");
        return;
      }

      // Check if user has already attempted this exam
      const attemptCheck = await axiosInstance.get(`/studentAnswers/check/${id}`);
      setHasAttempted(attemptCheck.data.hasAttempted);

      setCurrentExam(exam);
      setQuestions(exam.questions || []);
      
      // Calculate time remaining
      const endTime = new Date(exam.endTime);
      const currentTime = new Date();
      let timeRemaining = Math.floor((endTime - currentTime) / 1000);
      
      setTimeLeft(timeRemaining > 0 ? timeRemaining : 0);
      setView('examInstructions');
    } catch (error) {
      console.error("Error fetching exam details", error);
      alert("Failed to load exam details");
    }
  };

  // Setup anti-copy protection
  const setupAntiCopyProtection = useCallback(() => {
    // Disable right click
    const handleContextMenu = (e) => {
      e.preventDefault();
      logCheatingAttempt('copy_paste_attempt', 'Right click attempted');
    };

    // Disable copy/paste
    const handleCopy = (e) => {
      e.preventDefault();
      logCheatingAttempt('copy_paste_attempt', 'Copy attempted');
    };

    // Disable keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        logCheatingAttempt('copy_paste_attempt', 'Copy shortcut attempted');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Start exam attempt with improved fullscreen handling
  const startExam = async () => {
    try {
      if (hasAttempted) {
        alert("You have already attempted this exam.");
        return;
      }

      // First request fullscreen before starting exam
      const fullscreenSuccess = await requestFullscreen();
      if (!fullscreenSuccess) {
        alert("Please allow fullscreen mode to continue with the exam.");
        return;
      }

      // Then start the exam attempt
      const response = await axiosInstance.post(`/studentAnswers/start/${currentExam._id}`);
      setAttempt(response.data.attempt);
      
      // Initialize answers
      const savedAnswers = {};
      if (response.data.attempt.answers) {
        response.data.attempt.answers.forEach(answer => {
          savedAnswers[answer.questionId] = {
            selectedOptions: answer.selectedOptions || [],
            attemptStatus: answer.attemptStatus || 'not_attempted',
            timeSpentSeconds: answer.timeSpentSeconds || 0
          };
        });
      }
      setAnswers(savedAnswers);
      
      // Setup anti-copy protection
      setupAntiCopyProtection();
      
      setView('examInterface');
    } catch (error) {
      console.error("Error starting exam", error);
      alert("Failed to start exam");
      exitFullscreen();
    }
  };

  // Improved fullscreen request with promise and better error handling
  const requestFullscreen = async () => {
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullScreen(true);
      return true;
    } catch (err) {
      console.error("Fullscreen error:", err);
      return false;
    }
  };

  // Exit fullscreen
  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.error("Exit fullscreen error:", err));
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen().catch(err => console.error("Exit fullscreen error:", err));
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen().catch(err => console.error("Exit fullscreen error:", err));
    }
    setIsFullScreen(false);
  };

  // Handle fullscreen change
  const handleFullscreenChange = useCallback(() => {
    const isFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    setIsFullScreen(isFullscreen);

    if (!isFullscreen && view === 'examInterface' && !examEnded) {
      logCheatingAttempt('fullscreen_exit', 'User exited fullscreen mode');
      setCheatingAttempts(prev => {
        const newAttempts = prev + 1;
        if (newAttempts >= 3) {
          alert("Multiple violations detected. Your exam will be submitted automatically.");
          submitExam();
        } else {
          alert(`Warning: Fullscreen mode is required (${newAttempts}/3 violations)`);
          requestFullscreen();
        }
        return newAttempts;
      });
    }
  }, [view, examEnded]);

  // Log cheating attempt
  const logCheatingAttempt = async (type, description) => {
    try {
      await axiosInstance.post(`/studentAnswers/cheating/${currentExam._id}`, {
        type,
        description
      });
    } catch (error) {
      console.error("Error logging cheating attempt", error);
    }
  };

  // Handle tab visibility change
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && view === 'examInterface' && !examEnded) {
      logCheatingAttempt('tab_switch', 'User switched tabs or minimized window');
      setCheatingAttempts(prev => {
        const newAttempts = prev + 1;
        if (newAttempts >= 3) {
          alert("Multiple violations detected. Your exam will be submitted automatically.");
          submitExam();
        } else {
          alert(`Warning: Tab switching is not allowed (${newAttempts}/3 violations)`);
        }
        return newAttempts;
      });
    }
  }, [view, examEnded]);

  // Handle option selection
  const handleOptionSelect = (optionIndex) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    const questionId = currentQuestion._id;
    const currentSelectedOptions = answers[questionId]?.selectedOptions || [];
    let newSelectedOptions = [...currentSelectedOptions];
    
    // Allow multiple correct answers (toggle selection)
    const optionPosition = newSelectedOptions.indexOf(optionIndex);
    if (optionPosition >= 0) {
      newSelectedOptions.splice(optionPosition, 1);
    } else {
      newSelectedOptions.push(optionIndex);
    }
    
    setAnswers({
      ...answers,
      [questionId]: {
        ...answers[questionId],
        selectedOptions: newSelectedOptions,
        attemptStatus: newSelectedOptions.length > 0 ? 'attempted' : 'not_attempted',
        timeSpentSeconds: (answers[questionId]?.timeSpentSeconds || 0) + 5 // Increment time spent
      }
    });
  };

  // Mark question for review
  const markForReview = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    const questionId = currentQuestion._id;
    
    setAnswers({
      ...answers,
      [questionId]: {
        ...answers[questionId],
        attemptStatus: 'marked_for_review',
        timeSpentSeconds: (answers[questionId]?.timeSpentSeconds || 0) + 5 // Increment time spent
      }
    });
  };

  // Save current answer
  const saveAnswer = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    const questionId = currentQuestion._id;
    const answerData = answers[questionId] || {
      selectedOptions: [],
      attemptStatus: 'not_attempted',
      timeSpentSeconds: 5
    };
    
    try {
      const response = await axiosInstance.put(`/studentAnswers/answer/${currentExam._id}`, {
        questionId,
        selectedOptions: answerData.selectedOptions,
        timeSpentSeconds: answerData.timeSpentSeconds,
        attemptStatus: answerData.attemptStatus
      });
      
      setAttempt(response.data.attempt);
    } catch (error) {
      console.error("Error saving answer", error);
      alert("Failed to save answer");
    }
  };

  // Navigate to next question
  const nextQuestion = async () => {
    await saveAnswer();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Navigate to previous question
  const prevQuestion = async () => {
    await saveAnswer();
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Jump to specific question
  const jumpToQuestion = async (index) => {
    await saveAnswer();
    setCurrentQuestionIndex(index);
  };

  // Format time display (MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Submit exam with retry logic
  const submitExam = async () => {
    if (submissionInProgress || examEnded) return;
    
    setSubmissionInProgress(true);
    
    // First save the current answer
    await saveAnswer();
    
    // Confirm submission
    if (!window.confirm("Are you sure you want to submit this exam? You won't be able to change your answers after submission.")) {
      setSubmissionInProgress(false);
      return;
    }
    
    try {
      // Try submitting normally first
      const response = await axiosInstance.post(`/studentAnswers/submit/${currentExam._id}`);
      
      setExamEnded(true);
      setExamResult(response.data);
      setHasAttempted(true);
      
      // Exit fullscreen
      exitFullscreen();
    } catch (error) {
      console.error("Error submitting exam", error);
      
      // If first attempt fails, try again after exiting fullscreen
      try {
        exitFullscreen();
        const retryResponse = await axiosInstance.post(`/studentAnswers/submit/${currentExam._id}`);
        
        setExamEnded(true);
        setExamResult(retryResponse.data);
        setHasAttempted(true);
      } catch (retryError) {
        console.error("Retry submission failed", retryError);
        alert("Failed to submit exam. Please try again or contact support.");
      }
    } finally {
      setSubmissionInProgress(false);
    }
  };

  // Set up timer and event listeners
  useEffect(() => {
    // Fetch exams initially if no examId is provided
    if (!examId) {
      fetchUpcomingExams();
    } else {
      fetchExamDetails(examId);
    }
    
    // Add event listeners for fullscreen and visibility changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up timer
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          if (!examEnded && view === 'examInterface') {
            alert("Time's up! Your exam will be submitted automatically.");
            submitExam();
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    // Clean up
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(timer);
      
      // Exit fullscreen when component unmounts
      if (document.fullscreenElement || 
          document.webkitFullscreenElement || 
          document.mozFullScreenElement ||
          document.msFullscreenElement) {
        exitFullscreen();
      }
    };
  }, [examId, view, examEnded, handleFullscreenChange, handleVisibilityChange]);

  // Auto-save answers every 30 seconds
  useEffect(() => {
    if (view === 'examInterface' && !examEnded) {
      const saveInterval = setInterval(() => {
        saveAnswer();
      }, 30000); // Every 30 seconds
      
      return () => clearInterval(saveInterval);
    }
  }, [currentQuestionIndex, answers, view, examEnded]);

  // Render exam instructions
  const renderExamInstructions = () => {
    if (!currentExam) return null;
    
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button
          onClick={() => {
            setCurrentExam(null);
            setView('examsList');
          }}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Exams
        </button>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{currentExam.title}</h1>
            <p className="text-gray-600 mt-2">{currentExam.description}</p>
          </div>
          
          <div className="border-t border-b py-4 my-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{new Date(currentExam.examDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Time</p>
                <p className="font-medium">{new Date(currentExam.startTime).toLocaleTimeString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{currentExam.duration} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Questions</p>
                <p className="font-medium">{currentExam.questions?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Read all questions carefully before answering.</li>
              <li>You can navigate between questions using the navigation panel.</li>
              <li>The exam will automatically be submitted when the time expires.</li>
              <li>Your answers are saved automatically when you navigate between questions.</li>
              <li>The exam must be completed in fullscreen mode.</li>
              <li>Switching tabs or exiting fullscreen will be logged as cheating attempts.</li>
              <li>Multiple cheating attempts may result in automatic disqualification.</li>
              <li>Copying/pasting is disabled during the exam.</li>
              <li>Questions may have one or multiple correct answers.</li>
              <li>You can mark questions for review to come back to them later.</li>
            </ul>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={startExam}
              disabled={hasAttempted}
              className={`px-6 py-3 rounded-md font-medium ${
                hasAttempted
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {hasAttempted ? 'Already Attempted' : 'Start Exam Now'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render exams list with proper status indicators
  const renderExamsList = () => (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Your Exams</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading exams...</p>
        </div>
      ) : upcomingExams.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">No exams available at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingExams.map((exam) => {
            const status = getExamStatus(exam);
            const statusClass = `status-badge ${status}`;
            const isAvailable = status === 'ongoing' && !exam.hasAttempted;
            
            return (
              <div key={exam._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold">{exam.title}</h2>
                  <span className={statusClass}>
                    {status === 'upcoming' && 'Upcoming'}
                    {status === 'ongoing' && exam.hasAttempted ? 'Attempted' : 'Ongoing'}
                    {status === 'ended' && 'Ended'}
                  </span>
                </div>
                
                <p className="text-gray-600 mt-2">{exam.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{new Date(exam.examDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">
                      {new Date(exam.startTime).toLocaleTimeString()} - {new Date(exam.endTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">{exam.duration} minutes</p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => fetchExamDetails(exam._id)}
                    disabled={!isAvailable}
                    className={`px-4 py-2 rounded-md ${
                      isAvailable 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : exam.hasAttempted
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : status === 'upcoming' 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {exam.hasAttempted 
                      ? 'Already Attempted' 
                      : status === 'upcoming' 
                        ? 'Not Started Yet' 
                        : status === 'ongoing' 
                          ? 'Start Exam'
                          : 'Exam Ended'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Add CSS for status badges
  const styles = `
    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-badge.upcoming {
      background-color: #fff3cd;
      color: #856404;
    }
    
    .status-badge.ongoing {
      background-color: #d4edda;
      color: #155724;
    }
    
    .status-badge.ended {
      background-color: #f8d7da;
      color: #721c24;
    }
  `;

  // Render exam interface
  const renderExamInterface = () => {
    if (!currentExam || !questions || questions.length === 0) return null;
    
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;
    
    const questionId = currentQuestion._id;
    const questionAnswers = answers[questionId] || { selectedOptions: [], attemptStatus: 'not_attempted' };
    const attemptSummary = attempt ? {
      total: attempt.totalQuestions,
      attempted: attempt.questionsAttempted,
      remaining: attempt.questionsLeft
    } : { total: questions.length, attempted: 0, remaining: questions.length };
    
    // Check if warning is needed for fullscreen
    const fullscreenWarning = !isFullScreen ? (
      <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4 flex items-center">
        <AlertCircle size={20} className="mr-2" />
        <p>Fullscreen mode is required. Please click the button below to enter fullscreen.</p>
        <button
          onClick={requestFullscreen}
          className="ml-auto px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Enter Fullscreen
        </button>
      </div>
    ) : null;
    
    return (
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        {fullscreenWarning}
        
        {!examEnded ? (
          <>
            {/* Header */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold">{currentExam.title}</h1>
              </div>
              <div className="flex items-center space-x-6">
                <div>
                  <p className="text-sm text-gray-500">Questions</p>
                  <p className="font-medium">{attemptSummary.attempted}/{attemptSummary.total}</p>
                </div>
                <div className="flex items-center">
                  <Clock size={18} className="mr-2 text-red-600" />
                  <span className="font-bold text-xl">{formatTime(timeLeft)}</span>
                </div>
                <button
                  onClick={submitExam}
                  disabled={submissionInProgress}
                  className={`px-4 py-2 rounded ${
                    submissionInProgress
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {submissionInProgress ? 'Submitting...' : 'Submit Exam'}
                </button>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              {/* Question Navigator */}
              <div className="w-full md:w-64 bg-white p-4 rounded-lg shadow-md h-fit">
                <h2 className="font-medium mb-3 text-gray-700">Question Navigator</h2>
                <div className="grid grid-cols-4 md:grid-cols-3 gap-2">
                  {questions.map((q, index) => {
                    const qAnswers = answers[q._id] || { attemptStatus: 'not_attempted' };
                    let buttonClass = 'w-10 h-10 rounded-full flex items-center justify-center';
                    
                    switch(qAnswers.attemptStatus) {
                      case 'attempted':
                        buttonClass += ' bg-green-100 text-green-700 border border-green-300';
                        break;
                      case 'marked_for_review':
                        buttonClass += ' bg-yellow-100 text-yellow-700 border border-yellow-300';
                        break;
                      default:
                        buttonClass += ' bg-gray-100 text-gray-700 border border-gray-300';
                    }
                    
                    if (index === currentQuestionIndex) {
                      buttonClass += ' ring-2 ring-blue-500';
                    }
                    
                    return (
                      <button
                        key={q._id}
                        className={buttonClass}
                        onClick={() => jumpToQuestion(index)}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-green-100 border border-green-300 mr-2"></div>
                    <span className="text-sm">Answered</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-yellow-100 border border-yellow-300 mr-2"></div>
                    <span className="text-sm">Marked for Review</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-gray-100 border border-gray-300 mr-2"></div>
                    <span className="text-sm">Not Attempted</span>
                  </div>
                </div>
              </div>
              
              {/* Question Content */}
              <div className="flex-1 bg-white p-6 rounded-lg shadow-md">
                <div className="mb-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-semibold">Question {currentQuestionIndex + 1}</h2>
                    <div className="text-sm">
                      {currentQuestion.marks > 0 && <span className="text-green-600 font-medium">+{currentQuestion.marks} marks</span>}
                      {currentQuestion.negativeMarks > 0 && (
                        <span className="text-red-600 font-medium ml-2">-{currentQuestion.negativeMarks} for wrong answer</span>
                      )}
                    </div>
                  </div>
                  <p className="mt-2">{currentQuestion.questionText}</p>
                  
                  {currentQuestion.imageUrl && (
                    <div className="mt-4">
                      <img 
                        src={currentQuestion.imageUrl} 
                        alt="Question Image" 
                        className="max-h-56 object-contain"
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 mb-8">
                  {currentQuestion.options.map((option, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-md cursor-pointer border ${
                        questionAnswers.selectedOptions.includes(index)
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleOptionSelect(index)}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 mr-3 rounded-full border flex items-center justify-center ${
                          questionAnswers.selectedOptions.includes(index)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-400'
                        }`}>
                          {questionAnswers.selectedOptions.includes(index) && (
                            <CheckCircle size={12} className="text-white" />
                          )}
                        </div>
                        <span>{option.optionText}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between mt-8">
                  <div className="flex space-x-2">
                    <button
                      onClick={prevQuestion}
                      disabled={currentQuestionIndex === 0}
                      className={`flex items-center px-4 py-2 rounded ${
                        currentQuestionIndex === 0
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      <ArrowLeft size={16} className="mr-1" /> Previous
                    </button>
                    
                    <button
                      onClick={markForReview}
                      className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                    >
                      <Flag size={16} className="mr-1" /> Mark for Review
                    </button>
                    
                    <button
                      onClick={saveAnswer}
                      className="flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                      <Save size={16} className="mr-1" /> Save
                    </button>
                  </div>
                  
                  <button
                    onClick={nextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className={`flex items-center px-4 py-2 rounded ${
                      currentQuestionIndex === questions.length - 1
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Next <ArrowRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <CheckCircle size={64} className="mx-auto text-green-600 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Exam Submitted Successfully!</h1>
            <p className="text-lg mb-6">Thank you for completing the exam.</p>
            
            {examResult && (
              <div className="mb-6">
                <p className="text-xl font-semibold">Your Score: {examResult.score}</p>
              </div>
            )}
            
            <button
              onClick={() => navigate('/MyExams')}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Return to Exams
            </button>
          </div>
        )}
      </div>
    );
  };

  // Main render
  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gray-50">
        {view === 'examsList' && renderExamsList()}
        {view === 'examInstructions' && renderExamInstructions()}
        {view === 'examInterface' && renderExamInterface()}
      </div>
    </>
  );
};

export default StudentExamPortal;