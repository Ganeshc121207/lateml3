import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  Clock,
  Award,
  FileText,
  CheckCircle,
  AlertCircle,
  Infinity
} from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Modal from '../UI/Modal';
import { Quiz, Question } from '../../types/quiz';
import toast from 'react-hot-toast';

interface QuizBuilderProps {
  quiz?: Quiz;
  onSave: (quiz: Quiz) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const QuizBuilder: React.FC<QuizBuilderProps> = ({
  quiz,
  onSave,
  onCancel,
  isOpen
}) => {
  const [quizData, setQuizData] = useState<Quiz>(quiz || {
    id: '',
    title: '',
    description: '',
    instructions: '',
    questions: [],
    timeLimit: 0,
    passingScore: 70,
    maxAttempts: 3,
    shuffleQuestions: false,
    showFeedback: true
  });

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const handleQuizSave = () => {
    if (!quizData.title.trim()) {
      toast.error('Quiz title is required');
      return;
    }

    if (quizData.questions.length === 0) {
      toast.error('At least one question is required');
      return;
    }

    const quizToSave: Quiz = {
      ...quizData,
      id: quizData.id || Math.random().toString(36).substr(2, 9)
    };

    onSave(quizToSave);
    toast.success('Quiz saved successfully!');
  };

  const handleAddQuestion = () => {
    setEditingQuestion({
      id: '',
      text: '',
      type: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1,
      explanation: ''
    });
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion({ ...question });
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = (question: Question) => {
    if (!question.text.trim()) {
      toast.error('Question text is required');
      return;
    }

    if (question.type === 'multiple-choice') {
      const validOptions = question.options?.filter(opt => opt.trim()) || [];
      if (validOptions.length < 2) {
        toast.error('At least 2 options are required for multiple choice questions');
        return;
      }
    }

    const questionToSave: Question = {
      ...question,
      id: question.id || Math.random().toString(36).substr(2, 9)
    };

    if (question.id) {
      // Update existing question
      setQuizData(prev => ({
        ...prev,
        questions: prev.questions.map(q => q.id === question.id ? questionToSave : q)
      }));
    } else {
      // Add new question
      setQuizData(prev => ({
        ...prev,
        questions: [...prev.questions, questionToSave]
      }));
    }

    setShowQuestionModal(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
    toast.success('Question deleted');
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...quizData.questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newQuestions.length) {
      [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
      setQuizData(prev => ({ ...prev, questions: newQuestions }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Quiz Builder" maxWidth="2xl">
      <div className="space-y-6">
        {/* Quiz Settings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quiz Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Quiz Title *
              </label>
              <input
                type="text"
                value={quizData.title}
                onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter quiz title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Passing Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={quizData.passingScore}
                onChange={(e) => setQuizData(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 70 }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Time Limit (minutes, 0 = unlimited)
              </label>
              <input
                type="number"
                min="0"
                value={quizData.timeLimit}
                onChange={(e) => setQuizData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Max Attempts
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={quizData.maxAttempts === -1 ? '' : quizData.maxAttempts}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setQuizData(prev => ({ ...prev, maxAttempts: -1 }));
                    } else {
                      setQuizData(prev => ({ ...prev, maxAttempts: parseInt(value) || 3 }));
                    }
                  }}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter number or leave empty for unlimited"
                />
                <button
                  type="button"
                  onClick={() => setQuizData(prev => ({ ...prev, maxAttempts: -1 }))}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
                  title="Set to unlimited"
                >
                  <Infinity className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-dark-400 mt-1">
                {quizData.maxAttempts === -1 ? 'Unlimited attempts' : `${quizData.maxAttempts} attempts allowed`}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Description
            </label>
            <textarea
              value={quizData.description}
              onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
              placeholder="Enter quiz description"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Instructions
            </label>
            <textarea
              value={quizData.instructions}
              onChange={(e) => setQuizData(prev => ({ ...prev, instructions: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
              placeholder="Enter quiz instructions"
            />
          </div>

          <div className="mt-4 flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={quizData.shuffleQuestions}
                onChange={(e) => setQuizData(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
                className="mr-2 rounded border-dark-600 bg-dark-700 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-dark-300">Shuffle Questions</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={quizData.showFeedback}
                onChange={(e) => setQuizData(prev => ({ ...prev, showFeedback: e.target.checked }))}
                className="mr-2 rounded border-dark-600 bg-dark-700 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-dark-300">Show Feedback</span>
            </label>
          </div>
        </Card>

        {/* Questions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Questions ({quizData.questions.length})</h3>
            <Button onClick={handleAddQuestion} icon={<Plus className="h-4 w-4" />}>
              Add Question
            </Button>
          </div>

          {quizData.questions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-dark-400 mx-auto mb-4" />
              <p className="text-dark-300">No questions added yet</p>
              <Button onClick={handleAddQuestion} className="mt-4" variant="outline">
                Add Your First Question
              </Button>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {quizData.questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-dark-700 p-4 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-primary-400">Q{index + 1}</span>
                        <span className="text-xs px-2 py-1 bg-dark-600 text-dark-300 rounded">
                          {question.type}
                        </span>
                        <span className="text-xs text-dark-400">{question.points} pts</span>
                      </div>
                      <p className="text-white mb-2">{question.text}</p>
                      
                      {question.type === 'multiple-choice' && question.options && (
                        <div className="space-y-1">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center text-sm">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                optIndex === question.correctAnswer ? 'bg-accent-400' : 'bg-dark-500'
                              }`} />
                              <span className={optIndex === question.correctAnswer ? 'text-accent-400' : 'text-dark-300'}>
                                {option}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveQuestion(index, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveQuestion(index, 'down')}
                        disabled={index === quizData.questions.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditQuestion(question)}
                        icon={<Edit3 className="h-4 w-4" />}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteQuestion(question.id)}
                        icon={<Trash2 className="h-4 w-4" />}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-dark-700">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleQuizSave} icon={<Save className="h-4 w-4" />}>
            Save Quiz
          </Button>
        </div>
      </div>

      {/* Question Modal */}
      {showQuestionModal && editingQuestion && (
        <QuestionEditor
          question={editingQuestion}
          onSave={handleSaveQuestion}
          onCancel={() => {
            setShowQuestionModal(false);
            setEditingQuestion(null);
          }}
        />
      )}
    </Modal>
  );
};

interface QuestionEditorProps {
  question: Question;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, onSave, onCancel }) => {
  const [questionData, setQuestionData] = useState<Question>(question);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(questionData.options || [])];
    newOptions[index] = value;
    setQuestionData(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    const newOptions = [...(questionData.options || []), ''];
    setQuestionData(prev => ({ ...prev, options: newOptions }));
  };

  const removeOption = (index: number) => {
    const newOptions = (questionData.options || []).filter((_, i) => i !== index);
    setQuestionData(prev => ({ 
      ...prev, 
      options: newOptions,
      correctAnswer: typeof prev.correctAnswer === 'number' && prev.correctAnswer >= index 
        ? Math.max(0, prev.correctAnswer - 1) 
        : prev.correctAnswer
    }));
  };

  return (
    <Modal isOpen={true} onClose={onCancel} title="Edit Question" maxWidth="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Question Type
          </label>
          <select
            value={questionData.type}
            onChange={(e) => setQuestionData(prev => ({ 
              ...prev, 
              type: e.target.value as Question['type'],
              options: e.target.value === 'multiple-choice' ? ['', '', '', ''] : undefined,
              correctAnswer: e.target.value === 'multiple-choice' ? 0 : ''
            }))}
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="multiple-choice">Multiple Choice</option>
            <option value="short-answer">Short Answer</option>
            <option value="essay">Essay</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Question Text *
          </label>
          <textarea
            value={questionData.text}
            onChange={(e) => setQuestionData(prev => ({ ...prev, text: e.target.value }))}
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={3}
            placeholder="Enter your question"
          />
        </div>

        {questionData.type === 'multiple-choice' && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Answer Options
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(questionData.options || []).map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={questionData.correctAnswer === index}
                    onChange={() => setQuestionData(prev => ({ ...prev, correctAnswer: index }))}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={`Option ${index + 1}`}
                  />
                  {(questionData.options?.length || 0) > 2 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeOption(index)}
                      icon={<X className="h-4 w-4" />}
                    />
                  )}
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={addOption}
              className="mt-2"
              icon={<Plus className="h-4 w-4" />}
            >
              Add Option
            </Button>
          </div>
        )}

        {(questionData.type === 'short-answer' || questionData.type === 'essay') && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Correct Answer (for auto-grading)
            </label>
            <input
              type="text"
              value={questionData.correctAnswer as string || ''}
              onChange={(e) => setQuestionData(prev => ({ ...prev, correctAnswer: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter the correct answer"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Points
            </label>
            <input
              type="number"
              min="1"
              value={questionData.points}
              onChange={(e) => setQuestionData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Explanation (optional)
          </label>
          <textarea
            value={questionData.explanation || ''}
            onChange={(e) => setQuestionData(prev => ({ ...prev, explanation: e.target.value }))}
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={2}
            placeholder="Explain the correct answer"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-dark-700">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSave(questionData)} icon={<Save className="h-4 w-4" />}>
            Save Question
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuizBuilder;