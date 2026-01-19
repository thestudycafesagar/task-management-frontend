'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import ButtonLoader from '@/components/ButtonLoader';
import toast from 'react-hot-toast';
import { FiCheckSquare, FiMail, FiLock, FiUser, FiBriefcase, FiArrowRight, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuthStore();
  const [step, setStep] = useState(1); // 1: Company, 2: Name, 3: Email, 4: Password
  const [formData, setFormData] = useState({
    companyName: '',
    adminName: '',
    adminEmail: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCompanySubmit = (e) => {
    e.preventDefault();
    
    if (!formData.companyName.trim()) {
      toast.error('Please enter your company name');
      return;
    }

    if (formData.companyName.trim().length < 2) {
      toast.error('Company name must be at least 2 characters');
      return;
    }

    setStep(2);
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.adminName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (formData.adminName.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    setStep(3);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.adminEmail) {
      toast.error('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.adminEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setStep(4);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.password) {
      toast.error('Please enter a password');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setIsLoading(true);
      const data = await signup(
        formData.companyName,
        formData.adminName,
        formData.adminEmail,
        formData.password
      );
      toast.success('🎉 Company account created successfully!');
      router.push(data.redirectTo || '/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl mb-4 shadow-lg transform hover:scale-110 transition-transform duration-300">
            <FiCheckSquare className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Create Your Company
          </h1>
          <p className="text-gray-600 text-lg">Start managing tasks in minutes ⚡</p>
        </div>

        {/* Form */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 animate-slideIn">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8 gap-2">
            <div className={`h-2 w-12 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gray-200'}`}></div>
            <div className={`h-2 w-12 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gray-200'}`}></div>
            <div className={`h-2 w-12 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gray-200'}`}></div>
            <div className={`h-2 w-12 rounded-full transition-all duration-300 ${step >= 4 ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gray-200'}`}></div>
          </div>

          {/* Step 1: Company Name */}
          {step === 1 && (
            <form onSubmit={handleCompanySubmit} className="space-y-6 animate-slideIn">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  What's your company name?
                </label>
                <div className="relative group">
                  <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all bg-white/50 text-lg"
                    placeholder="Acme Inc."
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                Continue
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}

          {/* Step 2: Admin Name */}
          {step === 2 && (
            <form onSubmit={handleNameSubmit} className="space-y-6 animate-slideIn">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  What's your full name?
                </label>
                <div className="relative group">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="text"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all bg-white/50 text-lg"
                    placeholder="John Doe"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-shrink-0 px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <FiArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                >
                  Continue
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Email */}
          {step === 3 && (
            <form onSubmit={handleEmailSubmit} className="space-y-6 animate-slideIn">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  What's your work email?
                </label>
                <div className="relative group">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all bg-white/50 text-lg"
                    placeholder="john@company.com"
                    autoFocus
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-shrink-0 px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <FiArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                >
                  Continue
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Password */}
          {step === 4 && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6 animate-slideIn">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Create a secure password
                </label>
                <div className="relative group">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all bg-white/50 text-lg"
                    placeholder="Min. 8 characters"
                    autoFocus
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Password must be at least 8 characters</p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={isLoading}
                  className="flex-shrink-0 px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FiArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                >
                  {isLoading ? (
                    <ButtonLoader />
                  ) : (
                    <>
                      Create Account
                      <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Already have an account?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            href="/login"
            className="block w-full text-center py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all transform hover:scale-[1.02]"
          >
            Sign In
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6 animate-fadeIn">
          By signing up, you agree to our{' '}
          <Link href="#" className="text-indigo-600 hover:underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="#" className="text-indigo-600 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
