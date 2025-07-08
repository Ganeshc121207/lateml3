export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'student';
  photoURL?: string;
  createdAt: string;
  lastLogin?: string;
  emailVerified?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  weeks: Week[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Week {
  id: string;
  courseId: string;
  weekNumber: number;
  title: string;
  description: string;
  lectures: Lecture[];
  assignments: Assignment[];
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Lecture {
  id: string;
  weekId: string;
  title: string;
  description: string;
  videoUrl?: string;
  resources: Resource[];
  activities: Activity[];
  duration?: number;
  order: number;
  isPublished: boolean;
  requireVideoCompletion?: boolean; // New field for quiz access control
}

export interface Resource {
  id: string;
  lectureId: string;
  title: string;
  type: 'pdf' | 'video' | 'presentation' | 'document';
  url: string;
  fileSize?: number;
  downloadable: boolean;
}

export interface Activity {
  id: string;
  lectureId: string;
  title: string;
  type: 'quiz' | 'interactive' | 'exercise';
  content: any;
  points: number;
  timeLimit?: number;
  attempts: number;
}

export interface Assignment {
  id: string;
  weekId: string;
  title: string;
  description: string;
  type: 'homework' | 'quiz' | 'project';
  questions: Question[];
  totalPoints: number;
  dueDate: string;
  timeLimit?: number;
  attempts: number;
  isPublished: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'short-answer' | 'essay';
  options?: string[];
  correctAnswer?: string | number;
  points: number;
  explanation?: string;
}

export interface StudentProgress {
  userId: string;
  courseId: string;
  weekProgress: WeekProgress[];
  overallProgress: number;
  totalPoints: number;
  completedActivities: string[];
  completedAssignments: string[];
  lastAccessed: string;
}

export interface WeekProgress {
  weekId: string;
  progress: number;
  lecturesCompleted: string[];
  activitiesCompleted: string[];
  assignmentsCompleted: string[];
  timeSpent: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface Analytics {
  totalStudents: number;
  activeStudents: number;
  courseCompletionRate: number;
  averageProgress: number;
  weeklyEngagement: { week: string; engagement: number }[];
  topPerformers: { userId: string; score: number }[];
  contentPerformance: { contentId: string; engagement: number }[];
}