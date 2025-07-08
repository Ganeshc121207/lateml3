import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  X, 
  Video, 
  FileText, 
  Award,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock
} from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Modal from '../UI/Modal';
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import QuizBuilder from '../VideoPlayer/QuizBuilder';
import { Lecture } from '../../types';
import { Quiz } from '../../types/quiz';
import { saveQuiz, getQuiz, validateYouTubeUrl, deleteQuiz } from '../../services/quizService';
import toast from 'react-hot-toast';

interface LectureEditorProps {
  lecture?: Lecture;
  onSave: (lecture: Lecture) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const LectureEditor: React.FC<LectureEditorProps> = ({
  lecture,
  onSave,
  onCancel,
  isOpen
}) => {
  const [lectureData, setLectureData] = useState<Lecture>(lecture || {
    id: '',
    weekId: '',
    title: '',
    description: '',
    videoUrl: '',
    resources: [],
    activities: [],
    duration: 0,
    order: 1,
    isPublished: false,
    requireVideoCompletion: false
  });

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [quizLoading, setQuizLoading] = useState(false);

  useEffect(() => {
    if (lecture?.id) {
      loadQuiz();
    }
  }, [lecture?.id]);

  useEffect(() => {
    if (lecture) {
      setLectureData({
        ...lecture,
        requireVideoCompletion: lecture.requireVideoCompletion ?? false
      });
    }
  }, [lecture]);

  const loadQuiz = async () => {
    if (!lecture?.id) return;
    
    setQuizLoading(true);
    try {
      const quizData = await getQuiz(lecture.id);
      setQuiz(quizData);
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleVideoUrlChange = (url: string) => {
    setLectureData(prev => ({ ...prev, videoUrl: url }));
    
    if (url && !validateYouTubeUrl(url)) {
      setUrlError('Please enter a valid YouTube URL');
    } else {
      setUrlError('');
    }
  };

  const handleSave = async () => {
    if (!lectureData.title.trim()) {
      toast.error('Lecture title is required');
      return;
    }

    if (lectureData.videoUrl && !validateYouTubeUrl(lectureData.videoUrl)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    setIsLoading(true);
    
    try {
      const lectureToSave: Lecture = {
        ...lectureData,
        id: lectureData.id || Math.random().toString(36).substr(2, 9)
      };

      onSave(lectureToSave);
      toast.success('Lecture saved successfully!');
    } catch (error) {
      toast.error('Failed to save lecture');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizSave = async (quizData: Quiz) => {
    if (!lectureData.id) {
      toast.error('Please save the lecture first');
      return;
    }

    try {
      // Ensure quiz has the correct lectureId
      const quizToSave = {
        ...quizData,
        id: quizData.id || lectureData.id,
        lectureId: lectureData.id
      };

      await saveQuiz(lectureData.id, quizToSave);
      setQuiz(quizToSave);
      setShowQuizBuilder(false);
      toast.success('Quiz saved successfully!');
      
      // Force reload quiz to ensure latest data
      setTimeout(() => {
        loadQuiz();
      }, 500);
    } catch (error) {
      toast.error('Failed to save quiz');
      console.error('Quiz save error:', error);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!lectureData.id || !quiz) return;
    
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteQuiz(lectureData.id);
      setQuiz(null);
      toast.success('Quiz deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete quiz');
      console.error('Quiz delete error:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Edit Lecture" maxWidth="2xl">
      <div className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Lecture Title *
              </label>
              <input
                type="text"
                value={lectureData.title}
                onChange={(e) => setLectureData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter lecture title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={lectureData.duration || ''}
                onChange={(e) => setLectureData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Order
              </label>
              <input
                type="number"
                min="1"
                value={lectureData.order}
                onChange={(e) => setLectureData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Description
              </label>
              <textarea
                value={lectureData.description}
                onChange={(e) => setLectureData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={3}
                placeholder="Enter lecture description"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={lectureData.isPublished}
                onChange={(e) => setLectureData(prev => ({ ...prev, isPublished: e.target.checked }))}
                className="mr-2 rounded border-dark-600 bg-dark-700 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-dark-300">Published (visible to students)</span>
            </label>
          </div>
        </Card>

        {/* Video Configuration */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Video className="h-5 w-5 mr-2" />
              Video Content
            </h3>
            {lectureData.videoUrl && !urlError && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPreview(true)}
                icon={<Eye className="h-4 w-4" />}
              >
                Preview
              </Button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              YouTube Video URL
            </label>
            <input
              type="url"
              value={lectureData.videoUrl || ''}
              onChange={(e) => handleVideoUrlChange(e.target.value)}
              className={`w-full px-3 py-2 bg-dark-700 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                urlError ? 'border-red-500' : 'border-dark-600'
              }`}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {urlError && (
              <div className="mt-2 flex items-center text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {urlError}
              </div>
            )}
            {lectureData.videoUrl && !urlError && (
              <div className="mt-2 flex items-center text-accent-400 text-sm">
                <CheckCircle className="h-4 w-4 mr-1" />
                Valid YouTube URL
              </div>
            )}
          </div>

          <div className="mt-4 p-4 bg-dark-700 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2">Supported URL Formats:</h4>
            <ul className="text-sm text-dark-300 space-y-1">
              <li>• https://www.youtube.com/watch?v=VIDEO_ID</li>
              <li>• https://youtu.be/VIDEO_ID</li>
              <li>• https://www.youtube.com/embed/VIDEO_ID</li>
            </ul>
          </div>
        </Card>

        {/* Quiz Configuration */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Quiz & Assessment
              {quizLoading && (
                <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={() => setShowQuizBuilder(true)}
                icon={quiz ? <FileText className="h-4 w-4" /> : <Award className="h-4 w-4" />}
              >
                {quiz ? 'Edit Quiz' : 'Add Quiz'}
              </Button>
              {quiz && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDeleteQuiz}
                  icon={<X className="h-4 w-4" />}
                />
              )}
            </div>
          </div>

          {quiz ? (
            <div className="space-y-4">
              <div className="bg-dark-700 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium">{quiz.title}</h4>
                  <span className="text-sm text-accent-400">{quiz.questions.length} questions</span>
                </div>
                
                {quiz.description && (
                  <p className="text-dark-300 text-sm mb-3">{quiz.description}</p>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center">
                    <div className="text-white font-medium">{quiz.passingScore || 70}%</div>
                    <div className="text-dark-400">Passing Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-medium">
                      {quiz.timeLimit ? `${quiz.timeLimit}m` : '∞'}
                    </div>
                    <div className="text-dark-400">Time Limit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-medium">
                      {quiz.maxAttempts === -1 ? '∞' : quiz.maxAttempts || 3}
                    </div>
                    <div className="text-dark-400">Max Attempts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-medium">
                      {quiz.questions.reduce((sum, q) => sum + q.points, 0)}
                    </div>
                    <div className="text-dark-400">Total Points</div>
                  </div>
                </div>
              </div>

              {/* Quiz Access Control */}
              <div className="bg-dark-700 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-3">Quiz Access Settings</h4>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={lectureData.requireVideoCompletion || false}
                    onChange={(e) => setLectureData(prev => ({ 
                      ...prev, 
                      requireVideoCompletion: e.target.checked 
                    }))}
                    className="mr-3 rounded border-dark-600 bg-dark-700 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex items-center">
                    {lectureData.requireVideoCompletion ? (
                      <Lock className="h-4 w-4 mr-2 text-orange-400" />
                    ) : (
                      <Unlock className="h-4 w-4 mr-2 text-accent-400" />
                    )}
                    <div>
                      <span className="text-white font-medium">
                        {lectureData.requireVideoCompletion ? 'Quiz Locked' : 'Quiz Unlocked'}
                      </span>
                      <p className="text-dark-300 text-sm">
                        {lectureData.requireVideoCompletion 
                          ? 'Students must complete the video before accessing the quiz'
                          : 'Students can access the quiz immediately'
                        }
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Quiz Last Updated */}
              <div className="text-xs text-dark-400 text-center">
                Quiz configuration will be immediately available to students
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Award className="h-12 w-12 text-dark-400 mx-auto mb-3" />
              <p className="text-dark-300 mb-3">No quiz configured for this lecture</p>
              <p className="text-dark-400 text-sm">Add a quiz to test student understanding</p>
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-dark-700">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            loading={isLoading}
            icon={<Save className="h-4 w-4" />}
          >
            Save Lecture
          </Button>
        </div>
      </div>

      {/* Quiz Builder Modal */}
      {showQuizBuilder && (
        <QuizBuilder
          quiz={quiz || undefined}
          onSave={handleQuizSave}
          onCancel={() => setShowQuizBuilder(false)}
          isOpen={showQuizBuilder}
        />
      )}

      {/* Video Preview Modal */}
      {showPreview && lectureData.videoUrl && (
        <Modal 
          isOpen={showPreview} 
          onClose={() => setShowPreview(false)} 
          title="Video Preview" 
          maxWidth="2xl"
        >
          <VideoPlayer
            lectureId={lectureData.id || 'preview'}
            videoUrl={lectureData.videoUrl}
            title={lectureData.title}
            description={lectureData.description}
            quiz={quiz || undefined}
            isInstructor={true}
            requireVideoCompletion={lectureData.requireVideoCompletion}
          />
        </Modal>
      )}
    </Modal>
  );
};

export default LectureEditor;