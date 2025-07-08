import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  BookOpen, 
  Video, 
  FileText,
  Eye,
  EyeOff,
  Clock,
  Users,
  Award,
  ChevronDown,
  ChevronRight,
  Play,
  Settings,
  Save,
  X
} from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Modal from '../UI/Modal';
import LectureEditor from './LectureEditor';
import AssignmentBuilder from './AssignmentBuilder';
import { Course, Week, Lecture } from '../../types';
import { Assignment } from '../../types/assignment';
import { 
  getCourses, 
  createCourse,
  updateCourse,
  deleteCourse,
  getWeeks, 
  createWeek, 
  updateWeek, 
  deleteWeek,
  createLecture,
  updateLecture,
  deleteLecture
} from '../../services/database';
import { 
  saveAssignment,
  getWeekAssignments,
  deleteAssignment
} from '../../services/assignmentService';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const ContentManager: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [weekAssignments, setWeekAssignments] = useState<Record<string, Assignment[]>>({});
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showWeekModal, setShowWeekModal] = useState(false);
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  
  // Editing states
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingWeek, setEditingWeek] = useState<Week | null>(null);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<string>('');

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
      toast.error('Failed to fetch weeks');
    }
  };

  const fetchWeekAssignments = async (weekId: string) => {
    try {
      const assignments = await getWeekAssignments(weekId);
      setWeekAssignments(prev => ({
        ...prev,
        [weekId]: assignments
      }));
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

  // Course Management
  const handleCreateCourse = () => {
    setEditingCourse(null);
    setShowCourseModal(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (courseData: Partial<Course>) => {
    if (!user) return;

    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, courseData);
        toast.success('Course updated successfully!');
      } else {
        const courseId = await createCourse({
          ...courseData as Omit<Course, 'id'>,
          createdBy: user.uid,
          weeks: []
        });
        toast.success('Course created successfully!');
      }
      
      await fetchCourses();
      setShowCourseModal(false);
      setEditingCourse(null);
    } catch (error) {
      toast.error('Failed to save course');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This will also delete all weeks, lectures, and assignments.')) return;

    try {
      await deleteCourse(courseId);
      await fetchCourses();
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(courses.length > 1 ? courses.find(c => c.id !== courseId) || null : null);
      }
      toast.success('Course deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  // Week Management
  const handleCreateWeek = () => {
    setEditingWeek(null);
    setShowWeekModal(true);
  };

  const handleEditWeek = (week: Week) => {
    setEditingWeek(week);
    setShowWeekModal(true);
  };

  const handleSaveWeek = async (weekData: Partial<Week>) => {
    if (!selectedCourse) return;

    try {
      if (editingWeek) {
        await updateWeek(selectedCourse.id, editingWeek.id, weekData);
        toast.success('Week updated successfully!');
      } else {
        await createWeek(selectedCourse.id, weekData as Omit<Week, 'id' | 'courseId'>);
        toast.success('Week created successfully!');
      }
      
      await fetchWeeks(selectedCourse.id);
      setShowWeekModal(false);
      setEditingWeek(null);
    } catch (error) {
      toast.error('Failed to save week');
    }
  };

  const handleDeleteWeek = async (weekId: string) => {
    if (!selectedCourse || !confirm('Are you sure you want to delete this week?')) return;

    try {
      await deleteWeek(selectedCourse.id, weekId);
      await fetchWeeks(selectedCourse.id);
      toast.success('Week deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete week');
    }
  };

  // Lecture Management
  const handleCreateLecture = (weekId: string) => {
    setSelectedWeekId(weekId);
    setEditingLecture(null);
    setShowLectureModal(true);
  };

  const handleEditLecture = (lecture: Lecture) => {
    setEditingLecture(lecture);
    setSelectedWeekId(lecture.weekId);
    setShowLectureModal(true);
  };

  const handleSaveLecture = async (lectureData: Lecture) => {
    if (!selectedCourse) return;

    try {
      if (editingLecture) {
        await updateLecture(selectedCourse.id, selectedWeekId, editingLecture.id, lectureData);
        toast.success('Lecture updated successfully!');
      } else {
        await createLecture(selectedCourse.id, selectedWeekId, lectureData);
        toast.success('Lecture created successfully!');
      }
      
      await fetchWeeks(selectedCourse.id);
      setShowLectureModal(false);
      setEditingLecture(null);
    } catch (error) {
      toast.error('Failed to save lecture');
    }
  };

  const handleDeleteLecture = async (weekId: string, lectureId: string) => {
    if (!selectedCourse || !confirm('Are you sure you want to delete this lecture?')) return;

    try {
      await deleteLecture(selectedCourse.id, weekId, lectureId);
      await fetchWeeks(selectedCourse.id);
      toast.success('Lecture deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete lecture');
    }
  };

  // Assignment Management
  const handleCreateAssignment = (weekId: string) => {
    setSelectedWeekId(weekId);
    setEditingAssignment(null);
    setShowAssignmentModal(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setSelectedWeekId(assignment.weekId);
    setShowAssignmentModal(true);
  };

  const handleSaveAssignment = async (assignmentData: Assignment) => {
    try {
      await saveAssignment(selectedWeekId, assignmentData);
      await fetchWeekAssignments(selectedWeekId);
      setShowAssignmentModal(false);
      setEditingAssignment(null);
      toast.success('Assignment saved successfully!');
    } catch (error) {
      toast.error('Failed to save assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await deleteAssignment(assignmentId);
      // Refresh assignments for all weeks
      weeks.forEach(week => {
        fetchWeekAssignments(week.id);
      });
      toast.success('Assignment deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Content Manager</h1>
          <p className="text-dark-300">Manage courses, content, lectures, and assignments</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleCreateCourse} icon={<Plus className="h-4 w-4" />}>
            New Course
          </Button>
          {selectedCourse && (
            <Button onClick={handleCreateWeek} icon={<Plus className="h-4 w-4" />}>
              Add Week
            </Button>
          )}
        </div>
      </div>

      {/* Course Management */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Courses ({courses.length})</h2>
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-dark-400" />
            <Button size="sm" onClick={handleCreateCourse} icon={<Plus className="h-4 w-4" />}>
              Create Course
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <motion.div
              key={course.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative ${
                selectedCourse?.id === course.id
                  ? 'border-primary-600 bg-primary-600/10'
                  : 'border-dark-600 hover:border-dark-500'
              }`}
            >
              <div onClick={() => setSelectedCourse(course)}>
                <h3 className="text-white font-semibold mb-2">{course.title}</h3>
                <p className="text-dark-300 text-sm mb-3">{course.description}</p>
                <div className="flex items-center justify-between text-xs text-dark-400">
                  <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
                  <span>Updated {new Date(course.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Course Actions */}
              <div className="absolute top-2 right-2 flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCourse(course);
                  }}
                  icon={<Edit3 className="h-3 w-3" />}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCourse(course.id);
                  }}
                  icon={<Trash2 className="h-3 w-3" />}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Course Content */}
      {selectedCourse && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">{selectedCourse.title} - Content</h2>
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
              <h3 className="text-lg font-semibold text-white mb-2">No weeks created yet</h3>
              <p className="text-dark-300 mb-6">Start by creating your first week of content</p>
              <Button onClick={handleCreateWeek} icon={<Plus className="h-4 w-4" />}>
                Create First Week
              </Button>
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
                          <span className="px-2 py-1 bg-accent-600 text-white text-xs rounded-full">Active</span>
                        ) : (
                          <span className="px-2 py-1 bg-dark-600 text-dark-300 text-xs rounded-full">Inactive</span>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditWeek(week)}
                          icon={<Edit3 className="h-4 w-4" />}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteWeek(week.id)}
                          icon={<Trash2 className="h-4 w-4" />}
                        />
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
                        {week.isActive ? 'Available to students' : 'Hidden from students'}
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
                              <Button
                                size="sm"
                                onClick={() => handleCreateLecture(week.id)}
                                icon={<Plus className="h-4 w-4" />}
                              >
                                Add Lecture
                              </Button>
                            </div>

                            {week.lectures && week.lectures.length > 0 ? (
                              <div className="space-y-3">
                                {week.lectures.map((lecture) => (
                                  <div key={lecture.id} className="bg-dark-800 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-secondary-600 rounded-lg flex items-center justify-center">
                                          {lecture.videoUrl ? (
                                            <Play className="h-5 w-5 text-white" />
                                          ) : (
                                            <Video className="h-5 w-5 text-white" />
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
                                                  <span className="text-accent-400">Published</span>
                                                </>
                                              ) : (
                                                <>
                                                  <EyeOff className="h-3 w-3 mr-1 text-orange-400" />
                                                  <span className="text-orange-400">Draft</span>
                                                </>
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center space-x-2">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleEditLecture(lecture)}
                                          icon={<Edit3 className="h-4 w-4" />}
                                        />
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleDeleteLecture(week.id, lecture.id)}
                                          icon={<Trash2 className="h-4 w-4" />}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 bg-dark-800 rounded-lg">
                                <Video className="h-12 w-12 text-dark-400 mx-auto mb-3" />
                                <p className="text-dark-300">No lectures created yet</p>
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
                              <Button
                                size="sm"
                                onClick={() => handleCreateAssignment(week.id)}
                                icon={<Plus className="h-4 w-4" />}
                              >
                                Add Assignment
                              </Button>
                            </div>

                            {weekAssignments[week.id] && weekAssignments[week.id].length > 0 ? (
                              <div className="space-y-3">
                                {weekAssignments[week.id].map((assignment) => (
                                  <div key={assignment.id} className="bg-dark-800 p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-accent-600 rounded-lg flex items-center justify-center">
                                          <Award className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                          <h5 className="text-white font-medium">{assignment.title}</h5>
                                          <div className="flex items-center space-x-4 text-sm text-dark-400">
                                            <span>{assignment.totalPoints} points</span>
                                            <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                            <span>Max attempts: {assignment.maxAttempts}</span>
                                            <span className="flex items-center">
                                              {assignment.isPublished ? (
                                                <>
                                                  <Eye className="h-3 w-3 mr-1 text-accent-400" />
                                                  <span className="text-accent-400">Published</span>
                                                </>
                                              ) : (
                                                <>
                                                  <EyeOff className="h-3 w-3 mr-1 text-orange-400" />
                                                  <span className="text-orange-400">Draft</span>
                                                </>
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center space-x-2">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleEditAssignment(assignment)}
                                          icon={<Edit3 className="h-4 w-4" />}
                                        />
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleDeleteAssignment(assignment.id)}
                                          icon={<Trash2 className="h-4 w-4" />}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 bg-dark-800 rounded-lg">
                                <FileText className="h-12 w-12 text-dark-400 mx-auto mb-3" />
                                <p className="text-dark-300">No assignments created yet</p>
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

      {/* Course Modal */}
      <CourseModal
        isOpen={showCourseModal}
        onClose={() => {
          setShowCourseModal(false);
          setEditingCourse(null);
        }}
        onSave={handleSaveCourse}
        course={editingCourse}
      />

      {/* Week Modal */}
      <WeekModal
        isOpen={showWeekModal}
        onClose={() => {
          setShowWeekModal(false);
          setEditingWeek(null);
        }}
        onSave={handleSaveWeek}
        week={editingWeek}
        weekNumber={weeks.length + 1}
      />

      {/* Lecture Modal */}
      <LectureEditor
        isOpen={showLectureModal}
        onCancel={() => {
          setShowLectureModal(false);
          setEditingLecture(null);
        }}
        onSave={handleSaveLecture}
        lecture={editingLecture || undefined}
      />

      {/* Assignment Modal */}
      <AssignmentBuilder
        isOpen={showAssignmentModal}
        onCancel={() => {
          setShowAssignmentModal(false);
          setEditingAssignment(null);
        }}
        onSave={handleSaveAssignment}
        assignment={editingAssignment || undefined}
      />
    </div>
  );
};

// Course Modal Component (unchanged)
interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Partial<Course>) => void;
  course: Course | null;
}

const CourseModal: React.FC<CourseModalProps> = ({ isOpen, onClose, onSave, course }) => {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || ''
  });

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        description: course.description
      });
    } else {
      setFormData({
        title: '',
        description: ''
      });
    }
  }, [course]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={course ? 'Edit Course' : 'Create Course'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">Course Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={3}
            required
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {course ? 'Update Course' : 'Create Course'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Week Modal Component (unchanged)
interface WeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (week: Partial<Week>) => void;
  week: Week | null;
  weekNumber: number;
}

const WeekModal: React.FC<WeekModalProps> = ({ isOpen, onClose, onSave, week, weekNumber }) => {
  const [formData, setFormData] = useState({
    weekNumber: week?.weekNumber || weekNumber,
    title: week?.title || '',
    description: week?.description || '',
    startDate: week?.startDate ? week.startDate.split('T')[0] : '',
    endDate: week?.endDate ? week.endDate.split('T')[0] : '',
    isActive: week?.isActive || false
  });

  useEffect(() => {
    if (week) {
      setFormData({
        weekNumber: week.weekNumber,
        title: week.title,
        description: week.description,
        startDate: week.startDate.split('T')[0],
        endDate: week.endDate.split('T')[0],
        isActive: week.isActive
      });
    } else {
      setFormData({
        weekNumber: weekNumber,
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        isActive: false
      });
    }
  }, [week, weekNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const weekData = {
      ...formData,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate + 'T23:59:59').toISOString(),
      lectures: week?.lectures || [],
      assignments: week?.assignments || []
    };
    
    onSave(weekData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={week ? 'Edit Week' : 'Create Week'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Week Number</label>
            <input
              type="number"
              min="1"
              value={formData.weekNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, weekNumber: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="mr-2 rounded border-dark-600 bg-dark-700 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-dark-300">Active (visible to students)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {week ? 'Update Week' : 'Create Week'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ContentManager;