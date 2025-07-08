export interface Quiz {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  questions: Question[];
  timeLimit?: number; // in minutes, 0 = unlimited
  passingScore?: number; // percentage
  maxAttempts?: number; // -1 = unlimited
  shuffleQuestions?: boolean;
  showFeedback?: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'short-answer' | 'essay';
  options?: string[]; // for multiple choice
  correctAnswer?: string | number; // index for multiple choice, text for others
  points: number;
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  lectureId: string;
  quizId: string;
  answers: Record<string, any>;
  score: number;
  passed: boolean;
  startedAt: string;
  completedAt: string;
  timeSpent: number; // in seconds
  videoCompleted: boolean;
}

export interface VideoProgress {
  userId: string;
  lectureId: string;
  progress: number; // percentage
  currentTime: number; // in seconds
  duration: number; // in seconds
  completed: boolean;
  lastWatched: string;
}

export interface QuizResult {
  attempt: QuizAttempt;
  quiz: Quiz;
  feedback: QuestionFeedback[];
}

export interface QuestionFeedback {
  questionId: string;
  isCorrect: boolean;
  userAnswer: any;
  correctAnswer: any;
  explanation?: string;
  points: number;
  earnedPoints: number;
}