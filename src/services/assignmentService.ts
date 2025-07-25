import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Assignment, AssignmentSubmission, AssignmentResult, AssignmentQuestionFeedback } from '../types/assignment';

// Helper function to convert Firestore timestamps
const convertTimestamp = (timestamp: any): string => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp || new Date().toISOString();
};

// Assignment Management
export const saveAssignment = async (weekId: string, assignment: Assignment): Promise<void> => {
  try {
    const assignmentRef = doc(db, 'assignments', assignment.id);
    const assignmentData = {
      ...assignment,
      weekId,
      updatedAt: serverTimestamp()
    };
    
    await setDoc(assignmentRef, assignmentData, { merge: true });
    console.log('Assignment saved successfully:', assignment.id);
  } catch (error) {
    console.error('Error saving assignment:', error);
    throw new Error('Failed to save assignment');
  }
};

export const getAssignment = async (assignmentId: string): Promise<Assignment | null> => {
  try {
    const assignmentRef = doc(db, 'assignments', assignmentId);
    const assignmentDoc = await getDoc(assignmentRef);
    
    if (assignmentDoc.exists()) {
      const data = assignmentDoc.data();
      return {
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt)
      } as Assignment;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return null;
  }
};

export const getWeekAssignments = async (weekId: string): Promise<Assignment[]> => {
  try {
    const q = query(
      collection(db, 'assignments'),
      where('weekId', '==', weekId)
    );
    const querySnapshot = await getDocs(q);
    
    const assignments = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt)
    })) as Assignment[];

    return assignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  } catch (error) {
    console.error('Error fetching week assignments:', error);
    return [];
  }
};

export const deleteAssignment = async (assignmentId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'assignments', assignmentId));
    
    // Also delete all submissions for this assignment
    const q = query(collection(db, 'assignment_submissions'), where('assignmentId', '==', assignmentId));
    const querySnapshot = await getDocs(q);
    
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log('Assignment deleted successfully:', assignmentId);
  } catch (error) {
    console.error('Error deleting assignment:', error);
    throw new Error('Failed to delete assignment');
  }
};

// Assignment Submissions - Modified to support draft submissions
export const saveAssignmentSubmission = async (submission: AssignmentSubmission): Promise<void> => {
  try {
    console.log('Saving assignment submission:', submission);
    
    // Check if this is a draft or final submission
    const isDraft = !submission.isSubmitted;
    
    if (isDraft) {
      // For drafts, use a predictable ID so we can update the same draft
      const draftId = `${submission.userId}_${submission.assignmentId}_draft`;
      const submissionRef = doc(db, 'assignment_submissions', draftId);
      
      const submissionData = {
        ...submission,
        id: draftId,
        lastSavedAt: serverTimestamp(),
        createdAt: submission.createdAt || serverTimestamp()
      };
      
      await setDoc(submissionRef, submissionData, { merge: true });
    } else {
      // For final submissions, create a new document
      // Generate a unique ID for final submissions
      const finalSubmissionId = submission.id || `${submission.userId}_${submission.assignmentId}_${Date.now()}`;
      const submissionRef = doc(db, 'assignment_submissions', finalSubmissionId);
      
      const submissionData = {
        ...submission,
        id: finalSubmissionId,
        submittedAt: submission.submittedAt || serverTimestamp(),
        createdAt: serverTimestamp()
      };
      
      await setDoc(submissionRef, submissionData);
      
      // Remove any existing draft
      const draftId = `${submission.userId}_${submission.assignmentId}_draft`;
      try {
        await deleteDoc(doc(db, 'assignment_submissions', draftId));
      } catch (error) {
        // Draft might not exist, which is fine
        console.log('No draft to delete, which is fine');
      }
    }
    
    console.log('Assignment submission saved successfully');
  } catch (error) {
    console.error('Error saving assignment submission:', error);
    console.error('Submission data:', submission);
    throw new Error('Failed to save assignment submission');
  }
};

export const getAssignmentSubmissions = async (userId: string, assignmentId: string): Promise<AssignmentSubmission[]> => {
  try {
    const q = query(
      collection(db, 'assignment_submissions'),
      where('userId', '==', userId),
      where('assignmentId', '==', assignmentId)
    );
    const querySnapshot = await getDocs(q);
    
    const submissions = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      submittedAt: convertTimestamp(doc.data().submittedAt),
      gradedAt: convertTimestamp(doc.data().gradedAt),
      lastSavedAt: convertTimestamp(doc.data().lastSavedAt)
    })) as AssignmentSubmission[];
    
    return submissions.sort((a, b) => {
      const aTime = a.submittedAt || a.lastSavedAt || '0';
      const bTime = b.submittedAt || b.lastSavedAt || '0';
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  } catch (error) {
    console.error('Error fetching assignment submissions:', error);
    return [];
  }
};

export const getLatestSubmission = async (userId: string, assignmentId: string): Promise<AssignmentSubmission | null> => {
  try {
    const submissions = await getAssignmentSubmissions(userId, assignmentId);
    return submissions.length > 0 ? submissions[0] : null;
  } catch (error) {
    console.error('Error fetching latest submission:', error);
    return null;
  }
};

