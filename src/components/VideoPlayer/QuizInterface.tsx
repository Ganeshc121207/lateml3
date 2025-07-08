import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Send,
  ArrowLeft,
  ArrowRight,
  X,
  Award,
  RotateCcw,
  Home,
  Target,
  TrendingUp
} from 'lucide-react';
import Button from '../UI/Button';
import { Quiz, QuizAttempt, Question } from '../../types/quiz';

interface QuizInterfaceProps {
  quiz: Quiz;
  onSubmit: (answers: Record<string, any>) => void;
  onCancel: () => void;
  onStart: () => void;
  isLoading: boolean;
  currentAttempt: QuizAttempt | null;
  onRetake?: () => void;
  onGoBack?: () => void;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({
  quiz,
  onSubmit,
  onCancel,
  onStart,
  isLoading,
  currentAttempt,
  onRetake,
  onGoBack
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    feedback: Array<{
      questionId: string;
      isCorrect: boolean;
      userAnswer: any;
      correctAnswer: any;
      explanation?: string;
    }>;
  } | null>(null);

  useEffect(() => {
    if (quiz.timeLimit && quizStarted && !quizCompleted) {
      setTimeRemaining(quiz.timeLimit * 60); // Convert minutes to seconds
    }
  }, [quiz.timeLimit, quizStarted, quizCompleted]);

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && !quizCompleted) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !quizCompleted) {
      handleSubmit();
    }
  }, [timeRemaining, quizCompleted]);

  const handleStart = () => {
    setQuizStarted(true);
    setQuizCompleted(false);
    setQuizResult(null);
    setAnswers({});
    onStart();
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const calculateResults = () => {
    let correctAnswers = 0;
    const totalQuestions = quiz.questions.length;
    const feedback: Array<{
      questionId: string;
      isCorrect: boolean;
      userAnswer: any;
      correctAnswer: any;
      explanation?: string;
    }> = [];

    quiz.questions.forEach(question => {
      const userAnswer = answers[question.id];
      let isCorrect = false;

      if (question.type === 'multiple-choice') {
        isCorrect = userAnswer === question.correctAnswer;
      } else if (question.type === 'short-answer') {
        const correct = question.correctAnswer?.toString().toLowerCase().trim();
        const user = userAnswer?.toString().toLowerCase().trim();
        isCorrect = correct === user;
      }

      if (isCorrect) {
        correctAnswers++;
      }

      feedback.push({
        questionId: question.id,
        isCorrect,
        userAnswer,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      });
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= (quiz.passingScore || 70);

    return { score, passed, feedback };
  };

  const handleSubmit = () => {
    const results = calculateResults();
    setQuizResult(results);
    setQuizCompleted(true);
    
    // Submit to parent component
    onSubmit(answers);
  };

  const handleRetake = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setQuizResult(null);
    setAnswers({});
    setTimeRemaining(null);
    onRetake?.();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = (): number => {
    return Object.keys(answers).filter(key => answers[key] !== undefined && answers[key] !== '').length;
  };

  const canSubmit = (): boolean => {
    return getAnsweredCount() === quiz.questions.length;
  };

  // Full screen overlay
  const overlayClasses = "fixed inset-0 z-50 bg-dark-900 overflow-y-auto";

  // Quiz Results View
  if (quizCompleted && quizResult) {
    return (
      <div className={overlayClasses}>
        <div className="min-h-screen p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onGoBack || onCancel} icon={<ArrowLeft className="h-4 w-4" />}>
                Back to Lecture
              </Button>
              <h1 className="text-2xl font-bold text-white">Quiz Results</h1>
            </div>
            <Button variant="ghost" onClick={onCancel} icon={<X className="h-4 w-4" />} />
          </div>

          {/* Results Summary */}
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-dark-800 rounded-xl p-8 text-center">
              <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                quizResult.passed ? 'bg-accent-600' : 'bg-red-600'
              }`}>
                {quizResult.passed ? (
                  <CheckCircle className="h-12 w-12 text-white" />
                ) : (
                  <XCircle className="h-12 w-12 text-white" />
                )}
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-2">
                {quizResult.passed ? 'Congratulations!' : 'Keep Trying!'}
              </h2>
              
              <p className="text-xl text-dark-300 mb-6">
                You scored {quizResult.score}% on {quiz.title}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-dark-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-white mb-1">{quizResult.score}%</div>
                  <div className="text-dark-400">Your Score</div>
                </div>
                <div className="bg-dark-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-white mb-1">{quiz.passingScore || 70}%</div>
                  <div className="text-dark-400">Passing Score</div>
                </div>
                <div className="bg-dark-700 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-white mb-1">
                    {quizResult.feedback.filter(f => f.isCorrect).length}/{quiz.questions.length}
                  </div>
                  <div className="text-dark-400">Correct Answers</div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <Button onClick={onGoBack || onCancel} icon={<Home className="h-4 w-4" />}>
                  Back to Lecture
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleRetake}
                  icon={<RotateCcw className="h-4 w-4" />}
                >
                  Retake Quiz
                </Button>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="bg-dark-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Question Review</h3>
              
              <div className="space-y-6">
                {quiz.questions.map((question, index) => {
                  const feedback = quizResult.feedback.find(f => f.questionId === question.id);
                  if (!feedback) return null;

                  return (
                    <div key={question.id} className="bg-dark-700 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            feedback.isCorrect ? 'bg-accent-600' : 'bg-red-600'
                          }`}>
                            {feedback.isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-white" />
                            ) : (
                              <XCircle className="h-5 w-5 text-white" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-dark-300">Question {index + 1}</span>
                        </div>
                        <span className="text-sm text-dark-400">{question.points} pts</span>
                      </div>

                      <h4 className="text-white font-medium mb-4">{question.text}</h4>

                      {question.type === 'multiple-choice' && question.options && (
                        <div className="space-y-2 mb-4">
                          {question.options.map((option, optIndex) => {
                            const isUserAnswer = feedback.userAnswer === optIndex;
                            const isCorrectAnswer = feedback.correctAnswer === optIndex;
                            
                            return (
                              <div
                                key={optIndex}
                                className={`p-3 rounded-lg border-2 ${
                                  isCorrectAnswer
                                    ? 'border-accent-600 bg-accent-600/10'
                                    : isUserAnswer && !isCorrectAnswer
                                    ? 'border-red-600 bg-red-600/10'
                                    : 'border-dark-600'
                                }`}
                              >
                                <div className="flex items-center">
                                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                    isCorrectAnswer
                                      ? 'border-accent-600 bg-accent-600'
                                      : isUserAnswer && !isCorrectAnswer
                                      ? 'border-red-600 bg-red-600'
                                      : 'border-dark-400'
                                  }`}>
                                    {(isCorrectAnswer || (isUserAnswer && !isCorrectAnswer)) && (
                                      <div className="w-2 h-2 rounded-full bg-white mx-auto mt-0.5" />
                                    )}
                                  </div>
                                  <span className={`${
                                    isCorrectAnswer
                                      ? 'text-accent-400'
                                      : isUserAnswer && !isCorrectAnswer
                                      ? 'text-red-400'
                                      : 'text-white'
                                  }`}>
                                    {option}
                                  </span>
                                  {isCorrectAnswer && (
                                    <span className="ml-2 text-xs text-accent-400 font-medium">Correct</span>
                                  )}
                                  {isUserAnswer && !isCorrectAnswer && (
                                    <span className="ml-2 text-xs text-red-400 font-medium">Your Answer</span>
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
                            <label className="block text-sm font-medium text-dark-300 mb-1">Your Answer:</label>
                            <div className={`p-3 rounded-lg border-2 ${
                              feedback.isCorrect ? 'border-accent-600 bg-accent-600/10' : 'border-red-600 bg-red-600/10'
                            }`}>
                              <span className={feedback.isCorrect ? 'text-accent-400' : 'text-red-400'}>
                                {feedback.userAnswer || 'No answer provided'}
                              </span>
                            </div>
                          </div>
                          {!feedback.isCorrect && feedback.correctAnswer && (
                            <div>
                              <label className="block text-sm font-medium text-dark-300 mb-1">Correct Answer:</label>
                              <div className="p-3 rounded-lg border-2 border-accent-600 bg-accent-600/10">
                                <span className="text-accent-400">{feedback.correctAnswer}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {feedback.explanation && (
                        <div className="bg-dark-600 p-4 rounded-lg">
                          <h5 className="text-sm font-medium text-white mb-2">Explanation:</h5>
                          <p className="text-dark-300 text-sm">{feedback.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Instructions View
  if (!quizStarted) {
    return (
      <div className={overlayClasses}>
        <div className="min-h-screen p-6 flex items-center justify-center">
          <div className="max-w-2xl w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-white">Quiz Instructions</h1>
              <Button variant="ghost" onClick={onCancel} icon={<X className="h-4 w-4" />} />
            </div>

            <div className="bg-dark-800 rounded-xl p-8 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{quiz.title}</h3>
                {quiz.description && (
                  <p className="text-dark-300">{quiz.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-dark-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary-400 mb-1">{quiz.questions.length}</div>
                  <div className="text-sm text-dark-300">Questions</div>
                </div>
                <div className="bg-dark-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-secondary-400 mb-1">
                    {quiz.timeLimit ? `${quiz.timeLimit}m` : '∞'}
                  </div>
                  <div className="text-sm text-dark-300">Time Limit</div>
                </div>
                <div className="bg-dark-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-accent-400 mb-1">{quiz.passingScore || 70}%</div>
                  <div className="text-sm text-dark-300">Passing Score</div>
                </div>
              </div>

              {quiz.instructions && (
                <div className="bg-dark-700 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Instructions:</h4>
                  <p className="text-dark-300 text-sm">{quiz.instructions}</p>
                </div>
              )}

              <div className="bg-orange-600/10 border border-orange-600/20 p-4 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-orange-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-orange-300">
                    <p className="font-medium mb-1">Important Notes:</p>
                    <ul className="space-y-1 text-orange-200">
                      <li>• All questions are displayed on one page</li>
                      <li>• Make sure to answer all questions before submitting</li>
                      {quiz.timeLimit && <li>• The quiz will auto-submit when time runs out</li>}
                      <li>• You can review your answers after submission</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-3">
                <Button variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
                <Button onClick={handleStart} size="lg">
                  Start Quiz
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Taking View
  return (
    <div className={overlayClasses}>
      <div className="min-h-screen p-6">
        {/* Header */}
        <div className="sticky top-0 bg-dark-900 z-10 pb-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onCancel} icon={<ArrowLeft className="h-4 w-4" />}>
                Exit Quiz
              </Button>
              <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
            </div>
            
            {timeRemaining !== null && (
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-600/20 text-red-400' : 'bg-dark-700 text-dark-300'
              }`}>
                <Clock className="h-4 w-4" />
                <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-dark-400 whitespace-nowrap">
              Progress: {getAnsweredCount()}/{quiz.questions.length}
            </span>
            <div className="flex-1 bg-dark-600 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(getAnsweredCount() / quiz.questions.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-dark-400">
              {Math.round((getAnsweredCount() / quiz.questions.length) * 100)}%
            </span>
          </div>
        </div>

        {/* Questions List */}
        <div className="max-w-4xl mx-auto space-y-8">
          {quiz.questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-dark-800 rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    answers[question.id] !== undefined && answers[question.id] !== ''
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-600 text-dark-300'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-dark-300">
                    Question {index + 1} of {quiz.questions.length}
                  </span>
                </div>
                <span className="text-sm text-dark-400">{question.points} pts</span>
              </div>

              <h3 className="text-lg font-medium text-white mb-6">{question.text}</h3>

              {question.type === 'multiple-choice' && question.options && (
                <div className="space-y-3">
                  {question.options.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        answers[question.id] === optIndex
                          ? 'border-primary-600 bg-primary-600/10'
                          : 'border-dark-600 hover:border-dark-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={optIndex}
                        checked={answers[question.id] === optIndex}
                        onChange={() => handleAnswerChange(question.id, optIndex)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                        answers[question.id] === optIndex
                          ? 'border-primary-600 bg-primary-600'
                          : 'border-dark-400'
                      }`}>
                        {answers[question.id] === optIndex && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-white flex-1">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'short-answer' && (
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder="Enter your answer..."
                  className="w-full p-4 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                />
              )}

              {question.type === 'essay' && (
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder="Write your essay response..."
                  className="w-full p-4 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={6}
                />
              )}
            </motion.div>
          ))}

          {/* Submit Section */}
          <div className="bg-dark-800 rounded-xl p-6 text-center">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Ready to Submit?</h3>
              <p className="text-dark-300">
                You have answered {getAnsweredCount()} out of {quiz.questions.length} questions.
              </p>
              {!canSubmit() && (
                <p className="text-orange-400 text-sm mt-2">
                  Please answer all questions before submitting.
                </p>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit() || isLoading}
              loading={isLoading}
              size="lg"
              icon={<Send className="h-4 w-4" />}
            >
              Submit Quiz
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizInterface;