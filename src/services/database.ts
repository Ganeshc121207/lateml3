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
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Course, Week, Lecture, Assignment, StudentProgress, Notification, Analytics } from '../types';

// Helper function to convert Firestore timestamps
const convertTimestamp = (timestamp: any): string => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp || new Date().toISOString();
};

// Course Management
export const createCourse = async (course: Omit<Course, 'id'>): Promise<string> => {
  try {
    const courseData = {
      ...course,
      weeks: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'courses'), courseData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating course:', error);
    throw new Error('Failed to create course');
  }
};

export const getCourses = async (): Promise<Course[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'courses'));
    const courses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt)
    })) as Course[];

    // If no courses exist, create a default one
    if (courses.length === 0) {
      const defaultCourse = {
        title: 'Advanced Mathematics',
        description: 'Comprehensive mathematics course covering calculus, algebra, and statistics',
        weeks: [],
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const courseId = await createCourse(defaultCourse);
      return [{
        id: courseId,
        ...defaultCourse
      }];
    }

    return courses;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw new Error('Failed to fetch courses');
  }
};

export const updateCourse = async (courseId: string, updates: Partial<Course>): Promise<void> => {
  try {
    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating course:', error);
    throw new Error('Failed to update course');
  }
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'courses', courseId));
    
    // Also delete all weeks for this course
    const weeksQuery = query(collection(db, 'weeks'), where('courseId', '==', courseId));
    const weeksSnapshot = await getDocs(weeksQuery);
    
    const deletePromises = weeksSnapshot.docs.map(weekDoc => deleteDoc(weekDoc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting course:', error);
    throw new Error('Failed to delete course');
  }
};

// Week Management
export const createWeek = async (courseId: string, week: Omit<Week, 'id' | 'courseId'>): Promise<string> => {
  try {
    const weekData = {
      ...week,
      courseId,
      lectures: week.lectures || [],
      assignments: week.assignments || [],
      startDate: week.startDate,
      endDate: week.endDate
    };
    
    const docRef = await addDoc(collection(db, 'weeks'), weekData);
    
    // Update course's updatedAt timestamp
    await updateCourse(courseId, { updatedAt: new Date().toISOString() });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating week:', error);
    throw new Error('Failed to create week');
  }
};

export const getWeeks = async (courseId: string): Promise<Week[]> => {
  try {
    // Use only the where clause to avoid composite index requirement
    const q = query(
      collection(db, 'weeks'), 
      where('courseId', '==', courseId)
    );
    const querySnapshot = await getDocs(q);
    
    const weeks = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lectures: doc.data().lectures || [],
      assignments: doc.data().assignments || []
    })) as Week[];

    // Sort by weekNumber in JavaScript instead of Firestore
    return weeks.sort((a, b) => (a.weekNumber || 0) - (b.weekNumber || 0));
  } catch (error) {
    console.error('Error fetching weeks:', error);
    throw new Error('Failed to fetch weeks');
  }
};

