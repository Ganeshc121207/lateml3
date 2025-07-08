import { useState, useEffect } from 'react';
import { StudentProgress } from '../types';
import { getStudentProgress, subscribeToProgressUpdates } from '../services/database';

export const useProgress = (userId: string, courseId: string) => {
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !courseId) return;

    const fetchProgress = async () => {
      try {
        const progressData = await getStudentProgress(userId, courseId);
        setProgress(progressData);
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToProgressUpdates(userId, courseId, (progressData) => {
      setProgress(progressData);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId, courseId]);

  return { progress, loading };
};