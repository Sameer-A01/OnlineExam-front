import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/api';
import { format } from 'date-fns';

const MyResult = () => {
  const [exams, setExams] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [attemptStatus, setAttemptStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState({ mood: '', comments: '', rating: null, confidenceLevel: null });

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
          
          const selected = (answer.selectedOptions || []).sort().join(',');
          const correctAnswers = (question.correctAnswers || []).sort().join(',');
          
          // Only count answers that were attempted
          if (answer.attemptStatus === 'attempted' || answer.attemptStatus === 'marked_for_review') {
            if (selected === correctAnswers && selected !== '') {
              correct++;
            } else {
              incorrect++;
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
        <span
          key={i}
          className={i < rating ? 'text-yellow-400 cursor-pointer' : 'text-gray-300 cursor-pointer'}
          onClick={interactive ? () => setFeedback({ ...feedback, rating: i + 1 }) : null}
        >
          ★
        </span>
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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">My Exam Results</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-600">Loading...</div>
      ) : (
        <>
          {/* Exams List */}
          {!selectedAttempt ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.length === 0 ? (
                <p className="text-gray-600">No exams found.</p>
              ) : (
                exams.map((exam) => (
                  <div
                    key={exam._id}
                    className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition"
                  >
                    <h2 className="text-xl font-semibold text-gray-800">{exam.title}</h2>
                    <p className="text-gray-600 mb-2">{exam.description}</p>
                    <p className="text-sm text-gray-500">
                      Start: {formatDate(exam.startTime)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Duration: {exam.duration} minutes
                    </p>
                    {attemptStatus[exam._id] ? (
                      <button
                        onClick={() => handleShowResult(exam._id)}
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        Show Result
                      </button>
                    ) : (
                      <p className="mt-4 text-sm text-gray-500">Not attempted</p>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Detailed Result View */
            <div className="bg-white shadow-md rounded-lg p-8">
              <button
                onClick={() => setSelectedAttempt(null)}
                className="mb-4 text-blue-500 hover:underline"
              >
                ← Back to Exams
              </button>
              <h2 className="text-2xl font-bold mb-4">{selectedAttempt.examId.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p><strong>Score:</strong> {selectedAttempt.score}</p>
                  <p><strong>Total Questions:</strong> {selectedAttempt.totalQuestions}</p>
                  <p><strong>Questions Attempted:</strong> {selectedAttempt.questionsAttempted}</p>
                  <p><strong>Correct Answers:</strong> {selectedAttempt.performanceAnalytics?.correctCount ?? 'Calculating...'}</p>
  <p><strong>Incorrect Answers:</strong> {selectedAttempt.performanceAnalytics?.incorrectCount ?? 'Calculating...'}</p>
                  <p><strong>Duration:</strong> {selectedAttempt.durationMinutes || 'Calculating...'} minutes</p>
                </div>
                <div>
                  <p><strong>Accuracy:</strong> {selectedAttempt.performanceAnalytics?.accuracy?.toFixed(2) ?? 0}%</p>
                  <p><strong>Avg. Time per Question:</strong> {(selectedAttempt.performanceAnalytics?.timeManagement || 0).toFixed(2)} seconds</p>
                  <p><strong>Strong Sections:</strong> {formatSections(selectedAttempt.performanceAnalytics?.strongSections)}</p>
                  <p><strong>Weak Sections:</strong> {formatSections(selectedAttempt.performanceAnalytics?.weakSections)}</p>
                </div>
              </div>

              {/* Cheating Logs */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Cheating Logs</h3>
                <p><strong>Total Attempts:</strong> {selectedAttempt.cheatingAttempts || 0}</p>
                {selectedAttempt.cheatingLogs?.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {selectedAttempt.cheatingLogs.map((log, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {log.type} at {formatDate(log.timestamp)}: {log.description || 'No description'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">No cheating attempts detected.</p>
                )}
              </div>

              {/* Feedback Display */}
              {isFeedbackSubmitted && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Your Feedback</h3>
                  <p><strong>Mood:</strong> {selectedAttempt.feedback.mood || 'N/A'}</p>
                  <p><strong>Rating:</strong> {renderStars(selectedAttempt.feedback.rating)}</p>
                  <p><strong>Confidence Level:</strong> {selectedAttempt.feedback.confidenceLevel || 'N/A'}</p>
                  <p><strong>Comments:</strong> {selectedAttempt.feedback.comments || 'None'}</p>
                  <p><strong>Submitted:</strong> {selectedAttempt.feedback.timestamp ? formatDate(selectedAttempt.feedback.timestamp) : 'N/A'}</p>
                </div>
              )}

              {/* Feedback Submission Form */}
              {!isFeedbackSubmitted && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Submit Feedback</h3>
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mood</label>
                      <select
                        value={feedback.mood}
                        onChange={(e) => setFeedback({ ...feedback, mood: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        required
                      >
                        <option value="">Select mood</option>
                        {['happy', 'sad', 'neutral', 'confused', 'stressed', 'confident'].map((mood) => (
                          <option key={mood} value={mood}>
                            {mood.charAt(0).toUpperCase() + mood.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rating</label>
                      <div className="mt-1">{renderStars(feedback.rating || 0, true)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Confidence Level</label>
                      <select
                        value={feedback.confidenceLevel}
                        onChange={(e) => setFeedback({ ...feedback, confidenceLevel: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Comments</label>
                      <textarea
                        value={feedback.comments}
                        onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        rows="4"
                        maxLength="500"
                        placeholder="Share your thoughts about the exam..."
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      disabled={loading || !selectedAttempt?.examId?._id}
                    >
                      {loading ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </form>
                </div>
              )}

              {/* Question-wise Analysis */}
              <h3 className="text-lg font-semibold mb-4">Question-wise Analysis</h3>
              {selectedAttempt.answers.map((answer, index) => {
                const question = answer.questionId;
                const explanation = selectedAttempt.questionExplanations?.find(
                  (exp) => exp.questionId.toString() === question._id.toString()
                );
                const isCorrect =
                  answer.selectedOptions?.sort().join(',') ===
                  question.correctAnswers?.sort().join(',');

                return (
                  <div key={answer._id || index} className="mb-4 p-4 bg-gray-50 rounded">
                    <p className="font-medium">
                      Q{index + 1}: {question.questionText}
                    </p>
                    {question.imageUrl && (
                      <img
                        src={question.imageUrl}
                        alt="Question image"
                        className="mt-2 max-w-full h-auto rounded"
                        onError={(e) => (e.target.src = '/placeholder-image.jpg')}
                      />
                    )}
                    <p>
                      <strong>Your Answer:</strong>{' '}
                      {answer.selectedOptions?.length > 0
                        ? answer.selectedOptions
                            .map((opt) => question.options[opt]?.optionText || `Option ${opt}`)
                            .join(', ')
                        : 'Not answered'}
                    </p>
                    {answer.selectedOptions?.map((opt, i) => (
                      question.options[opt]?.imageUrl && (
                        <img
                          key={i}
                          src={question.options[opt].imageUrl}
                          alt={`Option ${opt} image`}
                          className="mt-2 max-w-xs h-auto rounded"
                          onError={(e) => (e.target.src = '/placeholder-image.jpg')}
                        />
                      )
                    ))}
                    <p>
                      <strong>Correct Answer:</strong>{' '}
                      {question.correctAnswers
                        ?.map((opt) => question.options[opt]?.optionText || `Option ${opt}`)
                        ?.join(', ')}
                    </p>
                    {question.correctAnswers?.map((opt, i) => (
                      question.options[opt]?.imageUrl && (
                        <img
                          key={i}
                          src={question.options[opt].imageUrl}
                          alt={`Correct option ${opt} image`}
                          className="mt-2 max-w-xs h-auto rounded"
                          onError={(e) => (e.target.src = '/placeholder-image.jpg')}
                        />
                      )
                    ))}
                    <p>
                      <strong>Status:</strong>{' '}
                      <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </p>
                    <p><strong>Time Spent:</strong> {answer.timeSpentSeconds || 0} seconds</p>
                    <p><strong>Attempt Status:</strong> {answer.attemptStatus || 'N/A'}</p>
                    <p><strong>Section:</strong> {answer.section || 'N/A'}</p>
                    {explanation?.explanation && (
                      <div className="mt-2 p-2 bg-blue-50 rounded">
                        <p className="font-medium">Explanation:</p>
                        <p>{explanation.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
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