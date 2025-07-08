import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Play, 
  Clock, 
  CheckCircle, 
  FileText, 
  Award,
  Calendar,
  ArrowRight,
  Video,
  Activity,
  Lock,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Users,
  AlertTriangle,
  Edit3,
  Save
} from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import Modal from '../UI/Modal';
import LectureViewer from './LectureViewer';
import AssignmentInterface from './AssignmentInterface';
import { Course, Week, Lecture } from '../../types';
import { Assignment, AssignmentSubmission, AssignmentResult } from '../../types/assignment';
import { getCourses, getWeeks, updateStudentProgress } from '../../services/database';
import { 
  getWeekAssignments, 
  getLatestSubmission, 
  saveAssignmentSubmission, 
  autoGradeSubmission,
  calculateAssignmentResult,
  canSubmitAssignment,
  isAssignmentOverdue,
  getTimeRemaining,
  canEditAssignment,
  getDraftSubmission
} from '../../services/assignmentService';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const CoursesView: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [weekAssignments, setWeekAssignments] = useState<Record<string, Assignment[]>>({});
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<Record<string, AssignmentSubmission | null>>({});
  const [assignmentResults, setAssignmentResults] = useState<Record<string, AssignmentResult | null>>({});
  const [loading, setLoading] = useState(true);
  const [showLectureViewer, setShowLectureViewer] = useState(false);
  const [showAssignmentInterface, setShowAssignmentInterface] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchWeeks(selectedCourse.id);
    }
  }, [selectedCourse]);

  useEffect(() => {
    // Fetch assignments for all weeks
    weeks.forEach(week => {
      fetchWeekAssignments(week.id);
    });
  }, [weeks]);

  const fetchCourses = async () => {
    try {
      const coursesData = await getCourses();
      setCourses(coursesData);
      if (coursesData.length > 0 && !selectedCourse) {
        setSelectedCourse(coursesData[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeks = async (courseId: string) => {
    try {
      const weeksData = await getWeeks(courseId);
      setWeeks(weeksData);
    } catch (error) {
      toast.error('Failed to fetch course content');
    }
  };

  const fetchWeekAssignments = async (weekId: string) => {
    try {
      const assignments = await getWeekAssignments(weekId);
      const publishedAssignments = assignments.filter(a => a.isPublished);
      setWeekAssignments(prev => ({
        ...prev,
        [weekId]: publishedAssignments
      }));

      // Fetch submissions for each assignment
      if (user) {
        for (const assignment of publishedAssignments) {
          // First check for draft submission
          const draftSubmission = await getDraftSubmission(user.uid, assignment.id);
          const finalSubmission = await getLatestSubmission(user.uid, assignment.id);
          
          // Use draft if it exists and no final submission, otherwise use final submission
          const submission = finalSubmission || draftSubmission;
          
          setAssignmentSubmissions(prev => ({
            ...prev,
            [assignment.id]: submission
          }));

          // Calculate result if submission exists
          if (submission) {
            const result = await calculateAssignmentResult(submission, assignment);
            setAssignmentResults(prev => ({
              ...prev,
              [assignment.id]: result
            }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch week assignments:', error);
    }
  };

  const toggleWeekExpansion = (weekId: string) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekId)) {
      newExpanded.delete(weekId);
    } else {
      newExpanded.add(weekId);
    }
    setExpandedWeeks(newExpanded);
  };

  const handleLectureSelect = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setShowLectureViewer(true);
  };

  const handleLectureComplete = async () => {
    if (!user || !selectedCourse || !selectedLecture) return;
    
    try {
      await updateStudentProgress(user.uid, selectedCourse.id, {
        completedActivities: [selectedLecture.id],
        lastAccessed: new Date().toISOString()
      });
      toast.success('Lecture completed!');
      setShowLectureViewer(false);
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const handleAssignmentSelect = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowAssignmentInterface(true);
  };

  const handleAssignmentStart = () => {
    // Assignment started - no additional action needed
  };

  const handleAssignmentSubmit = async (answers: Record<string, any>, isFinal: boolean) => {
    if (!user || !selectedAssignment) return;

    setAssignmentLoading(true);
    
    try {
      const now = new Date();
      const dueDate = new Date(selectedAssignment.dueDate);
      const isLate = now > dueDate && isFinal;

      // Generate a proper submission ID
      const submissionId = isFinal 
        ? `${user.uid}_${selectedAssignment.id}_${Date.now()}`
        : `${user.uid}_${selectedAssignment.id}_draft`;
      
      // Create base submission object
      const baseSubmission = {
        id: submissionId,
        userId: user.uid,
        assignmentId: selectedAssignment.id,
        answers,
        isSubmitted: isFinal,
        isLate,
        autoGraded: true,
        timeSpent: 0 // This would be calculated based on start time
      };
      
      // Add timestamp fields conditionally to avoid undefined values
      const submission: AssignmentSubmission = {
        ...baseSubmission,
        ...(isFinal ? { submittedAt: now.toISOString() } : { lastSavedAt: now.toISOString() })
      };

      // Only auto-grade if it's a final submission and deadline has passed
      if (isFinal) {
        const score = await autoGradeSubmission(submission, selectedAssignment);
        submission.score = score;
      }

      await saveAssignmentSubmission(submission);
      
      // Update local state
      setAssignmentSubmissions(prev => ({
        ...prev,
        [selectedAssignment.id]: submission
      }));

      // Calculate and store result
      const result = await calculateAssignmentResult(submission, selectedAssignment);
      setAssignmentResults(prev => ({
        ...prev,
        [selectedAssignment.id]: result
      }));

      // Update student progress only for final submissions
      if (isFinal) {
        await updateStudentProgress(user.uid, selectedCourse?.id || '', {
          completedAssignments: [selectedAssignment.id],
          lastAccessed: new Date().toISOString()
        });
      }

      if (isFinal) {
        toast.success('Assignment submitted successfully!');
      } else {
        toast.success('Draft saved successfully!');
      }
    } catch (error) {
      console.error('Assignment submission error details:', error);
      toast.error(isFinal ? 'Failed to submit assignment' : 'Failed to save draft');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleAssignmentRetake = () => {
    // Reset assignment state for retake
    if (selectedAssignment) {
      setAssignmentSubmissions(prev => ({
        ...prev,
        [selectedAssignment.id]: null
      }));
      setAssignmentResults(prev => ({
        ...prev,
        [selectedAssignment.id]: null
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (showLectureViewer && selectedLecture) {
    return (
      <LectureViewer
        lecture={selectedLecture}
        onBack={() => {
          setShowLectureViewer(false);
          setSelectedLecture(null);
        }}
        onComplete={handleLectureComplete}
      />
    );
  }

  if (showAssignmentInterface && selectedAssignment) {
    const latestSubmission = assignmentSubmissions[selectedAssignment.id];
    const assignmentResult = assignmentResults[selectedAssignment.id];
    const submissions = latestSubmission ? [latestSubmission] : [];
    const canSubmit = canSubmitAssignment(selectedAssignment, submissions.filter(s => s.isSubmitted));

    return (
      <AssignmentInterface
        assignment={selectedAssignment}
        onSubmit={handleAssignmentSubmit}
        onCancel={() => {
          setShowAssignmentInterface(false);
          setSelectedAssignment(null);
        }}
        onStart={handleAssignmentStart}
        isLoading={assignmentLoading}
        latestSubmission={latestSubmission}
        assignmentResult={assignmentResult}
        canSubmit={canSubmit}
        onRetake={handleAssignmentRetake}
        onGoBack={() => {
          setShowAssignmentInterface(false);
          setSelectedAssignment(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Courses</h1>
        <p className="text-dark-300">Access your enrolled courses and track your progress</p>
      </div>

      {/* Course Selection */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Available Courses</h2>
          <BookOpen className="h-5 w-5 text-dark-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <motion.div
              key={course.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCourse(course)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedCourse?.id === course.id
                  ? 'border-primary-600 bg-primary-600/10'
                  : 'border-dark-600 hover:border-dark-500'
              }`}
            >
              <h3 className="text-white font-semibold mb-2">{course.title}</h3>
              <p className="text-dark-300 text-sm mb-3">{course.description}</p>
              <div className="flex items-center justify-between text-xs text-dark-400">
                <span>{weeks.length} weeks</span>
                <span>Updated {new Date(course.updatedAt).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Course Content */}
      {selectedCourse && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">{selectedCourse.title} - Course Content</h2>
            <div className="flex items-center space-x-2 text-sm text-dark-400">
              <span>{weeks.length} weeks</span>
              <span>•</span>
              <span>{weeks.reduce((acc, week) => acc + (week.lectures?.length || 0), 0)} lectures</span>
              <span>•</span>
              <span>{Object.values(weekAssignments).reduce((acc, assignments) => acc + assignments.length, 0)} assignments</span>
            </div>
          </div>

          {weeks.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-dark-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No content available yet</h3>
              <p className="text-dark-300">Course content will be available soon</p>
            </div>
          ) : (
            <div className="space-y-4">
              {weeks.map((week) => (
                <motion.div
                  key={week.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-dark-700 rounded-lg overflow-hidden"
                >
                  {/* Week Header */}
                  <div className="p-6 border-b border-dark-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => toggleWeekExpansion(week.id)}
                          className="text-dark-400 hover:text-white transition-colors"
                        >
                          {expandedWeeks.has(week.id) ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </button>
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">{week.weekNumber}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{week.title}</h3>
                          <p className="text-dark-300 text-sm">{week.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {week.isActive ? (
                          <span className="px-2 py-1 bg-accent-600 text-white text-xs rounded-full">Available</span>
                        ) : (
                          <span className="px-2 py-1 bg-dark-600 text-dark-300 text-xs rounded-full">Coming Soon</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center text-dark-300">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(week.startDate).toLocaleDateString()} - {new Date(week.endDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-dark-300">
                        <Video className="h-4 w-4 mr-2" />
                        {week.lectures?.length || 0} lectures
                      </div>
                      <div className="flex items-center text-dark-300">
                        <FileText className="h-4 w-4 mr-2" />
                        {weekAssignments[week.id]?.length || 0} assignments
                      </div>
                      <div className="flex items-center text-dark-300">
                        <Users className="h-4 w-4 mr-2" />
                        {week.isActive ? 'Available now' : 'Locked'}
                      </div>
                    </div>
                  </div>

                  {/* Week Content */}
                  <AnimatePresence>
                    {expandedWeeks.has(week.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 space-y-6">
                          {/* Lectures Section */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-semibold text-white flex items-center">
                                <Video className="h-5 w-5 mr-2" />
                                Lectures ({week.lectures?.length || 0})
                              </h4>
                            </div>

                            {week.lectures && week.lectures.length > 0 ? (
                              <div className="space-y-3">
                                {week.lectures.map((lecture) => (
                                  <div key={lecture.id} className="bg-dark-800 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-secondary-600 rounded-lg flex items-center justify-center">
                                          {lecture.videoUrl ? (
                                            <PlayCircle className="h-5 w-5 text-white" />
                                          ) : (
                                            <Lock className="h-5 w-5 text-white" />
                                          )}
                                        </div>
                                        <div>
                                          <h5 className="text-white font-medium">{lecture.title}</h5>
                                          <div className="flex items-center space-x-4 text-sm text-dark-400">
                                            <span>Order: {lecture.order}</span>
                                            {lecture.duration && (
                                              <span className="flex items-center">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {lecture.duration} min
                                              </span>
                                            )}
                                            <span className="flex items-center">
                                              {lecture.isPublished ? (
                                                <>
                                                  <Eye className="h-3 w-3 mr-1 text-accent-400" />
                                                  <span className="text-accent-400">Available</span>
                                                </>
                                              ) : (
                                                <>
                                                  <EyeOff className="h-3 w-3 mr-1 text-orange-400" />
                                                  <span className="text-orange-400">Coming Soon</span>
                                                </>
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center space-x-2">
                                        {lecture.isPublished && week.isActive ? (
                                          <Button
                                            size="sm"
                                            onClick={() => handleLectureSelect(lecture)}
                                            icon={<Play className="h-4 w-4" />}
                                          >
                                            Watch
                                          </Button>
                                        ) : (
                                          <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded-full">
                                            {!week.isActive ? 'Week Locked' : 'Coming Soon'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {lecture.description && (
                                      <p className="text-dark-300 text-sm mt-3">{lecture.description}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 bg-dark-800 rounded-lg">
                                <Video className="h-12 w-12 text-dark-400 mx-auto mb-3" />
                                <p className="text-dark-300">No lectures available yet</p>
                              </div>
                            )}
                          </div>

                          {/* Assignments Section */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-semibold text-white flex items-center">
                                <FileText className="h-5 w-5 mr-2" />
                                Assignments ({weekAssignments[week.id]?.length || 0})
                              </h4>
                            </div>

                            {weekAssignments[week.id] && weekAssignments[week.id].length > 0 ? (
                              <div className="space-y-3">
                                {weekAssignments[week.id].map((assignment) => {
                                  const submission = assignmentSubmissions[assignment.id];
                                  const result = assignmentResults[assignment.id];
                                  const isOverdue = isAssignmentOverdue(assignment);
                                  const timeLeft = getTimeRemaining(assignment.dueDate);
                                  const canSubmit = canSubmitAssignment(assignment, []);
                                  const canEdit = canEditAssignment(assignment);
                                  const deadlinePassed = result?.deadlinePassed || false;

                                  return (
                                    <div key={assignment.id} className="bg-dark-800 p-4 rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-10 h-10 bg-accent-600 rounded-lg flex items-center justify-center">
                                            {submission?.isSubmitted ? (
                                              <CheckCircle className="h-5 w-5 text-white" />
                                            ) : submission && !submission.isSubmitted ? (
                                              <Save className="h-5 w-5 text-white" />
                                            ) : (
                                              <Award className="h-5 w-5 text-white" />
                                            )}
                                          </div>
                                          <div>
                                            <h5 className="text-white font-medium">{assignment.title}</h5>
                                            <div className="flex items-center space-x-4 text-sm text-dark-400">
                                              <span>{assignment.totalPoints} points</span>
                                              <span className={`flex items-center ${isOverdue ? 'text-red-400' : 'text-dark-400'}`}>
                                                <Clock className="h-3 w-3 mr-1" />
                                                {timeLeft}
                                              </span>
                                              {submission?.isSubmitted && deadlinePassed && submission.score !== undefined ? (
                                                <span className="text-accent-400">
                                                  Score: {submission.score}%
                                                </span>
                                              ) : submission?.isSubmitted && !deadlinePassed ? (
                                                <span className="text-blue-400">
                                                  Submitted - Results pending
                                                </span>
                                              ) : submission && !submission.isSubmitted ? (
                                                <span className="text-blue-400">
                                                  Draft saved
                                                </span>
                                              ) : null}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                          {week.isActive ? (
                                            <>
                                              {submission?.isSubmitted ? (
                                                <div className="flex items-center space-x-2">
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAssignmentSelect(assignment)}
                                                    icon={<Eye className="h-4 w-4" />}
                                                  >
                                                    View Results
                                                  </Button>
                                                </div>
                                              ) : submission && !submission.isSubmitted ? (
                                                <div className="flex items-center space-x-2">
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAssignmentSelect(assignment)}
                                                    icon={<Edit3 className="h-4 w-4" />}
                                                  >
                                                    Continue
                                                  </Button>
                                                </div>
                                              ) : (
                                                <div className="flex items-center space-x-2">
                                                  <Button
                                                    size="sm"
                                                    onClick={() => handleAssignmentSelect(assignment)}
                                                    icon={<ArrowRight className="h-4 w-4" />}
                                                    disabled={!canSubmit}
                                                  >
                                                    {canSubmit ? 'Start' : 'Unavailable'}
                                                  </Button>
                                                </div>
                                              )}
                                            </>
                                          ) : (
                                            <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded-full">
                                              Week Locked
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {assignment.description && (
                                        <p className="text-dark-300 text-sm mt-3">{assignment.description}</p>
                                      )}

                                      {isOverdue && !submission?.isSubmitted && (
                                        <div className="mt-3 flex items-center text-red-400 text-sm">
                                          <AlertTriangle className="h-4 w-4 mr-1" />
                                          {assignment.allowLateSubmission 
                                            ? 'This assignment is past due date (late penalty may apply)'
                                            : 'This assignment is overdue and no longer accepts submissions'
                                          }
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-8 bg-dark-800 rounded-lg">
                                <FileText className="h-12 w-12 text-dark-400 mx-auto mb-3" />
                                <p className="text-dark-300">No assignments available yet</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default CoursesView;