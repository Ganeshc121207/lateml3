import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Clock,
  Award,
  Activity,
  Calendar,
  Target
} from 'lucide-react';
import Card from '../UI/Card';
import { getAnalytics } from '../../services/database';
import { Analytics } from '../../types';

const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const statsCards = [
    {
      title: 'Total Students',
      value: analytics?.totalStudents || 0,
      icon: Users,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/10',
      change: '+12%',
      changeType: 'increase' as const,
    },
    {
      title: 'Active Students',
      value: analytics?.activeStudents || 0,
      icon: Activity,
      color: 'text-accent-400',
      bgColor: 'bg-accent-500/10',
      change: '+8%',
      changeType: 'increase' as const,
    },
    {
      title: 'Course Completion',
      value: `${analytics?.courseCompletionRate || 0}%`,
      icon: Award,
      color: 'text-secondary-400',
      bgColor: 'bg-secondary-500/10',
      change: '+15%',
      changeType: 'increase' as const,
    },
    {
      title: 'Average Progress',
      value: `${analytics?.averageProgress || 0}%`,
      icon: Target,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      change: '+5%',
      changeType: 'increase' as const,
    },
  ];

  const recentActivities = [
    { id: 1, action: 'New student enrolled', time: '2 minutes ago', type: 'enrollment' },
    { id: 2, action: 'Assignment submitted', time: '5 minutes ago', type: 'submission' },
    { id: 3, action: 'Week 3 content published', time: '1 hour ago', type: 'content' },
    { id: 4, action: 'Student completed quiz', time: '2 hours ago', type: 'completion' },
    { id: 5, action: 'New feedback received', time: '3 hours ago', type: 'feedback' },
  ];

  const upcomingDeadlines = [
    { id: 1, title: 'Week 4 Assignment Due', date: '2024-01-15', course: 'Advanced Calculus' },
    { id: 2, title: 'Midterm Exam', date: '2024-01-20', course: 'Linear Algebra' },
    { id: 3, title: 'Project Submission', date: '2024-01-25', course: 'Statistics' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-dark-300">Overview of your e-learning platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
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
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-accent-400 mr-1" />
                    <span className="text-accent-400 text-sm font-medium">{stat.change}</span>
                    <span className="text-dark-400 text-sm ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Recent Activities</h2>
              <Activity className="h-5 w-5 text-dark-400" />
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{activity.action}</p>
                    <p className="text-xs text-dark-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors">
              View all activities →
            </button>
          </Card>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
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
                <div key={deadline.id} className="border-l-2 border-secondary-600 pl-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white">{deadline.title}</h3>
                    <span className="text-xs text-dark-400">{deadline.date}</span>
                  </div>
                  <p className="text-xs text-dark-400 mt-1">{deadline.course}</p>
                </div>
              ))}
            </div>
            <button className="mt-4 text-secondary-400 hover:text-secondary-300 text-sm font-medium transition-colors">
              View calendar →
            </button>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center space-x-3 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
              <BookOpen className="h-6 w-6 text-primary-400" />
              <div className="text-left">
                <p className="text-white font-medium">Create New Course</p>
                <p className="text-dark-400 text-sm">Add a new course to the platform</p>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
              <Users className="h-6 w-6 text-accent-400" />
              <div className="text-left">
                <p className="text-white font-medium">Manage Students</p>
                <p className="text-dark-400 text-sm">View and manage student accounts</p>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
              <Clock className="h-6 w-6 text-secondary-400" />
              <div className="text-left">
                <p className="text-white font-medium">Schedule Content</p>
                <p className="text-dark-400 text-sm">Plan and schedule new content</p>
              </div>
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;