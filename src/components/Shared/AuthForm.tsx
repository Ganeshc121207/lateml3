import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, User, BookOpen } from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface AuthFormData {
  email: string;
  password: string;
  displayName?: string;
  role?: 'admin' | 'student';
}

const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  
  const { signIn, signUp, loading } = useAuth();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AuthFormData>();

  const onSubmit = async (data: AuthFormData) => {
    try {
      if (isSignUp) {
        await signUp(data.email, data.password, data.displayName!, data.role || 'student');
        toast.success('Account created successfully! Welcome!');
      } else {
        await signIn(data.email, data.password);
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <BookOpen className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">MathLearn</h1>
          <p className="text-dark-300">Your journey to mathematical excellence</p>
        </div>

        <Card className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-dark-300">
              {isSignUp ? 'Join thousands of learners' : 'Sign in to your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dark-400" />
                  <input
                    type="text"
                    {...register('displayName', { required: isSignUp })}
                    className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.displayName && (
                  <p className="mt-1 text-sm text-red-400">Name is required</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dark-400" />
                <input
                  type="email"
                  {...register('email', { required: true, pattern: /^\S+@\S+$/i })}
                  className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">Valid email is required</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dark-400" />
                <input
                  type="password"
                  {...register('password', { required: true, minLength: 6 })}
                  className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">Password must be at least 6 characters</p>
              )}
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Account Type
                </label>
                <select
                  {...register('role')}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="student">Student</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-300">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthForm;