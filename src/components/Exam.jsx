import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit2, Eye, ArrowLeft, Plus, X } from 'lucide-react';
import axiosInstance from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// Backend base URL (adjust if your backend runs on a different port or domain)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


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
    questionImage: null,
    imageUrl: '',
    options: [
      { optionText: '', optionImage: null, imageUrl: '' },
      { optionText: '', optionImage: null, imageUrl: '' },
      { optionText: '', optionImage: null, imageUrl: '' },
      { optionText: '', optionImage: null, imageUrl: '' },
    ],
    correctAnswers: [],
    marks: 1,
    negativeMarks: 0,
    difficulty: 'none',
    tags: [],
    explanation: '',
  });
  const [tagInput, setTagInput] = useState('');
  const sections = ['Physics', 'Chemistry', 'Math', 'Biology'];

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
      const examResponse = await axiosInstance.get(`/exams/${examId}`);
      const updatedExam = examResponse.data.exam;
      setCurrentExam(updatedExam);
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

  // Handle question image selection
  const handleQuestionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQuestionForm((prev) => ({
        ...prev,
        questionImage: file,
      }));
    }
  };

  // Clear question image
  const clearQuestionImage = () => {
    setQuestionForm((prev) => ({
      ...prev,
      questionImage: null,
      imageUrl: '',
    }));
  };

  // Handle option changes
  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...questionForm.options];
    updatedOptions[index][field] = value;
    setQuestionForm({ ...questionForm, options: updatedOptions });
  };

  // Handle option image selection
  const handleOptionImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const updatedOptions = [...questionForm.options];
      updatedOptions[index].optionImage = file;
      setQuestionForm({ ...questionForm, options: updatedOptions });
    }
  };

  // Clear option image
  const clearOptionImage = (index) => {
    const updatedOptions = [...questionForm.options];
    updatedOptions[index].optionImage = null;
    updatedOptions[index].imageUrl = '';
    setQuestionForm({ ...questionForm, options: updatedOptions });
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

  // Add option
  const addOption = () => {
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, { optionText: '', optionImage: null, imageUrl: '' }],
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
      questionImage: null,
      imageUrl: question.imageUrl || '',
      options: question.options.map((opt) => ({
        optionText: opt.optionText,
        optionImage: null,
        imageUrl: opt.imageUrl || '',
      })),
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
      const formData = new FormData();
      formData.append('examId', currentExam._id);
      formData.append('section', questionForm.section);
      formData.append('questionText', questionForm.questionText);
      formData.append('options', JSON.stringify(questionForm.options.map(opt => ({
        optionText: opt.optionText,
        imageUrl: opt.imageUrl || '',
      }))));
      questionForm.correctAnswers.forEach((answer, index) => {
        formData.append(`correctAnswers[${index}]`, answer);
      });
      formData.append('marks', questionForm.marks);
      formData.append('negativeMarks', questionForm.negativeMarks);
      formData.append('difficulty', questionForm.difficulty);
      formData.append('tags', JSON.stringify(questionForm.tags));
      formData.append('explanation', questionForm.explanation);

      if (questionForm.questionImage) {
        formData.append('questionImage', questionForm.questionImage);
      }

      questionForm.options.forEach((option) => {
        if (option.optionImage) {
          formData.append('optionImages', option.optionImage);
        }
      });

      if (editingQuestion) {
        if (!questionForm.questionImage && questionForm.imageUrl) {
          formData.append('imageUrl', questionForm.imageUrl);
        }
        await axiosInstance.put(`/questions/${editingQuestion._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setEditingQuestion(null);
      } else {
        await axiosInstance.post('/questions', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
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
      questionImage: null,
      imageUrl: '',
      options: [
        { optionText: '', optionImage: null, imageUrl: '' },
        { optionText: '', optionImage: null, imageUrl: '' },
        { optionText: '', optionImage: null, imageUrl: '' },
        { optionText: '', optionImage: null, imageUrl: '' },
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
                  <td className="px-6愿望 py-4 whitespace-nowrap">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <button
              onClick={() => setView('exams')}
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Exams
            </button>
            <div className="mt-3">
              <h1 className="text-3xl font-bold text-gray-900">{currentExam.title}</h1>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <span>{new Date(currentExam.examDate).toLocaleDateString()}</span>
                <span className="mx-2">•</span>
                <span>{currentExam.duration} minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Question Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {editingQuestion ? 'Update the question details below' : 'Create a new question for this exam'}
            </p>
          </div>
          
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Section Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="section"
                    value={questionForm.section}
                    onChange={handleQuestionChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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

                {/* Marks and Negative Marks */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Marks
                    </label>
                    <input
                      name="marks"
                      type="number"
                      value={questionForm.marks}
                      onChange={handleQuestionChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Negative Marks
                    </label>
                    <input
                      name="negativeMarks"
                      type="number"
                      value={questionForm.negativeMarks}
                      onChange={handleQuestionChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      min="0"
                      step="0.25"
                    />
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    name="difficulty"
                    value={questionForm.difficulty}
                    onChange={handleQuestionChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="none">Not Specified</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInput}
                      placeholder="Type a tag and press Enter or Add"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleTagInput({ key: 'Enter', preventDefault: () => {} });
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                      disabled={!tagInput.trim()}
                    >
                      Add
                    </button>
                  </div>
                  {questionForm.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {questionForm.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full border border-blue-200"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="ml-2 text-blue-500 hover:text-blue-700 transition-colors duration-200"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Question Text */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Question Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="questionText"
                    value={questionForm.questionText}
                    onChange={handleQuestionChange}
                    placeholder="Enter your question here. Use $...$ for inline LaTeX or $$...$$ for display math"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    rows="4"
                    required
                  />
                  {questionForm.questionText && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                      <p className="text-xs font-medium text-gray-600 mb-2">Preview:</p>
                      <div className="text-sm">{renderMathOrText(questionForm.questionText)}</div>
                    </div>
                  )}
                </div>

                {/* Question Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Question Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleQuestionImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  {(questionForm.questionImage || questionForm.imageUrl) && (
                    <div className="mt-2 flex items-center">
                      <img
                        src={questionForm.questionImage ? URL.createObjectURL(questionForm.questionImage) : `${BASE_URL}${questionForm.imageUrl}`}
                        alt="Question preview"
                        className="max-h-24 object-contain rounded border"
                        onError={(e) => { e.target.src = '/fallback-image.jpg'; }} // Fallback for broken images
                      />
                      <button
                        type="button"
                        onClick={clearQuestionImage}
                        className="ml-3 text-red-500 hover:text-red-700 transition-colors duration-200"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Explanation
                  </label>
                  <textarea
                    name="explanation"
                    value={questionForm.explanation}
                    onChange={handleQuestionChange}
                    placeholder="Provide an explanation for the correct answer. Use $...$ for LaTeX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    rows="3"
                  />
                  {questionForm.explanation && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                      <p className="text-xs font-medium text-gray-600 mb-2">Preview:</p>
                      <div className="text-sm">{renderMathOrText(questionForm.explanation)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Options Section */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Answer Options <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addOption}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                >
                  <Plus size={14} className="mr-1" />
                  Add Option
                </button>
              </div>
              
              <div className="space-y-4">
                {questionForm.options.map((option, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center pt-2">
                        <input
                          type="checkbox"
                          checked={questionForm.correctAnswers.includes(index)}
                          onChange={() => toggleCorrectAnswer(index)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Option {String.fromCharCode(65 + index)}
                          </span>
                          {questionForm.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="text-red-500 hover:text-red-700 transition-colors duration-200"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        
                        <input
                          value={option.optionText}
                          onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                          placeholder={`Enter option ${String.fromCharCode(65 + index)} (Supports LaTeX)`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                        
                        {option.optionText && (
                          <div className="p-2 bg-white rounded border">
                            <p className="text-xs text-gray-600 mb-1">Preview:</p>
                            <div className="text-sm">{renderMathOrText(option.optionText)}</div>
                          </div>
                        )}
                        
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={(e) => handleOptionImageChange(index, e)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                        
                        {(option.optionImage || option.imageUrl) && (
                          <div className="mt-2 flex items-center">
                            <img
                              src={option.optionImage ? URL.createObjectURL(option.optionImage) : `${BASE_URL}${option.imageUrl}`}
                              alt={`Option ${String.fromCharCode(65 + index)}`}
                              className="max-h-24 object-contain rounded border"
                              onError={(e) => { e.target.src = '/fallback-image.jpg'; }} // Fallback for broken images
                            />
                            <button
                              type="button"
                              onClick={() => clearOptionImage(index)}
                              className="ml-3 text-red-500 hover:text-red-700 transition-colors duration-200"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Check the box next to correct answer(s)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end space-x-3">
              {editingQuestion && (
                <button
                  type="button"
                  onClick={() => {
                    resetQuestionForm();
                    setEditingQuestion(null);
                  }}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm"
              >
                {editingQuestion ? 'Update Question' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
            <p className="mt-1 text-sm text-gray-600">
              {questions.length} question{questions.length !== 1 ? 's' : ''} added
            </p>
          </div>
          
          {questions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
              <p className="text-gray-500">Get started by adding your first question above.</p>
            </div>
          ) : (
            <div>
              {sections.map((section) => {
                const sectionQuestions = questions.filter((q) => q.section === section);
                if (sectionQuestions.length === 0) return null;
                
                return (
                  <div key={section} className="border-b border-gray-200 last:border-b-0">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">{section}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {sectionQuestions.length} question{sectionQuestions.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                      {sectionQuestions.map((question, index) => (
                        <div key={question._id} className="px-6 py-6">
                          {/* Question Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Q{index + 1}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {question.marks} mark{question.marks !== 1 ? 's' : ''}
                                </span>
                                {question.negativeMarks > 0 && (
                                  <span className="text-sm text-red-600">
                                    -{question.negativeMarks} negative
                                  </span>
                                )}
                                {question.difficulty !== 'none' && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                    question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {question.difficulty}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => initQuestionEdit(question)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                title="Edit Question"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(question._id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                                title="Delete Question"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Question Content */}
                          <div className="space-y-4">
                            <div className="text-gray-900">
                              {renderMathOrText(question.questionText)}
                            </div>
                            
                            {question.imageUrl && (
                              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <img 
                                  src={`${BASE_URL}${question.imageUrl}`} 
                                  alt="Question" 
                                  className="max-h-48 object-contain mx-auto rounded"
                                  onError={(e) => { e.target.src = '/fallback-image.jpg'; console.error(`Failed to load image: ${BASE_URL}${question.imageUrl}`); }}
                                />
                              </div>
                            )}

                            {/* Options */}
                            <div className="space-y-2">
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className={`p-3 rounded-lg border ${
                                    question.correctAnswers.includes(optIndex)
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-start space-x-3">
                                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-full">
                                      {String.fromCharCode(65 + optIndex)}
                                    </span>
                                    <div className="flex-1">
                                      <div className="text-sm text-gray-900">
                                        {renderMathOrText(option.optionText)}
                                      </div>
                                      {option.imageUrl && (
                                        <img
                                          src={`${BASE_URL}${option.imageUrl}`}
                                          alt={`Option ${String.fromCharCode(65 + optIndex)}`}
                                          className="max-h-20 object-contain mt-2 rounded"
                                          onError={(e) => { e.target.src = '/fallback-image.jpg'; console.error(`Failed to load image: ${BASE_URL}${option.imageUrl}`); }}
                                        />
                                      )}
                                    </div>
                                    {question.correctAnswers.includes(optIndex) && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Correct
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Tags */}
                            {question.tags && question.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                <span className="text-sm font-medium text-gray-700">Tags:</span>
                                {question.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Explanation */}
                            {question.explanation && (
                              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <p className="text-sm font-semibold text-blue-900 mb-2">Explanation:</p>
                                <div className="text-sm text-blue-800">
                                  {renderMathOrText(question.explanation)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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