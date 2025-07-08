import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthForm from './components/Shared/AuthForm';
import Navigation from './components/Shared/Navigation';
import AdminDashboard from './components/Admin/Dashboard';
import ContentManager from './components/Admin/ContentManager';
import StudentDashboard from './components/Student/Dashboard';
import CoursesView from './components/Student/CoursesView';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const renderContent = () => {
    if (user.role === 'admin') {
      switch (currentView) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'content':
          return <ContentManager />;
        case 'analytics':
          return <div className="text-white">Analytics (Coming Soon)</div>;
        case 'students':
          return <div className="text-white">Students Management (Coming Soon)</div>;
        case 'upload':
          return <div className="text-white">Bulk Upload (Coming Soon)</div>;
        default:
          return <AdminDashboard />;
      }
    } else {
      switch (currentView) {
        case 'dashboard':
          return <StudentDashboard />;
        case 'courses':
          return <CoursesView />;
        case 'schedule':
          return <div className="text-white">Schedule (Coming Soon)</div>;
        case 'progress':
          return <div className="text-white">Progress Tracker (Coming Soon)</div>;
        default:
          return <StudentDashboard />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      
      <div className="lg:pl-64">
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="dark">
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1E293B',
                color: '#F1F5F9',
                border: '1px solid #334155',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#F1F5F9',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#F1F5F9',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;