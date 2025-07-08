import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Clock, 
  Award, 
  CheckCircle,
  Lock,
  BookOpen,
  ArrowLeft,
  Video
} from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import { Lecture } from '../../types';
import { Quiz } from '../../types/quiz';
import { getQuiz } from '../../services/quizService';
import { useAuth } from '../../hooks/useAuth';
import { updateStudentProgress } from '../../services/database';
import toast from 'react-hot-toast';

interface LectureViewerProps {
  lecture: Lecture;
  onBack: () => void;
  onComplete?: () => void;
}

const LectureViewer: React.FC<LectureViewerProps> = ({
  lecture,
  onBack,
  onComplete
}) => {
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [lecture.id]);

  const loadQuiz = async () => {
    try {
      const quizData = await getQuiz(lecture.id);
      setQuiz(quizData);
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoComplete = async () => {
    setVideoCompleted(true);
    
    if (user) {
      try {
        await updateStudentProgress(user.uid, 'default-course', {
          completedActivities: [lecture.id],
          lastAccessed: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
  };

  const handleQuizComplete = async (score: number, passed: boolean) => {
    setQuizCompleted(passed);
    
    if (passed && user) {
      try {
        await updateStudentProgress(user.uid, 'default-course', {
          completedActivities: [lecture.id, `${lecture.id}-quiz`],
          lastAccessed: new Date().toISOString()
        });
        
        onComplete?.();
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
  };

  if (!lecture.isPublished) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white">{lecture.title}</h1>
        </div>

        <Card className="p-8 text-center">
          <Lock className="h-16 w-16 text-dark-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Lecture Not Available</h2>
          <p className="text-dark-300">This lecture has not been published yet. Please check back later.</p>
        </Card>
      </div>
    );
  }

  if (!lecture.videoUrl) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white">{lecture.title}</h1>
        </div>

        <Card className="p-8 text-center">
          <BookOpen className="h-16 w-16 text-dark-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Video Content</h2>
          <p className="text-dark-300">Video content for this lecture is not available yet.</p>
          
          {/* Show quiz if available even without video */}
          {quiz && quiz.questions.length > 0 && (
            <div className="mt-6">
              <p className="text-dark-300 mb-4">However, there is a quiz available for this lecture:</p>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Award className="h-5 w-5 mr-2 text-secondary-400" />
                    {quiz.title}
                  </h3>
                </div>

                {quiz.description && (
                  <p className="text-dark-300 mb-4">{quiz.description}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-dark-700 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-white">{quiz.questions.length}</div>
                    <div className="text-xs text-dark-400">Questions</div>
                  </div>
                  <div className="bg-dark-700 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-white">{quiz.passingScore || 70}%</div>
                    <div className="text-xs text-dark-400">Passing Score</div>
                  </div>
                  <div className="bg-dark-700 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-white">{quiz.maxAttempts || 3}</div>
                    <div className="text-xs text-dark-400">Max Attempts</div>
                  </div>
                  <div className="bg-dark-700 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-white">
                      {quiz.timeLimit ? `${quiz.timeLimit}m` : '∞'}
                    </div>
                    <div className="text-xs text-dark-400">Time Limit</div>
                  </div>
                </div>

                <Button className="w-full">
                  Start Quiz
                </Button>
              </Card>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{lecture.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-dark-400 mt-1">
              {lecture.duration && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {lecture.duration} minutes
                </div>
              )}
              {quiz && quiz.questions.length > 0 && (
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  Quiz included ({quiz.questions.length} questions)
                  {lecture.requireVideoCompletion && (
                    <Lock className="h-3 w-3 ml-1 text-orange-400" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center space-x-3">
          {videoCompleted && (
            <div className="flex items-center text-accent-400 text-sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              Video Complete
            </div>
          )}
          {quizCompleted && (
            <div className="flex items-center text-secondary-400 text-sm">
              <Award className="h-4 w-4 mr-1" />
              Quiz Passed
            </div>
          )}
        </div>
      </div>

      {/* Video Player */}
      {isLoading ? (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-dark-300">Loading lecture content...</p>
        </Card>
      ) : (
        <VideoPlayer
          lectureId={lecture.id}
          videoUrl={lecture.videoUrl}
          title={lecture.title}
          description={lecture.description}
          quiz={quiz || undefined}
          onVideoComplete={handleVideoComplete}
          onQuizComplete={handleQuizComplete}
          requireVideoCompletion={lecture.requireVideoCompletion}
        />
      )}

      {/* Lecture Resources */}
      {lecture.resources && lecture.resources.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Additional Resources</h3>
          <div className="space-y-3">
            {lecture.resources.map((resource) => (
              <div key={resource.id} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                <div>
                  <h4 className="text-white font-medium">{resource.title}</h4>
                  <p className="text-dark-400 text-sm">{resource.type}</p>
                </div>
                <Button size="sm" variant="outline">
                  Download
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Learning Objectives */}
      {lecture.description && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">About This Lecture</h3>
          <p className="text-dark-300">{lecture.description}</p>
        </Card>
      )}
    </div>
  );
};

export default LectureViewer;