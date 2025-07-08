import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Send,
  ArrowLeft,
  X,
  Award,
  Calendar,
  FileText,
  Upload,
  Eye,
  EyeOff,
  Target,
  TrendingUp,
  Save,
  Edit3,
  Lock,
  Unlock
} from 'lucide-react';
import Button from '../UI/Button';
import { Assignment, AssignmentSubmission, AssignmentResult } from '../../types/assignment';
import { getTimeRemaining, isAssignmentOverdue, canEditAssignment } from '../../services/assignmentService';

interface AssignmentInterfaceProps {
  assignment: Assignment;
  onSubmit: (answers: Record<string, any>, isFinal: boolean) => void;
  onCancel: () => void;
  onStart: () => void;
  isLoading: boolean;
  latestSubmission: AssignmentSubmission | null;
  assignmentResult: AssignmentResult | null;
  canSubmit: boolean;
  onRetake?: () => void;
  onGoBack?: () => void;
}

const AssignmentInterface: React.FC<AssignmentInterfaceProps> = ({
  assignment,
  onSubmit,
  onCancel,
  onStart,
  isLoading,
  latestSubmission,
  assignmentResult,
  canSubmit,
  onRetake,
  onGoBack
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assignmentStarted, setAssignmentStarted] = useState(false);
  const [assignmentCompleted, setAssignmentCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const isOverdue = isAssignmentOverdue(assignment);
  const canEdit = canEditAssignment(assignment);

  useEffect(() => {
    if (assignmentStarted && assignment.timeLimit && !assignmentCompleted) {
      const timer = setInterval(() => {
        const remaining = getTimeRemaining(assignment);
        setTimeRemaining(remaining);
        
        if (remaining === 'Overdue') {
          handleAutoSubmit();
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [assignmentStarted, assignment, assignmentCompleted]);

  useEffect(() => {
    if (latestSubmission && !assignmentStarted) {
      setAnswers(latestSubmission.answers || {});
      if (latestSubmission.isSubmitted) {
        setAssignmentCompleted(true);
        setShowResults(true);
      }
    }
  }, [latestSubmission, assignmentStarted]);

  useEffect(() => {
    if (hasUnsavedChanges && assignmentStarted && !assignmentCompleted && canEdit) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 3000);
      
      setAutoSaveTimer(timer);
    }
    
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [answers, hasUnsavedChanges]);

  const handleStartAssignment = () => {
    setAssignmentStarted(true);
    onStart();
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    setHasUnsavedChanges(true);
  };

  const handleAutoSave = async () => {
    if (hasUnsavedChanges && canEdit) {
      try {
        await onSubmit(answers, false);
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  };

  const handleAutoSubmit = async () => {
    if (assignmentStarted && !assignmentCompleted) {
      try {
        await onSubmit(answers, true);
        setAssignmentCompleted(true);
        setShowResults(true);
      } catch (error) {
        console.error('Auto-submit failed:', error);
      }
    }
  };

  const handleFinalSubmit = async () => {
    try {
      await onSubmit(answers, true);
      setAssignmentCompleted(true);
      setShowResults(true);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Final submit failed:', error);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < assignment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const getQuestionProgress = () => {
    const answeredQuestions = assignment.questions.filter(q => answers[q.id] !== undefined).length;
    return (answeredQuestions / assignment.questions.length) * 100;
  };

  const renderQuestion = (question: any) => {
    const answer = answers[question.id];

    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {question.options.map((option: string, index: number) => (
              <label key={index} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  value={option}
                  checked={answer === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  disabled={!canEdit}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-3">
            {['True', 'False'].map((option) => (
              <label key={option} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={`question_${question.id}`}
                  value={option}
                  checked={answer === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  disabled={!canEdit}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'short-answer':
        return (
          <textarea
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            disabled={!canEdit}
            placeholder="Enter your answer..."
            className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        );

      case 'essay':
        return (
          <textarea
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            disabled={!canEdit}
            placeholder="Write your essay here..."
            className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={8}
          />
        );

      case 'file-upload':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleAnswerChange(question.id, file.name);
                }
              }}
              disabled={!canEdit}
              className="hidden"
              id={`file_${question.id}`}
            />
            <label htmlFor={`file_${question.id}`} className="cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Click to upload a file</p>
              {answer && <p className="text-sm text-green-600 mt-2">Uploaded: {answer}</p>}
            </label>
          </div>
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (!assignmentStarted && !latestSubmission) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
            <p className="text-gray-600">{assignment.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-700">Time Limit</span>
              </div>
              <p className="text-gray-600">
                {assignment.timeLimit ? `${assignment.timeLimit} minutes` : 'No time limit'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-700">Points</span>
              </div>
              <p className="text-gray-600">{assignment.totalPoints} points</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-700">Questions</span>
              </div>
              <p className="text-gray-600">{assignment.questions.length} questions</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-700">Due Date</span>
              </div>
              <p className="text-gray-600">
                {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
              </p>
            </div>
          </div>

          {isOverdue && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-700">
                  {assignment.allowLateSubmission ? 'Assignment Past Due Date' : 'Assignment Overdue'}
                </span>
              </div>
              <p className="text-red-600 mt-1">
                {assignment.allowLateSubmission 
                  ? 'Late submissions are allowed but may incur penalties.'
                  : 'This assignment is past its due date and no longer accepts submissions.'
                }
              </p>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>
            <Button 
              onClick={handleStartAssignment}
              disabled={!canSubmit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Start Assignment
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (showResults && assignmentResult) {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const deadlinePassed = now > dueDate;
    const canViewAnswers = deadlinePassed && assignment.showAnswersAfterDeadline;

    return (
      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              deadlinePassed && assignmentResult.submission.score !== undefined && assignmentResult.submission.score >= 70 
                ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {deadlinePassed && assignmentResult.submission.score !== undefined && assignmentResult.submission.score >= 70 ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <Clock className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignment Results</h1>
            <p className="text-gray-600">{assignment.title}</p>
          </div>

          {deadlinePassed ? (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {assignmentResult.submission.score || 0}/{assignment.totalPoints}
                </div>
                <p className="text-gray-600">Score</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {assignmentResult.submission.score ? Math.round((assignmentResult.submission.score / assignment.totalPoints) * 100) : 0}%
                </div>
                <p className="text-gray-600">Percentage</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  SUBMITTED
                </div>
                <p className="text-gray-600">Status</p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-center">
              <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Assignment Submitted</h3>
              <p className="text-blue-800">
                Your assignment has been submitted successfully. Results and feedback will be available after the due date: 
                <strong> {new Date(assignment.dueDate).toLocaleString()}</strong>
              </p>
            </div>
          )}

          {assignmentResult.submission.feedback && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Instructor Feedback</h3>
              <p className="text-blue-800">{assignmentResult.submission.feedback}</p>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={onGoBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>
            {!deadlinePassed && canEdit && (
              <Button onClick={onRetake} className="bg-blue-600 hover:bg-blue-700">
                Edit Assignment
              </Button>
            )}
          </div>

          {canViewAnswers && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Question Review</h3>
              
              <div className="space-y-6">
                {assignment.questions.map((question, index) => {
                  const userAnswer = assignmentResult.submission.answers[question.id];
                  const isCorrect = question.type === 'multiple-choice' 
                    ? userAnswer === question.correctAnswer
                    : question.type === 'short-answer'
                    ? userAnswer?.toString().toLowerCase().trim() === question.correctAnswer?.toString().toLowerCase().trim()
                    : undefined;

                  return (
                    <div key={question.id} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCorrect === true ? 'bg-green-100' : isCorrect === false ? 'bg-red-100' : 'bg-gray-100'
                          }`}>
                            {isCorrect === true ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : isCorrect === false ? (
                              <XCircle className="h-5 w-5 text-red-600" />
                            ) : (
                              <span className="text-gray-600 font-medium">{index + 1}</span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-600">Question {index + 1}</span>
                        </div>
                        <span className="text-sm text-gray-500">{question.points} pts</span>
                      </div>

                      <h4 className="text-gray-900 font-medium mb-4">{question.text}</h4>

                      {question.type === 'multiple-choice' && question.options && (
                        <div className="space-y-2 mb-4">
                          {question.options.map((option, optIndex) => {
                            const isUserAnswer = userAnswer === optIndex;
                            const isCorrectAnswer = question.correctAnswer === optIndex;
                            
                            return (
                              <div
                                key={optIndex}
                                className={`p-3 rounded-lg border-2 ${
                                  isCorrectAnswer
                                    ? 'border-green-500 bg-green-50'
                                    : isUserAnswer && !isCorrectAnswer
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200'
                                }`}
                              >
                                <div className="flex items-center">
                                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                    isCorrectAnswer
                                      ? 'border-green-500 bg-green-500'
                                      : isUserAnswer && !isCorrectAnswer
                                      ? 'border-red-500 bg-red-500'
                                      : 'border-gray-300'
                                  }`}>
                                    {(isCorrectAnswer || (isUserAnswer && !isCorrectAnswer)) && (
                                      <div className="w-2 h-2 rounded-full bg-white mx-auto mt-0.5" />
                                    )}
                                  </div>
                                  <span className={`${
                                    isCorrectAnswer
                                      ? 'text-green-700'
                                      : isUserAnswer && !isCorrectAnswer
                                      ? 'text-red-700'
                                      : 'text-gray-700'
                                  }`}>
                                    {option}
                                  </span>
                                  {isCorrectAnswer && (
                                    <span className="ml-2 text-xs text-green-600 font-medium">Correct</span>
                                  )}
                                  {isUserAnswer && !isCorrectAnswer && (
                                    <span className="ml-2 text-xs text-red-600 font-medium">Your Answer</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {(question.type === 'short-answer' || question.type === 'essay') && (
                        <div className="space-y-3 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Your Answer:</label>
                            <div className={`p-3 rounded-lg border-2 ${
                              isCorrect === true ? 'border-green-500 bg-green-50' : 
                              isCorrect === false ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
                            }`}>
                              <span className={
                                isCorrect === true ? 'text-green-700' : 
                                isCorrect === false ? 'text-red-700' : 'text-gray-700'
                              }>
                                {userAnswer || 'No answer provided'}
                              </span>
                            </div>
                          </div>
                          {isCorrect === false && question.correctAnswer && (
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-1">Correct Answer:</label>
                              <div className="p-3 rounded-lg border-2 border-green-500 bg-green-50">
                                <span className="text-green-700">{question.correctAnswer}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {question.explanation && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h5 className="text-sm font-medium text-blue-900 mb-2">Explanation:</h5>
                          <p className="text-blue-800 text-sm">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  const currentQuestion = assignment.questions[currentQuestionIndex];
  const progress = getQuestionProgress();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg"
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
            <div className="flex items-center space-x-4">
              {assignment.timeLimit && timeRemaining && (
                <div className="flex items-center space-x-2 text-orange-600">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{timeRemaining}</span>
                </div>
              )}
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-2 text-yellow-600">
                  <Save className="w-4 h-4" />
                  <span className="text-sm">Unsaved changes</span>
                </div>
              )}
              {lastSaved && (
                <div className="text-sm text-gray-500">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Question {currentQuestionIndex + 1} of {assignment.questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Question Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {currentQuestion.text}
                </h2>
                {renderQuestion(currentQuestion)}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === assignment.questions.length - 1}
              >
                Next
              </Button>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showPreview ? 'Hide Preview' : 'Preview Answers'}
              </Button>
              
              {canEdit && (
                <Button
                  onClick={handleFinalSubmit}
                  disabled={isLoading || !canSubmit}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit Assignment
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Answer Preview Modal */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Answer Preview</h3>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {assignment.questions.map((question, index) => (
                    <div key={question.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {index + 1}. {question.question}
                      </h4>
                      <div className="text-gray-600">
                        {answers[question.id] ? (
                          <span className="text-green-600">✓ Answered: {answers[question.id]}</span>
                        ) : (
                          <span className="text-red-500">✗ Not answered</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AssignmentInterface;