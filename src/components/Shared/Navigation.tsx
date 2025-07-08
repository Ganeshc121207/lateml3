import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  BarChart3, 
  Users, 
  Upload, 
  Bell, 
  Settings, 
  LogOut,
  Menu,
  X,
  Home,
  Calendar,
  Award
} from 'lucide-react';
import Button from '../UI/Button';
import { useAuth } from '../../hooks/useAuth';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'content', label: 'Content Manager', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'upload', label: 'Bulk Upload', icon: Upload },
  ];

  const studentMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'courses', label: 'My Courses', icon: BookOpen },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'progress', label: 'Progress', icon: Award },
  ];

  const menuItems = user?.role === 'admin' ? adminMenuItems : studentMenuItems;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-dark-900 border-r border-dark-700 overflow-y-auto">
          <div className="flex items-center px-6 py-4 border-b border-dark-700">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-white">MathLearn</h1>
                <p className="text-xs text-dark-300 capitalize">{user?.role} Portal</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'text-dark-300 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </motion.button>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-dark-700">
            <div className="flex items-center px-4 py-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-full">
                <span className="text-sm font-medium text-white">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.displayName || 'User'}</p>
                <p className="text-xs text-dark-300">{user?.email}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                icon={<Bell className="h-4 w-4" />}
              >
                Notifications
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                icon={<Settings className="h-4 w-4" />}
              >
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-400 hover:text-red-300"
                icon={<LogOut className="h-4 w-4" />}
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-dark-900 border-b border-dark-700">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <h1 className="ml-2 text-lg font-bold text-white">MathLearn</h1>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(true)}
            icon={<Menu className="h-5 w-5" />}
          />
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="fixed inset-0 z-50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
              
              <motion.div
                className="fixed inset-y-0 right-0 w-64 bg-dark-900 border-l border-dark-700"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
                  <h2 className="text-lg font-semibold text-white">Menu</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                    icon={<X className="h-5 w-5" />}
                  />
                </div>

                <nav className="px-4 py-4 space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onViewChange(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-primary-600 text-white'
                            : 'text-dark-300 hover:text-white hover:bg-dark-800'
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-400 hover:text-red-300"
                    icon={<LogOut className="h-4 w-4" />}
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Navigation;