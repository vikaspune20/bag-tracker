import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { Loader2, Plane, Box } from 'lucide-react';
import { Logo } from '../components/Logo';

export const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { data } = await api.post('/auth/login', { email, password });
      loginAction(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      const resp = err.response?.data;
      if (resp?.requiresOtp && resp?.email) {
        navigate(`/verify-email?email=${encodeURIComponent(resp.email)}`);
        return;
      }
      setError(resp?.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-airline-light flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-4xl flex flex-col md:flex-row rounded-2xl shadow-xl overflow-hidden bg-white border border-gray-100/80">
        {/* Branding panel */}
        <div className="md:w-1/2 bg-gradient-to-br from-[#00A8C5] via-[#0088b8] to-[#0066a3] text-white px-8 py-10 md:px-10 md:py-12 flex flex-col md:min-h-[560px]">
          <div className="inline-block rounded-xl bg-white/95 px-4 py-2.5 shadow-sm">
            <Logo size="sm" />
          </div>

          <div className="mt-10 md:mt-14">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Welcome Back!</h1>
            <p className="mt-4 text-sm sm:text-base text-white/90 leading-relaxed max-w-sm">
              Sign in to track your baggage and manage your travel journeys
            </p>
          </div>

          <div className="mt-10 md:mt-auto space-y-5 pb-2">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Plane className="h-6 w-6 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="font-bold text-white">Real-Time Tracking</p>
                <p className="text-sm text-white/80 mt-0.5">Monitor your baggage 24/7</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Box className="h-6 w-6 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="font-bold text-white">Journey History</p>
                <p className="text-sm text-white/80 mt-0.5">Access all your travel records</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sign-in form */}
        <div className="md:w-1/2 bg-white px-8 py-10 md:px-10 md:py-12 flex flex-col justify-center">
          <div>
            <h2 className="text-3xl font-bold text-airline-dark">Sign In</h2>
            <p className="mt-2 text-sm text-gray-500">Enter your credentials to access your account</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2.5 text-center text-sm text-red-700">{error}</div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-airline-dark">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="mt-2 w-full rounded-lg border-0 bg-[#dce8f3] px-4 py-3 text-sm text-airline-dark placeholder:text-slate-500 ring-1 ring-transparent transition focus:outline-none focus:ring-2 focus:ring-[#00A8C5]/60"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-airline-dark">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="mt-2 w-full rounded-lg border-0 bg-[#dce8f3] px-4 py-3 text-sm text-airline-dark placeholder:text-slate-500 ring-1 ring-transparent transition focus:outline-none focus:ring-2 focus:ring-[#00A8C5]/60"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-gray-600">
                <input
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-400 text-airline-blue focus:ring-airline-blue"
                />
                Remember me
              </label>
              <Link to="/reset-password" className="font-medium text-[#0d7bc4] hover:text-airline-dark">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-airline-dark py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-airline-blue focus:outline-none focus:ring-2 focus:ring-airline-blue focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-bold text-[#0d7bc4] hover:text-airline-dark">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