// Get draft submission specifically
export const getDraftSubmission = async (userId: string, assignmentId: string): Promise<AssignmentSubmission | null> => {
  try {
    const draftId = `${userId}_${assignmentId}_draft`;
    const draftRef = doc(db, 'assignment_submissions', draftId);
    const draftDoc = await getDoc(draftRef);
    
    if (draftDoc.exists()) {
      const data = draftDoc.data();
      return {
        ...data,
        lastSavedAt: convertTimestamp(data.lastSavedAt)
      } as AssignmentSubmission;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching draft submission:', error);
    return null;
  }
};

// Auto-grading - Only calculate score after deadline
export const autoGradeSubmission = async (submission: AssignmentSubmission, assignment: Assignment): Promise<number> => {
  let totalPoints = 0;
  let earnedPoints = 0;

  console.log('Auto-grading submission:', {
    submissionId: submission.id,
    answers: submission.answers,
    questions: assignment.questions.length
  });

  assignment.questions.forEach(question => {
    totalPoints += question.points;
    const userAnswer = submission.answers[question.id];
    
    console.log(`Question ${question.id}:`, {
      type: question.type,
      userAnswer,
      correctAnswer: question.correctAnswer,
      points: question.points
    });
    
    if (question.type === 'multiple-choice') {
      // For multiple choice, compare the selected option text with the correct answer
      const correctOptionIndex = question.correctAnswer;
      const correctOptionText = question.options?.[correctOptionIndex as number];
      
      if (userAnswer === correctOptionText) {
        earnedPoints += question.points;
        console.log(`Correct! Earned ${question.points} points`);
      } else {
        console.log(`Incorrect. Expected: ${correctOptionText}, Got: ${userAnswer}`);
      }
    } else if (question.type === 'short-answer') {
      const correct = question.correctAnswer?.toString().toLowerCase().trim();
      const user = userAnswer?.toString().toLowerCase().trim();
      if (correct === user) {
        earnedPoints += question.points;
        console.log(`Correct! Earned ${question.points} points`);
      } else {
        console.log(`Incorrect. Expected: ${correct}, Got: ${user}`);
      }
    } else if (question.type === 'essay' || question.type === 'file-upload') {
      // These require manual grading
      console.log(`Question type ${question.type} requires manual grading`);
    }
  });

  console.log(`Total points: ${totalPoints}, Earned points: ${earnedPoints}`);

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  
  // Apply late penalty if applicable
  let finalScore = score;
  if (submission.isLate && assignment.latePenalty && submission.submittedAt) {
    const daysLate = Math.ceil((new Date(submission.submittedAt).getTime() - new Date(assignment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    const penalty = Math.min(assignment.latePenalty * daysLate, 100);
    finalScore = Math.max(0, score - penalty);
    console.log(`Applied late penalty: ${penalty}%, Final score: ${finalScore}%`);
  }

  console.log(`Final calculated score: ${finalScore}%`);
  return finalScore;
};

// Assignment Results and Feedback - Modified to respect deadline
export const calculateAssignmentResult = async (submission: AssignmentSubmission, assignment: Assignment): Promise<AssignmentResult> => {
  const now = new Date();
  const dueDate = new Date(assignment.dueDate);
  const deadlinePassed = now > dueDate;
  const canViewAnswers = deadlinePassed && assignment.showAnswersAfterDeadline && submission.isSubmitted;

  const feedback: AssignmentQuestionFeedback[] = assignment.questions.map(question => {
    const userAnswer = submission.answers[question.id];
    let isCorrect: boolean | undefined = undefined;
    let earnedPoints = 0;
    
    // Only calculate correctness after deadline and for submitted assignments
    if (deadlinePassed && submission.isSubmitted) {
      if (question.type === 'multiple-choice') {
        isCorrect = userAnswer === question.correctAnswer;
        earnedPoints = isCorrect ? question.points : 0;
      } else if (question.type === 'short-answer') {
        const correct = question.correctAnswer?.toString().toLowerCase().trim();
        const user = userAnswer?.toString().toLowerCase().trim();
        isCorrect = correct === user;
        earnedPoints = isCorrect ? question.points : 0;
      } else {
        // Essay and file-upload questions require manual grading
        earnedPoints = 0; // Will be updated when manually graded
      }
    }
    
    return {
      questionId: question.id,
      isCorrect: (deadlinePassed && submission.isSubmitted) ? isCorrect : undefined,
      userAnswer,
      correctAnswer: canViewAnswers ? question.correctAnswer : undefined,
      explanation: canViewAnswers ? question.explanation : undefined,
      points: question.points,
      earnedPoints: (deadlinePassed && submission.isSubmitted) ? earnedPoints : 0,
      feedback: undefined // Will be added during manual grading
    };
  });
  
  return {
    submission,
    assignment,
    feedback,
    canViewAnswers,
    deadlinePassed
  };
};

// Utility functions
export const isAssignmentOverdue = (assignment: Assignment): boolean => {
  return new Date() > new Date(assignment.dueDate);
};

export const canSubmitAssignment = (assignment: Assignment, submissions: AssignmentSubmission[]): boolean => {
  const now = new Date();
  const dueDate = new Date(assignment.dueDate);
  
  // Check if past due date and late submissions not allowed
  if (now > dueDate && !assignment.allowLateSubmission) {
    return false;
  }
  
  return true;
};

export const canEditAssignment = (assignment: Assignment): boolean => {
  const now = new Date();
  const dueDate = new Date(assignment.dueDate);
  
  // Can edit until deadline passes
  return now <= dueDate;
};

export const getTimeRemaining = (dueDate: string): string => {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();
  
  if (diff <= 0) {
    return 'Deadline passed';
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
};