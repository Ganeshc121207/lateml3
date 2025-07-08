import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp,
  Calendar,
  Play,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Card from '../UI/Card';
import Button from '../UI/Button';
import { useAuth } from '../../hooks/useAuth';
import { useProgress } from '../../hooks/useProgress';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { progress, loading } = useProgress(user?.uid || '', 'default-course');

  const courses = [
    {
      id: 1,
      title: 'Advanced Calculus',
      progress: 75,
      nextLesson: 'Integration by Parts',
      dueAssignment: '2024-01-15',
      color: 'bg-primary-600'
    },
    {
      id: 2,
      title: 'Linear Algebra',
      progress: 60,
      nextLesson: 'Eigenvalues and Eigenvectors',
      dueAssignment: '2024-01-18',
      color: 'bg-secondary-600'
    },
    {
      id: 3,
      title: 'Statistics',
      progress: 45,
      nextLesson: 'Hypothesis Testing',
      dueAssignment: '2024-01-20',
      color: 'bg-accent-600'
    }
  ];

  const upcomingDeadlines = [
    { id: 1, title: 'Calculus Assignment 4', course: 'Advanced Calculus', due: '2024-01-15', priority: 'high' },
    { id: 2, title: 'Linear Algebra Quiz', course: 'Linear Algebra', due: '2024-01-18', priority: 'medium' },
    { id: 3, title: 'Statistics Project', course: 'Statistics', due: '2024-01-25', priority: 'low' },
  ];

  const recentActivities = [
    { id: 1, action: 'Completed "Derivatives" lesson', time: '2 hours ago', type: 'completion' },
    { id: 2, action: 'Submitted Assignment 3', time: '1 day ago', type: 'submission' },
    { id: 3, action: 'Scored 95% on Linear Algebra Quiz', time: '2 days ago', type: 'achievement' },
    { id: 4, action: 'Started new week content', time: '3 days ago', type: 'progress' },
  ];

  const studyStats = [
    {
      title: 'Study Streak',
      value: '12 days',
      icon: TrendingUp,
      color: 'text-accent-400',
      bgColor: 'bg-accent-500/10',
    },
    {
      title: 'Total Hours',
      value: '45.5h',
      icon: Clock,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/10',
    },
    {
      title: 'Completed',
      value: '28/40',
      icon: CheckCircle,
      color: 'text-secondary-400',
      bgColor: 'bg-secondary-500/10',
    },
    {
      title: 'Average Score',
      value: '87%',
      icon: Award,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user?.displayName || 'Student'}! 👋
        </h1>
        <p className="text-dark-300">Continue your learning journey</p>
      </div>

      {/* Study Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {studyStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Current Courses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">My Courses</h2>
            <BookOpen className="h-5 w-5 text-dark-400" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-dark-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{course.title}</h3>
                  <div className={`w-3 h-3 rounded-full ${course.color}`}></div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-dark-300">Progress</span>
                    <span className="text-sm font-medium text-white">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-dark-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${course.color}`}
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <Play className="h-4 w-4 text-dark-400 mr-2" />
                    <span className="text-dark-300">Next: {course.nextLesson}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <AlertCircle className="h-4 w-4 text-orange-400 mr-2" />
                    <span className="text-dark-300">Due: {course.dueAssignment}</span>
                  </div>
                </div>
                
                <Button size="sm" className="w-full">
                  Continue Learning
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Upcoming Deadlines</h2>
              <Calendar className="h-5 w-5 text-dark-400" />
            </div>
            <div className="space-y-4">
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-white">{deadline.title}</h3>
                    <p className="text-xs text-dark-400">{deadline.course}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-dark-300">{deadline.due}</p>
                    <span className={`inline-block w-2 h-2 rounded-full mt-1 ${
                      deadline.priority === 'high' ? 'bg-red-500' :
                      deadline.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                    }`}></span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
              <TrendingUp className="h-5 w-5 text-dark-400" />
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'completion' ? 'bg-accent-600' :
                      activity.type === 'submission' ? 'bg-primary-600' :
                      activity.type === 'achievement' ? 'bg-secondary-600' : 'bg-orange-600'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{activity.action}</p>
                    <p className="text-xs text-dark-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start p-4 h-auto">
              <div className="text-left">
                <p className="font-medium">Resume Last Session</p>
                <p className="text-sm text-dark-400">Continue where you left off</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start p-4 h-auto">
              <div className="text-left">
                <p className="font-medium">Take Practice Quiz</p>
                <p className="text-sm text-dark-400">Test your knowledge</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start p-4 h-auto">
              <div className="text-left">
                <p className="font-medium">Study Schedule</p>
                <p className="text-sm text-dark-400">Plan your study time</p>
              </div>
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default StudentDashboard;