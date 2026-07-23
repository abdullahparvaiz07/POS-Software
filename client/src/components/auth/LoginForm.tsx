/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  UtensilsCrossed
} from 'lucide-react';
import { authService } from '../../services/authService';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const savedUsername = authService.getRememberedUsername();
    if (savedUsername) {
      setEmail(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError && e.target.value.trim() !== '') setEmailError(null);
    if (formError) setFormError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError && e.target.value !== '') setPasswordError(null);
    if (formError) setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);

    if (!email.trim()) {
      setEmailError('Email address is required');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }
    if (hasError) return;

    try {
      setLoading(true);
      const res = await authService.login(email, password, rememberMe);
      if (res.success) {
        onLoginSuccess();
      } else {
        setFormError(res.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setFormError('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full font-sans antialiased">
      
      {/* TOP SECTION */}
      <div className="flex flex-col items-center text-center mb-8">
        
        {/* Restaurant POS Logo */}
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#F97316] to-[#FB923C] text-white shadow-lg shadow-orange-500/25 mb-4">
          <UtensilsCrossed className="h-6 w-6" />
        </div>

        {/* Small Platform Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#EA580C] text-[11px] font-semibold tracking-wide uppercase mb-3">
          <span>🍽</span>
          <span>Restaurant Management Platform</span>
        </div>

        {/* Large Heading */}
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
          Welcome Back
        </h2>

        {/* Supporting Text */}
        <p className="text-sm text-slate-500 mt-2 font-normal max-w-xs">
          Sign in to manage your restaurant operations.
        </p>
      </div>

      {/* LOGIN FIELDS */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        
        {/* Error Banner */}
        {formError && (
          <div className="flex items-start gap-3 rounded-[14px] bg-red-50 border border-red-200 p-4 text-xs text-red-700">
            <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Sign in failed: </span>{formError}
            </div>
          </div>
        )}

        {/* Email Address Field */}
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Mail className="h-5 w-5" />
            </div>
            <input
              id="email"
              type="email"
              required
              disabled={loading}
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email address"
              className={`block w-full h-[56px] rounded-[14px] border pl-11 pr-4 text-sm bg-[#F8F9FA] text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 transition-all duration-200 ${
                emailError 
                  ? 'border-red-400 focus:ring-red-500/15' 
                  : 'border-[#E5E7EB] focus:border-[#F97316] focus:ring-[#F97316]/15'
              }`}
            />
          </div>
          {emailError && (
            <p className="mt-1.5 text-xs font-medium text-red-500">{emailError}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-5 w-5" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              disabled={loading}
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              className={`block w-full h-[56px] rounded-[14px] border pl-11 pr-11 text-sm bg-[#F8F9FA] text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 transition-all duration-200 ${
                passwordError 
                  ? 'border-red-400 focus:ring-red-500/15' 
                  : 'border-[#E5E7EB] focus:border-[#F97316] focus:ring-[#F97316]/15'
              }`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {passwordError && (
            <p className="mt-1.5 text-xs font-medium text-red-500">{passwordError}</p>
          )}
        </div>

        {/* OPTIONS ROW */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              disabled={loading}
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#F97316] focus:ring-[#F97316]/20 cursor-pointer accent-[#F97316]"
            />
            <span className="text-xs font-medium text-slate-600">Remember Me</span>
          </label>

          <a 
            href="#forgot-password" 
            onClick={(e) => { e.preventDefault(); alert('Please contact your POS administrator to reset your password.'); }}
            className="text-xs font-semibold text-[#F97316] hover:text-[#EA580C] transition-colors"
          >
            Forgot Password?
          </a>
        </div>

        {/* PRIMARY BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[56px] flex items-center justify-center rounded-[14px] bg-gradient-to-r from-[#FB923C] to-[#F97316] hover:brightness-105 active:scale-[0.99] text-base font-bold text-white shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:shadow-none transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#F97316]/30 mt-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Signing In...</span>
            </span>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* FOOTER */}
      <div className="mt-8 text-center text-xs text-slate-400 font-medium">
        Need assistance? <span className="text-slate-500 font-semibold cursor-pointer hover:underline">Contact your administrator</span>
      </div>

    </div>
  );
};
