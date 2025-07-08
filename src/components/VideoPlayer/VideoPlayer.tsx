import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import YouTube, { YouTubeProps } from 'react-youtube';
import {
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import QuizInterface from './QuizInterface';
import { Quiz, QuizAttempt, VideoProgress } from '../../types/quiz';
import { useAuth } from '../../hooks/useAuth';
import { saveVideoProgress, saveQuizAttempt, getQuizAttempts, getQuiz } from '../../services/quizService';
import toast from 'react-hot-toast';

interface VideoPlayerProps {
  lectureId: string;
  videoUrl: string;
  title: string;
  description?: string;
  quiz?: Quiz;
  onVideoComplete?: () => void;
  onQuizComplete?: (score: number, passed: boolean) => void;
  isInstructor?: boolean;
  requireVideoCompletion?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  lectureId,
  videoUrl,
  title,
  description,
  quiz: initialQuiz,
  onVideoComplete,
  onQuizComplete,
  isInstructor = false,
  requireVideoCompletion = false
}) => {
  const { user } = useAuth();
  const [videoId, setVideoId] = useState<string>('');
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(initialQuiz || null);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [playerReady, setPlayerReady] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [embedError, setEmbedError] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const playerRef = useRef<any>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const extractedVideoId = extractYouTubeVideoId(videoUrl);
    if (extractedVideoId) {
      setVideoId(extractedVideoId);
      setError('');
      setEmbedError(false);
    } else {
      setError('Invalid YouTube URL. Please provide a valid YouTube video link.');
    }
  }, [videoUrl]);

  useEffect(() => {
    if (user && lectureId) {
      loadQuizAttempts();
      loadLatestQuiz();
    }
  }, [user, lectureId]);

  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  // Load the latest quiz data when component mounts or lectureId changes
  const loadLatestQuiz = async () => {
    if (!lectureId) return;

    setQuizLoading(true);
    try {
      const latestQuiz = await getQuiz(lectureId);
      if (latestQuiz) {
        setQuiz(latestQuiz);
        console.log('Latest quiz loaded:', latestQuiz);
      } else if (!initialQuiz) {
        setQuiz(null);
      }
    } catch (error) {
      console.error('Error loading latest quiz:', error);
    } finally {
      setQuizLoading(false);
    }
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  const loadQuizAttempts = async () => {
    if (!user) return;

    try {
      const attempts = await getQuizAttempts(user.uid, lectureId);
      setQuizAttempts(attempts);

      // Check if video was previously completed
      const hasCompletedAttempt = attempts.some(attempt => attempt.videoCompleted);
      if (hasCompletedAttempt) {
        setIsVideoCompleted(true);
      }
    } catch (error) {
      console.error('Error loading quiz attempts:', error);
    }
  };

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    setPlayerReady(true);
    setVideoDuration(event.target.getDuration());
    setEmbedError(false);
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    const player = event.target;

    if (event.data === 1) { // Playing
      startProgressTracking();
    } else if (event.data === 2) { // Paused
      stopProgressTracking();
    } else if (event.data === 0) { // Ended
      handleVideoComplete();
    }
  };

  const onPlayerError = (error: any) => {
    console.error('YouTube player error:', error);
    setEmbedError(true);
    setError('This video cannot be embedded. You can watch it directly on YouTube.');
  };

  const startProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    progressInterval.current = setInterval(() => {
      if (playerRef.current) {
        const current = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        const progress = (current / duration) * 100;

        setCurrentTime(current);
        setVideoProgress(progress);

        // Auto-complete video when 90% watched
        if (progress >= 90 && !isVideoCompleted) {
          handleVideoComplete();
        }

        // Save progress periodically
        if (user && progress > 0) {
          saveVideoProgressData(progress, current, duration);
        }
      }
    }, 1000);
  };

  const stopProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const saveVideoProgressData = async (progress: number, currentTime: number, duration: number) => {
    if (!user) return;

    const progressData: VideoProgress = {
      userId: user.uid,
      lectureId,
      progress,
      currentTime,
      duration,
      completed: progress >= 90,
      lastWatched: new Date().toISOString()
    };

    try {
      await saveVideoProgress(progressData);
    } catch (error) {
      console.error('Error saving video progress:', error);
    }
  };

  const handleVideoComplete = async () => {
    if (isVideoCompleted) return;

    setIsVideoCompleted(true);
    stopProgressTracking();

    if (user) {
      await saveVideoProgressData(100, videoDuration, videoDuration);
    }

    onVideoComplete?.();
    toast.success('Video completed! 🎉');

    // Show quiz if available and auto-show is enabled
    if (quiz && quiz.questions.length > 0 && !requireVideoCompletion) {
      setTimeout(() => {
        setShowQuiz(true);
      }, 1000);
    }
  };

  const handleQuizStart = () => {
    if (!quiz || !user) return;

    const newAttempt: QuizAttempt = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      lectureId,
      quizId: quiz.id,
      answers: {},
      score: 0,
      passed: false,
      completedAt: '',
      startedAt: new Date().toISOString(),
      videoCompleted: isVideoCompleted,
      timeSpent: 0
    };

    setCurrentAttempt(newAttempt);
  };

  const handleQuizSubmit = async (answers: Record<string, any>) => {
    if (!currentAttempt || !quiz || !user) return;

    setIsLoading(true);

    try {
      // Calculate score
      let correctAnswers = 0;
      const totalQuestions = quiz.questions.length;

      quiz.questions.forEach(question => {
        const userAnswer = answers[question.id];
        if (question.type === 'multiple-choice') {
          if (userAnswer === question.correctAnswer) {
            correctAnswers++;
          }
        } else if (question.type === 'short-answer') {
          // Simple string comparison for short answers
          const correct = question.correctAnswer?.toString().toLowerCase();
          const user = userAnswer?.toString().toLowerCase();
          if (correct === user) {
            correctAnswers++;
          }
        }
      });

      const score = Math.round((correctAnswers / totalQuestions) * 100);
      const passed = score >= (quiz.passingScore || 70);

      const completedAttempt: QuizAttempt = {
        ...currentAttempt,
        answers,
        score,
        passed,
        completedAt: new Date().toISOString(),
        timeSpent: Math.floor((Date.now() - new Date(currentAttempt.startedAt).getTime()) / 1000)
      };

      await saveQuizAttempt(completedAttempt);
      setQuizAttempts(prev => [...prev, completedAttempt]);
      setCurrentAttempt(null);

      onQuizComplete?.(score, passed);

      if (passed) {
        toast.success(`Quiz passed with ${score}%! 🎉`);
      } else {
        toast.error(`Quiz failed with ${score}%. Try again!`);
      }
    } catch (error) {
      toast.error('Failed to submit quiz. Please try again.');
      console.error('Quiz submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizRetake = () => {
    setCurrentAttempt(null);
    // Reload the latest quiz data before retaking
    loadLatestQuiz();
  };

  const openVideoInNewTab = () => {
    window.open(videoUrl, '_blank');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuizStatus = () => {
    const passedAttempts = quizAttempts.filter(attempt => attempt.passed);
    const bestScore = Math.max(...quizAttempts.map(attempt => attempt.score), 0);

    return {
      hasAttempts: quizAttempts.length > 0,
      hasPassed: passedAttempts.length > 0,
      bestScore,
      attemptCount: quizAttempts.length,
      maxAttempts: quiz?.maxAttempts || 3
    };
  };

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      rel: 0,
      showinfo: 0,
      origin: window.location.origin,
    },
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Video Error</h3>
          <p className="text-dark-300 mb-4">{error}</p>
          <div className="space-y-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button variant="outline" onClick={openVideoInNewTab}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Watch on YouTube
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!videoId) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-dark-300">Loading video...</p>
        </div>
      </Card>
    );
  }

  const quizStatus = getQuizStatus();
  const canAccessQuiz = !requireVideoCompletion || isVideoCompleted || isInstructor;

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <Card className="overflow-hidden">
        <div className="aspect-video bg-black relative">
          {embedError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-800">
              <div className="text-center">
                <AlertCircle className="h-16 w-16 text-orange-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Video Embedding Restricted</h3>
                <p className="text-dark-300 mb-4">This video cannot be embedded. Watch it directly on YouTube.</p>
                <Button onClick={openVideoInNewTab} icon={<ExternalLink className="h-4 w-4" />}>
                  Watch on YouTube
                </Button>
              </div>
            </div>
          ) : (
            <>
              <YouTube
                videoId={videoId}
                opts={opts}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
                onError={onPlayerError}
                className="absolute inset-0 w-full h-full"
              />

              {/* Video Progress Overlay */}
              {playerReady && !embedError && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between text-white text-sm mb-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(videoDuration)}</span>
                  </div>
                  <div className="w-full bg-dark-600 rounded-full h-1">
                    <div
                      className="bg-primary-600 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Completion Badge */}
              {isVideoCompleted && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute top-4 right-4 bg-accent-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completed
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Video Info */}
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
          {description && (
            <p className="text-dark-300 mb-4">{description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-dark-400">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {formatTime(videoDuration)}
              </div>
              <div className="flex items-center">
                {isVideoCompleted ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1 text-accent-400" />
                    <span className="text-accent-400">Completed</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    <span>{Math.round(videoProgress)}% watched</span>
                  </>
                )}
              </div>
            </div>

            {embedError && (
              <Button
                size="sm"
                variant="outline"
                onClick={openVideoInNewTab}
                icon={<ExternalLink className="h-4 w-4" />}
              >
                Watch on YouTube
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Quiz Section */}
      {quiz && quiz.questions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Award className="h-5 w-5 mr-2 text-secondary-400" />
              {quiz.title}
              {quizLoading && (
                <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              {quizStatus.hasPassed && (
                <div className="flex items-center text-accent-400 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Passed
                </div>
              )}
              {requireVideoCompletion && !isVideoCompleted && !isInstructor && (
                <div className="flex items-center text-orange-400 text-sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Locked
                </div>
              )}
            </div>
          </div>

          {quiz.description && (
            <p className="text-dark-300 mb-4">{quiz.description}</p>
          )}

          {/* Quiz Stats */}
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
              <div className="text-lg font-bold text-white">
                {quiz.maxAttempts === -1 ? '∞' : `${quizStatus.attemptCount}/${quiz.maxAttempts || 3}`}
              </div>
              <div className="text-xs text-dark-400">Attempts</div>
            </div>
            <div className="bg-dark-700 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-white">{quizStatus.bestScore}%</div>
              <div className="text-xs text-dark-400">Best Score</div>
            </div>
          </div>

          {/* Quiz Actions */}
          {!canAccessQuiz ? (
            <div className="bg-orange-600/10 border border-orange-600/20 p-4 rounded-lg">
              <div className="flex items-center text-orange-400">
                <Eye className="h-5 w-5 mr-2" />
                <span className="font-medium">Complete the video to unlock the quiz</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {quizStatus.attemptCount >= (quiz.maxAttempts || 3) && quiz.maxAttempts !== -1 && !quizStatus.hasPassed ? (
                <div className="bg-red-600/10 border border-red-600/20 p-4 rounded-lg">
                  <div className="flex items-center text-red-400">
                    <EyeOff className="h-5 w-5 mr-2" />
                    <span className="font-medium">Maximum attempts reached</span>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowQuiz(true)}
                  disabled={currentAttempt !== null || quizLoading}
                  className="w-full"
                >
                  {quizStatus.hasAttempts ? 'Retake Quiz' : 'Start Quiz'}
                </Button>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Quiz Modal - Full Screen */}
      <AnimatePresence>
        {showQuiz && quiz && (
          <QuizInterface
            quiz={quiz}
            onSubmit={handleQuizSubmit}
            onCancel={() => {
              setShowQuiz(false);
              setCurrentAttempt(null);
            }}
            onStart={handleQuizStart}
            isLoading={isLoading}
            currentAttempt={currentAttempt}
            onRetake={handleQuizRetake}
            onGoBack={() => setShowQuiz(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoPlayer;