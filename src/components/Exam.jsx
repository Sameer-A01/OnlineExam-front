import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit2, Eye, ArrowLeft, X } from 'lucide-react';
import axiosInstance from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const ExamAdmin = () => {
  const navigate = useNavigate();
  // States
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('exams'); // 'exams', 'createExam', 'editExam', 'questions'
  const [currentExam, setCurrentExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [students, setStudents] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    examDate: '',
    startTime: '',
    duration: '',
    visibility: 'public',
    assignedTo: [],
    randomizeQuestions: false,
  });
  const [questionForm, setQuestionForm] = useState({
    section: '',
    questionText: '',
    imageUrl: '',
    options: [
      { optionText: '', imageUrl: '' },
      { optionText: '', imageUrl: '' },
      { optionText: '', imageUrl: '' },
      { optionText: '', imageUrl: '' },
    ],
    correctAnswers: [],
    marks: 1,
    negativeMarks: 0,
    difficulty: 'none',
    tags: [],
    explanation: '',
  });
  const [tagInput, setTagInput] = useState('');
  const sections = ['Physics', 'Chemistry', 'Math'];

  // Fetch exams
  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/exams');
      setExams(response.data.exams || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      alert('Failed to load exams');
    }
    setLoading(false);
  };

  // Fetch batches
  const fetchBatches = async () => {
    try {
      const response = await axiosInstance.get('/batches');
      setBatches(response.data.data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      alert('Failed to load batches');
    }
  };

  // Fetch students by batch
  const fetchStudentsByBatch = async (batchId) => {
    try {
      const response = await axiosInstance.get(`/users?batch=${batchId}`);
      setStudents(response.data.users || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Failed to load students');
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // Fetch questions for an exam
  const fetchQuestions = async (examId) => {
    try {
      // Fetch latest exam data to ensure randomizeQuestions is current
      const examResponse = await axiosInstance.get(`/exams/${examId}`);
      const updatedExam = examResponse.data.exam;
      setCurrentExam(updatedExam);
      console.log('Fetching questions with randomize:', updatedExam.randomizeQuestions); // Debug
      const response = await axiosInstance.get(
        `/questions/exam/${examId}?random=${updatedExam.randomizeQuestions || false}`
      );
      setQuestions(response.data.questions || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      alert('Failed to load questions');
    }
  };

  // Handle exam form changes
  const handleExamChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (name === 'visibility' && value === 'private') {
      fetchBatches();
    }
    if (name === 'visibility' && value === 'public') {
      setFormData((prev) => ({
        ...prev,
        assignedTo: [],
      }));
      setBatches([]);
      setStudents([]);
      setSelectedBatch('');
    }
  };

  // Handle batch selection
  const handleBatchChange = async (e) => {
    const batchId = e.target.value;
    setSelectedBatch(batchId);
    if (batchId) {
      await fetchStudentsByBatch(batchId);
    } else {
      setStudents([]);
    }
  };

  // Handle student selection
  const handleStudentSelection = (e) => {
    const selectedStudents = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prev) => ({
      ...prev,
      assignedTo: selectedStudents,
    }));
  };

  // Handle exam creation
  const handleCreateExam = async () => {
    try {
      const startDateTime = new Date(formData.startTime);
      const endDateTime = new Date(startDateTime.getTime() + formData.duration * 60000);
      const payload = {
        ...formData,
        examDate: new Date(formData.examDate),
        startTime: startDateTime,
        endTime: endDateTime,
      };
      console.log('Creating exam with payload:', payload); // Debug
      const response = await axiosInstance.post('/exams', payload);
      setCurrentExam(response.data.exam);
      resetExamForm();
      setView('questions');
      fetchExams();
    } catch (error) {
      console.error('Failed to create exam:', error);
      alert('Exam creation failed');
    }
  };

  // Handle exam update
  const handleUpdateExam = async () => {
    try {
      const startDateTime = new Date(formData.startTime);
      const endDateTime = new Date(startDateTime.getTime() + formData.duration * 60000);
      const payload = {
        ...formData,
        examDate: new Date(formData.examDate),
        startTime: startDateTime,
        endTime: endDateTime,
      };
      console.log('Updating exam with payload:', payload); // Debug
      await axiosInstance.put(`/exams/${currentExam._id}`, payload);
      alert('Exam updated successfully');
      resetExamForm();
      setView('exams');
      fetchExams();
    } catch (error) {
      console.error('Failed to update exam:', error);
      alert('Exam update failed');
    }
  };

  // Handle exam deletion
  const handleDeleteExam = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam? This will also delete all associated questions.')) return;
    try {
      await axiosInstance.delete(`/exams/${id}`);
      fetchExams();
    } catch (err) {
      alert('Delete failed');
    }
  };

  // Reset exam form
  const resetExamForm = () => {
    setFormData({
      title: '',
      description: '',
      examDate: '',
      startTime: '',
      duration: '',
      visibility: 'public',
      assignedTo: [],
      randomizeQuestions: false,
    });
    setBatches([]);
    setStudents([]);
    setSelectedBatch('');
  };

  // Initialize exam edit
  const initExamEdit = (exam) => {
    console.log('Exam data from backend:', exam); // Debug
    const examDate = new Date(exam.examDate).toISOString().split('T')[0];
    const startTime = new Date(exam.startTime).toISOString().slice(0, 16);
    setFormData({
      title: exam.title,
      description: exam.description || '',
      examDate,
      startTime,
      duration: exam.duration,
      visibility: exam.visibility,
      assignedTo: exam.assignedTo || [],
      randomizeQuestions: exam.randomizeQuestions || false,
    });
    setCurrentExam(exam);
    if (exam.visibility === 'private') {
      fetchBatches();
      if (exam.assignedTo && exam.assignedTo.length > 0) {
        setStudents(exam.assignedTo);
      }
    }
    setView('editExam');
  };

  // Initialize question management
  const manageQuestions = (exam) => {
    setCurrentExam(exam);
    fetchQuestions(exam._id);
    setView('questions');
  };

  // Handle question form changes
  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setQuestionForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle tag input
  const handleTagInput = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      setQuestionForm((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (index) => {
    setQuestionForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  // Handle option changes
  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...questionForm.options];
    updatedOptions[index][field] = value;
    setQuestionForm({ ...questionForm, options: updatedOptions });
  };

  // Add option
  const addOption = () => {
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, { optionText: '', imageUrl: '' }],
    });
  };

  // Remove option
  const removeOption = (index) => {
    if (questionForm.options.length <= 2) {
      alert('A question must have at least 2 options');
      return;
    }
    const updatedOptions = questionForm.options.filter((_, i) => i !== index);
    let updatedCorrectAnswers = questionForm.correctAnswers
      .filter((answerIndex) => answerIndex !== index)
      .map((answerIndex) => (answerIndex > index ? answerIndex - 1 : answerIndex));
    setQuestionForm({
      ...questionForm,
      options: updatedOptions,
      correctAnswers: updatedCorrectAnswers,
    });
  };

  // Toggle correct answer
  const toggleCorrectAnswer = (index) => {
    const currentCorrectAnswers = [...questionForm.correctAnswers];
    const answerIndex = currentCorrectAnswers.indexOf(index);
    if (answerIndex === -1) {
      currentCorrectAnswers.push(index);
    } else {
      currentCorrectAnswers.splice(answerIndex, 1);
    }
    setQuestionForm({ ...questionForm, correctAnswers: currentCorrectAnswers });
  };

  // Initialize question edit
  const initQuestionEdit = (question) => {
    setEditingQuestion(question);
    setQuestionForm({
      section: question.section || '',
      questionText: question.questionText,
      imageUrl: question.imageUrl || '',
      options: question.options,
      correctAnswers: question.correctAnswers,
      marks: question.marks,
      negativeMarks: question.negativeMarks,
      difficulty: question.difficulty || 'none',
      tags: question.tags || [],
      explanation: question.explanation || '',
    });
    setTagInput('');
  };

  // Add or update question
  const handleAddQuestion = async () => {
    if (questionForm.questionText.trim() === '') {
      alert('Question text is required');
      return;
    }
    if (!questionForm.section) {
      alert('Section is required');
      return;
    }
    if (questionForm.correctAnswers.length === 0) {
      alert('Please select at least one correct answer');
      return;
    }
    try {
      const payload = {
        ...questionForm,
        examId: currentExam._id,
      };
      if (editingQuestion) {
        await axiosInstance.put(`/questions/${editingQuestion._id}`, payload);
        setEditingQuestion(null);
      } else {
        await axiosInstance.post('/questions', payload);
      }
      fetchQuestions(currentExam._id);
      resetQuestionForm();
    } catch (error) {
      console.error('Failed to process question:', error);
      alert(editingQuestion ? 'Question update failed' : 'Question creation failed');
    }
  };

  // Delete question
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await axiosInstance.delete(`/questions/${id}`);
      fetchQuestions(currentExam._id);
    } catch (err) {
      alert('Delete failed');
    }
  };

  // Reset question form
  const resetQuestionForm = () => {
    setQuestionForm({
      section: '',
      questionText: '',
      imageUrl: '',
      options: [
        { optionText: '', imageUrl: '' },
        { optionText: '', imageUrl: '' },
        { optionText: '', imageUrl: '' },
        { optionText: '', imageUrl: '' },
      ],
      correctAnswers: [],
      marks: 1,
      negativeMarks: 0,
      difficulty: 'none',
      tags: [],
      explanation: '',
    });
    setTagInput('');
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

  // Render exam form
  const renderExamForm = (isEdit = false) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">{isEdit ? 'Edit Exam' : 'Create New Exam'}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleExamChange}
            placeholder="Exam Title"
            className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleExamChange}
            placeholder="Exam Description"
            className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
            rows="3"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date</label>
            <input
              name="examDate"
              type="date"
              value={formData.examDate}
              onChange={handleExamChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              name="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={handleExamChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
            <input
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleExamChange}
              placeholder="Duration in minutes"
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleExamChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="randomizeQuestions"
              checked={formData.randomizeQuestions || false}
              onChange={handleExamChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              Randomize Question Order (within sections)
            </span>
          </label>
        </div>
        {formData.visibility === 'private' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch</label>
              <select
                value={selectedBatch}
                onChange={handleBatchChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              >
                <option value="">Select a batch</option>
                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedBatch && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Students</label>
                <div className="flex justify-between items-center mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allStudentIds = students.map((student) => student._id);
                      setFormData((prev) => ({
                        ...prev,
                        assignedTo: allStudentIds,
                      }));
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        assignedTo: [],
                      }));
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Deselect All
                  </button>
                </div>
                <select
                  multiple
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleStudentSelection}
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
                  size="5"
                >
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name || student.email || `User ${student._id}`}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Hold Ctrl/Cmd to select multiple students or use Select All
                </p>
              </div>
            )}
          </>
        )}
        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={() => {
              resetExamForm();
              setView('exams');
            }}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={isEdit ? handleUpdateExam : handleCreateExam}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            {isEdit ? 'Update Exam' : 'Create Exam'}
          </button>
        </div>
      </div>
    </div>
  );

  // Render exams list
  const renderExamsList = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Exams</h1>
        <button
          onClick={() => setView('createExam')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <PlusCircle size={16} className="mr-2" />
          Create Exam
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading exams...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-500">No exams found. Create your first exam!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibility</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exams.map((exam) => (
                <tr key={exam._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-normal">
                    <div className="text-sm font-medium text-gray-900">{exam.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{exam.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(exam.examDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(exam.startTime).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{exam.duration} min</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      exam.visibility === 'public' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {exam.visibility}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => manageQuestions(exam)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Manage Questions"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => initExamEdit(exam)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Exam"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteExam(exam._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Exam"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => navigate(`/admin-dashboard/results/${exam._id}`)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                        title="View Results"
                      >
                        Results
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Render question management
  const renderQuestionManagement = () => (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setView('exams')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Exams
        </button>
        <div className="mt-2">
          <h1 className="text-2xl font-bold">{currentExam.title} - Questions</h1>
          <p className="text-gray-600">{new Date(currentExam.examDate).toLocaleDateString()} | {currentExam.duration} minutes</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">{editingQuestion ? 'Edit Question' : 'Add New Question'}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              name="section"
              value={questionForm.section}
              onChange={handleQuestionChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              required
            >
              <option value="">Select a section</option>
              {sections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text (Supports LaTeX, e.g., $x^2$ or $$x^2$$)</label>
            <textarea
              name="questionText"
              value={questionForm.questionText}
              onChange={handleQuestionChange}
              placeholder="Enter your question here, use $...$ for inline LaTeX or $$...$$ for display math"
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              rows="2"
              required
            />
            <p className="mt-1 text-xs text-gray-500">Preview:</p>
            <div>{renderMathOrText(questionForm.questionText)}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Image URL (Optional)</label>
            <input
              name="imageUrl"
              value={questionForm.imageUrl}
              onChange={handleQuestionChange}
              placeholder="https://example.com/image.jpg"
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
              <input
                name="marks"
                type="number"
                value={questionForm.marks}
                onChange={handleQuestionChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Negative Marks</label>
              <input
                name="negativeMarks"
                type="number"
                value={questionForm.negativeMarks}
                onChange={handleQuestionChange}
                className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              name="difficulty"
              value={questionForm.difficulty}
              onChange={handleQuestionChange}
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
            >
              <option value="none">None</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInput}
              placeholder="Type a tag and press Enter"
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
            />
            <p className="mt-1 text-xs text-gray-500">Press Enter to add a tag</p>
            {questionForm.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {questionForm.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (Supports LaTeX)</label>
            <textarea
              name="explanation"
              value={questionForm.explanation}
              onChange={handleQuestionChange}
              placeholder="Provide an explanation for the correct answer, use $...$ for LaTeX"
              className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
              rows="3"
            />
            <p className="mt-1 text-xs text-gray-500">Preview:</p>
            <div>{renderMathOrText(questionForm.explanation)}</div>
          </div>
          <div>
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">Options</label>
              <button
                type="button"
                onClick={addOption}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Option
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {questionForm.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={questionForm.correctAnswers.includes(index)}
                    onChange={() => toggleCorrectAnswer(index)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-grow space-y-2">
                    <input
                      value={option.optionText}
                      onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                      placeholder={`Option ${index + 1} (Supports LaTeX, e.g., $x^2$)`}
                      className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
                    />
                    <div>{renderMathOrText(option.optionText)}</div>
                    <input
                      value={option.imageUrl}
                      onChange={(e) => handleOptionChange(index, 'imageUrl', e.target.value)}
                      placeholder="Option Image URL (Optional)"
                      className="w-full p-2 border rounded focus:ring focus:ring-blue-300"
                    />
                    {option.imageUrl && (
                      <img src={option.imageUrl} alt={`Option ${index + 1}`} className="max-h-20 object-contain" />
                    )}
                  </div>
                  {questionForm.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">Check the box for correct answer(s)</p>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {editingQuestion ? 'Update Question' : 'Add Question'}
            </button>
            {editingQuestion && (
              <button
                type="button"
                onClick={() => {
                  resetQuestionForm();
                  setEditingQuestion(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md">
        <h2 className="p-4 border-b text-lg font-semibold">Question List</h2>
        {questions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No questions have been added to this exam yet.
          </div>
        ) : (
          <div className="divide-y">
            {sections.map((section) => {
              const sectionQuestions = questions.filter((q) => q.section === section);
              if (sectionQuestions.length === 0) return null;
              return (
                <div key={section}>
                  <h3 className="p-4 text-lg font-medium bg-gray-50">{section}</h3>
                  {sectionQuestions.map((question, index) => (
                    <div key={question._id} className="p-4">
                      <div className="flex justify-between">
                        <h3 className="font-medium">Question {index + 1}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Marks: {question.marks}</span>
                          <span className="text-sm text-gray-600">Difficulty: {question.difficulty}</span>
                          <button
                            onClick={() => initQuestionEdit(question)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Question"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div>{renderMathOrText(question.questionText)}</div>
                      {question.imageUrl && (
                        <div className="my-2">
                          <img src={question.imageUrl} alt="Question" className="max-h-40 object-contain" />
                        </div>
                      )}
                      <div className="mt-2 space-y-1">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`p-2 rounded ${
                              question.correctAnswers.includes(optIndex)
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-gray-50'
                            }`}
                          >
                            <div>{renderMathOrText(option.optionText)}</div>
                            {option.imageUrl && (
                              <img
                                src={option.imageUrl}
                                alt={`Option ${optIndex + 1}`}
                                className="max-h-20 object-contain mt-1"
                              />
                            )}
                            {question.correctAnswers.includes(optIndex) && (
                              <span className="ml-2 text-xs text-green-600">✓ Correct</span>
                            )}
                          </div>
                        ))}
                      </div>
                      {question.tags && question.tags.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-gray-700">Tags: </span>
                          {question.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {question.explanation && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-gray-700">Explanation: </span>
                          <div>{renderMathOrText(question.explanation)}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Main render
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {view === 'exams' && renderExamsList()}
      {view === 'createExam' && renderExamForm(false)}
      {view === 'editExam' && renderExamForm(true)}
      {view === 'questions' && renderQuestionManagement()}
    </div>
  );
};

export default ExamAdmin;