import React, { useState } from 'react';
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Car,
  Compass,
} from 'lucide-react';
import type { ActiveViewKey } from '../../components/ShellHeader';
import { useAuth } from '../../context/AuthContext';

interface SignUpViewProps {
  onNavigate: (view: ActiveViewKey) => void;
}

export const SignUpView: React.FC<SignUpViewProps> = ({ onNavigate }) => {
  const { register, loginWithGoogle, isFirebaseConfigured } = useAuth();

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<'passenger' | 'driver' | 'dispatcher'>('passenger');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setErrorMessage('Please fill in your full name, email, and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must contain at least 6 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await register(email, password, fullName, role);
      if (role === 'driver') {
        onNavigate('driver-home');
      } else if (role === 'dispatcher') {
        onNavigate('ops-overview');
      } else {
        onNavigate('passenger-home');
      }
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      if (errObj.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Please sign in instead.');
      } else if (errObj.code === 'auth/weak-password') {
        setErrorMessage('Password is too weak. Please use at least 6 characters.');
      } else {
        setErrorMessage(errObj.message || 'Registration failed. Please check your network connection.');
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
      setErrorMessage(errObj.message || 'Google signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-zinc-50 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-zinc-200/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Mobility Brand Story */}
        <div className="lg:col-span-5 relative bg-zinc-950 text-white p-8 flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/images/oroute_hero_mobility.jpg"
              alt="ORoute metropolitan network"
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/40" />
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

            <div className="mt-8">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-medium border border-emerald-500/30 mb-3">
                <Sparkles className="w-3 h-3" />
                <span>Instant Onboarding</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Join the ORoute network.
              </h2>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
                Connect to verified pooled rides with strict 15% detour caps, cooperative Shapley fare savings, and real-time EV telemetry.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Guaranteed maximum 15% detour limit</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Transparent Shapley cost allocation</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Firebase Auth Engine:</span>
              {isFirebaseConfigured ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live Project
                </span>
              ) : (
                <span className="text-amber-400 font-medium">Demo Sandbox</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sign Up Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-zinc-950 tracking-tight">
                Create your account
              </h1>
              <p className="text-zinc-500 text-xs mt-1">
                Choose your participation role and register with Firebase.
              </p>
            </div>

            {/* Error Message banner */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Role Selection Segmented Control */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-100 rounded-xl border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setRole('passenger')}
                  className={`py-2 px-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                    role === 'passenger'
                      ? 'bg-white text-zinc-950 shadow-sm font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Passenger</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('driver')}
                  className={`py-2 px-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                    role === 'driver'
                      ? 'bg-white text-zinc-950 shadow-sm font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Driver</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('dispatcher')}
                  className={`py-2 px-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                    role === 'dispatcher'
                      ? 'bg-white text-zinc-950 shadow-sm font-semibold'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Dispatcher</span>
                </button>
              </div>
            </div>

            {/* Google Signup Button */}
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
              <span>Sign up with Google</span>
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-zinc-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-medium text-zinc-400 uppercase tracking-wider absolute">
                or with email
              </span>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1" htmlFor="signup-name">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Aditi Sharma"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1" htmlFor="signup-email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aditi@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-800 mb-1" htmlFor="signup-password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
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
                className="w-full py-3 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm disabled:opacity-60 mt-2"
              >
                {isSubmitting ? (
                  <span>Creating account...</span>
                ) : (
                  <>
                    <span>Create {role.charAt(0).toUpperCase() + role.slice(1)} Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Sign In */}
            <p className="text-center text-xs text-zinc-500 mt-5">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="font-semibold text-zinc-950 hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
