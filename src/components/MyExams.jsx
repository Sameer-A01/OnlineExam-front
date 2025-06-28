import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle, Flag, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import axiosInstance from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const StudentExamPortal = () => {
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [attemptStatus, setAttemptStatus] = useState({});
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
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionTimeMap, setQuestionTimeMap] = useState({});
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const sections = ['Physics', 'Chemistry', 'Math'];

  const { user } = useAuth();
  const navigate = useNavigate();
  const { examId } = useParams();

  const getExamStatus = (exam) => {
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(exam.endTime);

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'ongoing';
    return 'ended';
  };

  const fetchUpcomingExams = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/exams/upcoming');
      const exams = response.data.exams || [];
      setUpcomingExams(exams);

      const statusPromises = exams.map(exam =>
        axiosInstance.get(`/studentAnswers/check/${exam._id}`)
          .then(res => ({ examId: exam._id, hasAttempted: res.data.hasAttempted }))
          .catch(() => ({ examId: exam._id, hasAttempted: false }))
      );
      const statuses = await Promise.all(statusPromises);
      const statusMap = statuses.reduce((acc, { examId, hasAttempted }) => ({
        ...acc,
        [examId]: hasAttempted,
      }), {});
      setAttemptStatus(statusMap);
    } catch (error) {
      console.error('Error fetching exams:', error);
      alert('Failed to load exams');
    }
    setLoading(false);
  };

  const fetchExamDetails = async (id) => {
    try {
      const response = await axiosInstance.get(`/exams/${id}`);
      const exam = response.data.exam;

      const status = getExamStatus(exam);
      if (status === 'ended') {
        alert('This exam has already ended');
        setView('examsList');
        return;
      }

      const attemptResponse = await axiosInstance.get(`/studentAnswers/check/${id}`);
      if (attemptResponse.data.hasAttempted) {
        alert('You have already submitted this exam');
        setView('examsList');
        return;
      }

      setCurrentExam(exam);

      // Fetch questions with randomization
      const questionsResponse = await axiosInstance.get(`/questions/exam/${id}?random=true`);
      setQuestions(questionsResponse.data.questions || []);

      const endTime = new Date(exam.endTime);
      const currentTime = new Date();
      let timeRemaining = Math.floor((endTime - currentTime) / 1000);

      setTimeLeft(timeRemaining > 0 ? timeRemaining : 0);
      setView('examInstructions');
    } catch (error) {
      console.error('Error fetching exam details:', error);
      alert('Failed to load exam details');
      setView('examsList');
    }
  };

  const startExam = async () => {
    try {
      const response = await axiosInstance.post(`/studentAnswers/start/${currentExam._id}`);
      setAttempt(response.data.attempt);

      const savedAnswers = {};
      if (response.data.attempt.answers) {
        response.data.attempt.answers.forEach(answer => {
          savedAnswers[answer.questionId] = {
            selectedOptions: answer.selectedOptions || [],
            attemptStatus: answer.attemptStatus || 'not_attempted',
          };
        });
      }
      setAnswers(savedAnswers);

      requestFullscreen();

      setView('examInterface');
    } catch (error) {
      console.error('Error starting exam:', error);
      alert('Failed to start exam');
    }
  };

  const requestFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
      setIsFullScreen(true);
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
      setIsFullScreen(true);
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
      setIsFullScreen(true);
    }
  };

  const exitFullscreen = async () => {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
      setIsFullScreen(false);
    } else if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen();
      setIsFullScreen(false);
    } else if (document.msExitFullscreen) {
      await document.msExitFullscreen();
      setIsFullScreen(false);
    }
  };

  const handleFullscreenChange = () => {
    if (
      !document.fullscreenElement &&
      !document.webkitFullscreenElement &&
      !document.mozFullScreenElement &&
      !document.msFullscreenElement
    ) {
      setIsFullScreen(false);
      if (view === 'examInterface' && !examEnded) {
        logCheatingAttempt('fullscreen_exit', 'User exited fullscreen mode');
      }
    } else {
      setIsFullScreen(true);
    }
  };

  const logCheatingAttempt = async (type, description) => {
    try {
      await axiosInstance.post(`/studentAnswers/cheating/${currentExam._id}`, {
        type,
        description,
      });
    } catch (error) {
      console.error('Error logging cheating attempt:', error);
    }
  };

  const handleVisibilityChange = () => {
    if (document.hidden && view === 'examInterface' && !examEnded) {
      setTabSwitchCount(prev => {
        const newCount = prev + 1;
        logCheatingAttempt('tab_switch', `User switched tabs or minimized window (count: ${newCount})`);
        if (newCount > 3) {
          logCheatingAttempt('other', 'Excessive tab switching detected');
        }
        return newCount;
      });
    }
  };

  const handleCopyPasteCut = (event, action) => {
    if (view === 'examInterface' && !examEnded) {
      event.preventDefault();
      logCheatingAttempt('copy_paste_attempt', `User attempted to ${action}`);
      alert(`Warning: ${action} is disabled during the exam.`);
    }
  };

  const handleContextMenu = (event) => {
    if (view === 'examInterface' && !examEnded) {
      event.preventDefault();
      logCheatingAttempt('other', 'User attempted to open context menu');
    }
  };

  const handleKeyDown = (event) => {
    if (view === 'examInterface' && !examEnded) {
      if (
        (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'J')) ||
        event.key === 'F12'
      ) {
        event.preventDefault();
        logCheatingAttempt('other', 'User attempted to open developer tools');
        alert('Warning: Opening developer tools is not allowed during the exam.');
      }
      if (
        (event.altKey && (event.key === 'Tab' || event.key.includes('Arrow'))) ||
        (event.ctrlKey && event.key === 'Tab')
      ) {
        event.preventDefault();
        logCheatingAttempt('other', 'User attempted task switching');
        alert('Warning: Task switching is not allowed during the exam.');
      }
    }
  };

  const handleOptionSelect = (optionIndex) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const questionId = currentQuestion._id;
    const currentSelectedOptions = answers[questionId]?.selectedOptions || [];
    let newSelectedOptions = [...currentSelectedOptions];

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
      },
    });
  };

  const markForReview = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const questionId = currentQuestion._id;

    setAnswers({
      ...answers,
      [questionId]: {
        ...answers[questionId],
        attemptStatus: 'marked_for_review',
      },
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const questionId = questions[currentQuestionIndex]?._id;
      if (!questionId) return;

      const now = Date.now();
      const elapsedSeconds = Math.floor((now - questionStartTime) / 1000);

      setQuestionTimeMap(prev => ({
        ...prev,
        [questionId]: (prev[questionId] || 0) + elapsedSeconds,
      }));

      setQuestionStartTime(now);
    }, 1000);

    return () => clearInterval(interval);
  }, [questionStartTime, currentQuestionIndex, questions]);

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const saveAnswer = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const questionId = currentQuestion._id;
    const answerData = answers[questionId] || {
      selectedOptions: [],
      attemptStatus: 'not_attempted',
    };

    const timeSpentSeconds = questionTimeMap[questionId] || 0;

    try {
      const response = await axiosInstance.put(`/studentAnswers/answer/${currentExam._id}`, {
        questionId,
        selectedOptions: answerData.selectedOptions,
        timeSpentSeconds,
        attemptStatus: answerData.attemptStatus,
      });

      setAttempt(response.data.attempt);
    } catch (error) {
      console.error('Error saving answer:', error);
      alert('Failed to save answer');
    }
  };

  const nextQuestion = async () => {
    await saveAnswer();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = async () => {
    await saveAnswer();
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const jumpToQuestion = async (index) => {
    await saveAnswer();
    setCurrentQuestionIndex(index);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const submitExam = async () => {
    await saveAnswer();

    if (
      !window.confirm(
        'Are you sure you want to submit this exam? You won\'t be able to change your answers after submission.'
      )
    ) {
      return;
    }

    try {
      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      ) {
        await document.exitFullscreen?.() ||
          document.webkitExitFullscreen?.() ||
          document.msExitFullscreen?.();
      }
      setIsFullScreen(false);
      setExamEnded(true);

      const response = await axiosInstance.post(`/studentAnswers/submit/${currentExam._id}`);
      setExamResult(response.data);
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit exam');
      setExamEnded(false);
    }
  };

  // Render LaTeX or plain text
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

  useEffect(() => {
    if (!examId) {
      fetchUpcomingExams();
    } else {
      fetchExamDetails(examId);
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    document.addEventListener('copy', (e) => handleCopyPasteCut(e, 'copy'));
    document.addEventListener('paste', (e) => handleCopyPasteCut(e, 'paste'));
    document.addEventListener('cut', (e) => handleCopyPasteCut(e, 'cut'));
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          if (!examEnded && view === 'examInterface') {
            alert('Time\'s up! Your exam will be submitted automatically.');
            submitExam();
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', (e) => handleCopyPasteCut(e, 'copy'));
      document.removeEventListener('paste', (e) => handleCopyPasteCut(e, 'paste'));
      document.removeEventListener('cut', (e) => handleCopyPasteCut(e, 'cut'));
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(timer);

      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      ) {
        exitFullscreen();
      }
    };
  }, [examId, view, examEnded]);

  useEffect(() => {
    if (view === 'examInterface' && !examEnded) {
      const saveInterval = setInterval(() => {
        saveAnswer();
      }, 30000);

      return () => clearInterval(saveInterval);
    }
  }, [currentQuestionIndex, answers, view, examEnded]);

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
                <p className="font-medium">{questions.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Read all questions carefully before answering.</li>
              <li>Questions are organized by sections (e.g., Physics, Chemistry, Math).</li>
              <li>You can navigate between questions using the navigation panel, grouped by section.</li>
              <li>The exam will automatically be submitted when the time expires.</li>
              <li>Your answers are saved automatically every 30 seconds or when you navigate between questions.</li>
              <li>The exam must be completed in fullscreen mode.</li>
              <li>Switching tabs, exiting fullscreen, copy-paste, or using keyboard shortcuts will be logged as cheating attempts.</li>
              <li>Multiple cheating attempts may result in automatic disqualification.</li>
              <li>Questions may have one or multiple correct answers.</li>
              <li>You can mark questions for review to come back to them later.</li>
              <li>Some questions and options may include LaTeX-formatted math (e.g., $x^2$).</li>
              <li>Options may include images alongside text.</li>
            </ul>
          </div>

          <div className="flex justify-center">
            <button
              onClick={startExam}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
            >
              Start Exam Now
            </button>
          </div>
        </div>
      </div>
    );
  };

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
            const isAvailable = status === 'ongoing';
            const hasAttempted = attemptStatus[exam._id] || false;

            return (
              <div key={exam._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold">{exam.title}</h2>
                  <span className={statusClass}>
                    {status === 'upcoming' && 'Upcoming'}
                    {status === 'ongoing' && 'Ongoing'}
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
                      {new Date(exam.startTime).toLocaleTimeString()} -{' '}
                      {new Date(exam.endTime).toLocaleTimeString()}
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
                    disabled={!isAvailable || hasAttempted}
                    className={`px-4 py-2 rounded-md ${
                      isAvailable && !hasAttempted
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {hasAttempted
                      ? 'Exam Submitted'
                      : isAvailable
                      ? 'Start Exam'
                      : status === 'upcoming'
                      ? 'Not Started Yet'
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

  const renderExamInterface = () => {
    if (!currentExam || !questions || questions.length === 0) return null;

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;

    const questionId = currentQuestion._id;
    const questionAnswers = answers[questionId] || { selectedOptions: [], attemptStatus: 'not_attempted' };
    const attemptSummary = attempt
      ? {
          total: attempt.totalQuestions,
          attempted: attempt.questionsAttempted,
          remaining: attempt.questionsLeft,
        }
      : { total: questions.length, attempted: 0, remaining: questions.length };

    const fullscreenWarning =
      !isFullScreen && view === 'examInterface' && !examEnded ? (
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
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Submit Exam
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-64 bg-white p-4 rounded-lg shadow-md h-fit">
                <h2 className="font-medium mb-3 text-gray-700">Question Navigator</h2>
                {sections.map((section) => {
                  const sectionQuestions = questions.filter((q) => q.section === section);
                  if (sectionQuestions.length === 0) return null;
                  return (
                    <div key={section} className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-600 mb-2">{section}</h3>
                      <div className="grid grid-cols-4 md:grid-cols-3 gap-2">
                        {sectionQuestions.map((q, index) => {
                          const globalIndex = questions.findIndex((question) => question._id === q._id);
                          const qAnswers = answers[q._id] || { attemptStatus: 'not_attempted' };
                          let buttonClass = 'w-10 h-10 rounded-full flex items-center justify-center';

                          switch (qAnswers.attemptStatus) {
                            case 'attempted':
                              buttonClass += ' bg-green-100 text-green-700 border border-green-300';
                              break;
                            case 'marked_for_review':
                              buttonClass += ' bg-yellow-100 text-yellow-700 border border-yellow-300';
                              break;
                            default:
                              buttonClass += ' bg-gray-100 text-gray-700 border border-gray-300';
                          }

                          if (globalIndex === currentQuestionIndex) {
                            buttonClass += ' ring-2 ring-blue-500';
                          }

                          return (
                            <button
                              key={q._id}
                              className={buttonClass}
                              onClick={() => jumpToQuestion(globalIndex)}
                            >
                              {index + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

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

              <div className="flex-1 bg-white p-6 rounded-lg shadow-md">
                <div className="mb-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-semibold">Question {currentQuestionIndex + 1} ({currentQuestion.section})</h2>
                    <div className="text-sm space-y-1">
                      <div>
                        {currentQuestion.marks > 0 && (
                          <span className="text-green-600 font-medium">+{currentQuestion.marks} marks</span>
                        )}
                        {currentQuestion.negativeMarks > 0 && (
                          <span className="text-red-600 font-medium ml-2">
                            -{currentQuestion.negativeMarks} for wrong answer
                          </span>
                        )}
                      </div>
                      {currentQuestion.difficulty && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Difficulty: </span>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getDifficultyBadgeStyles(currentQuestion.difficulty)}`}>
                            {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
                          </span>
                        </div>
                      )}
                      {currentQuestion.tags && currentQuestion.tags.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Tags: </span>
                          {currentQuestion.tags.map((tag, tagIdx) => (
                            <span
                              key={tagIdx}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-1"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">{renderMathOrText(currentQuestion.questionText)}</div>

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
                        <div
                          className={`w-5 h-5 mr-3 rounded-full border flex items-center justify-center ${
                            questionAnswers.selectedOptions.includes(index)
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-400'
                          }`}
                        >
                          {questionAnswers.selectedOptions.includes(index) && (
                            <CheckCircle size={12} className="text-white" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div>{renderMathOrText(option.optionText)}</div>
                          {option.imageUrl && (
                            <img
                              src={option.imageUrl}
                              alt={`Option ${index + 1}`}
                              className="max-h-20 object-contain mt-1"
                            />
                          )}
                        </div>
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
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
              onClick={() => navigate('/employee-dashboard/MyExams')}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Return to Exams
            </button>
          </div>
        )}
      </div>
    );
  };

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