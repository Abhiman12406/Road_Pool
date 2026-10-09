import React, { useState } from 'react';
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { ActiveViewKey } from '../../components/ShellHeader';
import { useAuth } from '../../context/AuthContext';

interface LoginViewProps {
  onNavigate: (view: ActiveViewKey) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate }) => {
  const { login, loginWithGoogle, isFirebaseConfigured } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const user = await login(email, password);
      // Direct user based on role
      if (user.role === 'driver') {
        onNavigate('driver-home');
      } else if (user.role === 'dispatcher') {
        onNavigate('ops-overview');
      } else {
        onNavigate('passenger-home');
      }
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      if (errObj.code === 'auth/invalid-credential' || errObj.code === 'auth/user-not-found') {
        setErrorMessage('Invalid email or password. Please check your credentials.');
      } else if (errObj.code === 'auth/wrong-password') {
        setErrorMessage('Incorrect password. Please try again.');
      } else {
        setErrorMessage(errObj.message || 'Authentication failed. Please check your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await loginWithGoogle();
      onNavigate('passenger-home');
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(errObj.message || 'Google authentication could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = (role: 'passenger' | 'driver' | 'ops') => {
    if (role === 'passenger') {
      setEmail('passenger@oroute.ai');
      setPassword('passenger123');
    } else if (role === 'driver') {
      setEmail('driver@oroute.ai');
      setPassword('driver123');
    } else {
      setEmail('ops@oroute.ai');
      setPassword('opsadmin123');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-zinc-50 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-zinc-200/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Visual & Mobility Branding */}
        <div className="lg:col-span-5 relative bg-zinc-950 text-white p-8 flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/images/oroute_auth_visual.jpg"
              alt="ORoute intelligent cockpit"
              className="w-full h-full object-cover opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/40" />
          </div>

          <div className="relative z-10">
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>

            <div className="mt-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-medium border border-emerald-500/30 mb-3">
                <Sparkles className="w-3 h-3" />
                <span>Single Sign-On</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Welcome to ORoute.
              </h2>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
                Log in to access your pooled rides, Shapley fare receipts, driver route controls, and fleet optimization metrics.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-10 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Firebase Engine:</span>
              {isFirebaseConfigured ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Project Connected
                </span>
              ) : (
                <span className="text-amber-400 font-medium">Sandbox Mode Active</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: High-contrast Authentication Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-extrabold text-zinc-950 tracking-tight">
                Sign in to your account
              </h1>
              <p className="text-zinc-500 text-xs mt-1">
                Enter your verified credentials or select a test role below.
              </p>
            </div>

            {/* Error Message banner */}
            {errorMessage && (
              <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Google Social Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 font-medium text-xs flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] disabled:opacity-60 mb-5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.9c2.28-2.1 3.645-5.18 3.645-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.09-6.68-4.91H1.21v3.15C3.25 21.43 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.32 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.56H1.21C.44 8.1 0 9.99 0 12s.44 3.9 1.21 5.44l4.11-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.57 1.21 6.56l4.11 3.15c.94-2.82 3.58-4.96 6.68-4.96z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-zinc-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-medium text-zinc-400 uppercase tracking-wider absolute">
                or with email
              </span>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1.5" htmlFor="login-email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-zinc-800" htmlFor="login-password">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setErrorMessage('Password reset link is dispatched via Firebase Auth.')}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-300 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-700"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In to ORoute</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials for Evaluation */}
            <div className="mt-8 pt-6 border-t border-zinc-100">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2.5">
                Quick One-Click Test Accounts
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('passenger')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium transition-colors text-center"
                >
                  Passenger
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('driver')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium transition-colors text-center"
                >
                  Driver
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('ops')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-medium transition-colors text-center"
                >
                  Fleet Ops
                </button>
              </div>
            </div>

            {/* Switch to Sign Up */}
            <p className="text-center text-xs text-zinc-500 mt-6">
              Do not have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="font-semibold text-zinc-950 hover:underline"
              >
                Sign up free
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
