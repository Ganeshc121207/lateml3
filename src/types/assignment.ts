export interface Assignment {
  id: string;
  weekId: string;
  title: string;
  description: string;
  instructions?: string;
  questions: AssignmentQuestion[];
  totalPoints: number;
  dueDate: string;
  allowLateSubmission: boolean;
  latePenalty?: number; // percentage penalty per day late
  maxAttempts: number;
  timeLimit?: number; // in minutes, 0 = unlimited
  isPublished: boolean;
  showAnswersAfterDeadline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'short-answer' | 'essay' | 'file-upload';
  options?: string[]; // for multiple choice
  correctAnswer?: string | number; // index for multiple choice, text for others
  points: number;
  explanation?: string;
  required: boolean;
}

export interface AssignmentSubmission {
  id: string;
  userId: string;
  assignmentId: string;
  answers: Record<string, any>;
  submittedAt?: string; // Only set when finally submitted
  lastSavedAt?: string; // For draft saves
  isSubmitted: boolean; // New field to distinguish drafts from final submissions
  isLate: boolean;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
  autoGraded: boolean;
  timeSpent: number; // in seconds
}

export interface AssignmentResult {
  submission: AssignmentSubmission;
  assignment: Assignment;
  feedback: AssignmentQuestionFeedback[];
  canViewAnswers: boolean;
  deadlinePassed: boolean; // New field to track deadline status
}

export interface AssignmentQuestionFeedback {
  questionId: string;
  isCorrect?: boolean;
  userAnswer: any;
  correctAnswer?: any;
  explanation?: string;
  points: number;
  earnedPoints: number;
  feedback?: string;
}