export const updateWeek = async (courseId: string, weekId: string, updates: Partial<Week>): Promise<void> => {
  try {
    const weekRef = doc(db, 'weeks', weekId);
    await updateDoc(weekRef, updates);
    
    // Update course's updatedAt timestamp
    await updateCourse(courseId, { updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error updating week:', error);
    throw new Error('Failed to update week');
  }
};

export const deleteWeek = async (courseId: string, weekId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'weeks', weekId));
    
    // Update course's updatedAt timestamp
    await updateCourse(courseId, { updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error deleting week:', error);
    throw new Error('Failed to delete week');
  }
};

// Lecture Management
export const createLecture = async (courseId: string, weekId: string, lecture: Omit<Lecture, 'id' | 'weekId'>): Promise<string> => {
  try {
    // Get the current week
    const weekRef = doc(db, 'weeks', weekId);
    const weekDoc = await getDoc(weekRef);
    
    if (!weekDoc.exists()) {
      throw new Error('Week not found');
    }
    
    const weekData = weekDoc.data() as Week;
    const lectureWithId = {
      ...lecture,
      id: Math.random().toString(36).substr(2, 9),
      weekId
    };
    
    const updatedLectures = [...(weekData.lectures || []), lectureWithId];
    
    await updateDoc(weekRef, {
      lectures: updatedLectures
    });
    
    // Update course's updatedAt timestamp
    await updateCourse(courseId, { updatedAt: new Date().toISOString() });
    
    return lectureWithId.id;
  } catch (error) {
    console.error('Error creating lecture:', error);
    throw new Error('Failed to create lecture');
  }
};

export const updateLecture = async (courseId: string, weekId: string, lectureId: string, updates: Partial<Lecture>): Promise<void> => {
  try {
    const weekRef = doc(db, 'weeks', weekId);
    const weekDoc = await getDoc(weekRef);
    
    if (!weekDoc.exists()) {
      throw new Error('Week not found');
    }
    
    const weekData = weekDoc.data() as Week;
    const lectures = weekData.lectures || [];
    const lectureIndex = lectures.findIndex(l => l.id === lectureId);
    
    if (lectureIndex === -1) {
      throw new Error('Lecture not found');
    }
    
    lectures[lectureIndex] = { ...lectures[lectureIndex], ...updates };
    
    await updateDoc(weekRef, {
      lectures: lectures
    });
    
    // Update course's updatedAt timestamp
    await updateCourse(courseId, { updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error updating lecture:', error);
    throw new Error('Failed to update lecture');
  }
};

export const deleteLecture = async (courseId: string, weekId: string, lectureId: string): Promise<void> => {
  try {
    const weekRef = doc(db, 'weeks', weekId);
    const weekDoc = await getDoc(weekRef);
    
    if (!weekDoc.exists()) {
      throw new Error('Week not found');
    }
    
    const weekData = weekDoc.data() as Week;
    const lectures = (weekData.lectures || []).filter(l => l.id !== lectureId);
    
    await updateDoc(weekRef, {
      lectures: lectures
    });
    
    // Update course's updatedAt timestamp
    await updateCourse(courseId, { updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error deleting lecture:', error);
    throw new Error('Failed to delete lecture');
  }
};

// Assignment Management
export const createAssignment = async (courseId: string, weekId: string, assignment: Omit<Assignment, 'id' | 'weekId'>): Promise<string> => {
  try {
    const weekRef = doc(db, 'weeks', weekId);
    const weekDoc = await getDoc(weekRef);
    
    if (!weekDoc.exists()) {
      throw new Error('Week not found');
    }
    
    const weekData = weekDoc.data() as Week;
    const assignmentWithId = {
      ...assignment,
      id: Math.random().toString(36).substr(2, 9),
      weekId
    };
    
    const updatedAssignments = [...(weekData.assignments || []), assignmentWithId];
    
    await updateDoc(weekRef, {
      assignments: updatedAssignments
    });
    
    // Update course's updatedAt timestamp
    await updateCourse(courseId, { updatedAt: new Date().toISOString() });
    
    return assignmentWithId.id;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw new Error('Failed to create assignment');
  }
};

export const updateAssignment = async (courseId: string, weekId: string, assignmentId: string, updates: Partial<Assignment>): Promise<void> => {
  try {
    const weekRef = doc(db, 'weeks', weekId);
    const weekDoc = await getDoc(weekRef);
    
    if (!weekDoc.exists()) {
      throw new Error('Week not found');
    }
    
    const weekData = weekDoc.data() as Week;
    const assignments = weekData.assignments || [];
    const assignmentIndex = assignments.findIndex(a => a.id === assignmentId);
    
    if (assignmentIndex === -1) {
      throw new Error('Assignment not found');
    }
    
    assignments[assignmentIndex] = { ...assignments[assignmentIndex], ...updates };
    
    await updateDoc(weekRef, {
      assignments: assignments
    });
    
    // Update course's updatedAt timestamp
    await updateCourse(courseId, { updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error updating assignment:', error);
    throw new Error('Failed to update assignment');
  }
};

export const deleteAssignment = async (courseId: string, weekId: string, assignmentId: string): Promise<void> => {
  try {
    const weekRef = doc(db, 'weeks', weekId);
    const weekDoc = await getDoc(weekRef);
    
    if (!weekDoc.exists()) {
      throw new Error('Week not found');
    }
    
    const weekData = weekDoc.data() as Week;
    const assignments = (weekData.assignments || []).filter(a => a.id !== assignmentId);
    
    await updateDoc(weekRef, {
      assignments: assignments
    });
    
    // Update course's updatedAt timestamp
    await updateCourse(courseId, { updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    throw new Error('Failed to delete assignment');
  }
};

// Student Progress
export const updateStudentProgress = async (userId: string, courseId: string, progress: Partial<StudentProgress>): Promise<void> => {
  try {
    const progressRef = doc(db, 'progress', `${userId}_${courseId}`);
    const progressData = {
      ...progress,
      userId,
      courseId,
      lastAccessed: serverTimestamp()
    };
    
    await updateDoc(progressRef, progressData).catch(async () => {
      // If document doesn't exist, create it
      await addDoc(collection(db, 'progress'), {
        ...progressData,
        createdAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error('Error updating student progress:', error);
    throw new Error('Failed to update progress');
  }
};

export const getStudentProgress = async (userId: string, courseId: string): Promise<StudentProgress | null> => {
  try {
    const progressRef = doc(db, 'progress', `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);
    
    if (!progressDoc.exists()) {
      return null;
    }
    
    const data = progressDoc.data();
    return {
      ...data,
      lastAccessed: convertTimestamp(data.lastAccessed)
    } as StudentProgress;
  } catch (error) {
    console.error('Error fetching student progress:', error);
    return null;
  }
};

// Notifications
export const createNotification = async (notification: Omit<Notification, 'id'>): Promise<string> => {
  try {
    const notificationData = {
      ...notification,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt)
    })) as Notification[];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
};

// Real-time listeners
export const subscribeToProgressUpdates = (userId: string, courseId: string, callback: (progress: StudentProgress | null) => void) => {
  const progressRef = doc(db, 'progress', `${userId}_${courseId}`);
  
  return onSnapshot(progressRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback({
        ...data,
        lastAccessed: convertTimestamp(data.lastAccessed)
      } as StudentProgress);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error in progress subscription:', error);
    callback(null);
  });
};

export const subscribeToNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt)
    })) as Notification[];
    
    callback(notifications);
  }, (error) => {
    console.error('Error in notifications subscription:', error);
    callback([]);
  });
};

// Analytics (mock data for now, can be enhanced with real analytics)
export const getAnalytics = async (): Promise<Analytics> => {
  try {
    // Get basic counts from Firestore
    const [coursesSnapshot, usersSnapshot] = await Promise.all([
      getDocs(collection(db, 'courses')),
      getDocs(query(collection(db, 'users'), where('role', '==', 'student')))
    ]);

    return {
      totalStudents: usersSnapshot.size,
      activeStudents: Math.floor(usersSnapshot.size * 0.7), // Mock active percentage
      courseCompletionRate: 73,
      averageProgress: 68,
      weeklyEngagement: [
        { week: 'Week 1', engagement: 85 },
        { week: 'Week 2', engagement: 78 },
        { week: 'Week 3', engagement: 92 },
        { week: 'Week 4', engagement: 67 },
      ],
      topPerformers: [
        { userId: 'user1', score: 95 },
        { userId: 'user2', score: 92 },
        { userId: 'user3', score: 89 },
      ],
      contentPerformance: [
        { contentId: 'calc1', engagement: 88 },
        { contentId: 'algebra1', engagement: 76 },
        { contentId: 'stats1', engagement: 82 },
      ],
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw new Error('Failed to fetch analytics');
  }
};