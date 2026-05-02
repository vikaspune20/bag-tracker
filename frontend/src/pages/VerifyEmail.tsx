import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Mail } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { Logo } from '../components/Logo';

export const VerifyEmail = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const loginAction = useAuthStore((s) => s.login);
  const email = params.get('email') || '';

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const otp = digits.join('');

  const handleChange = (idx: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[idx] = v;
      return next;
    });
    if (v && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    inputs.current[Math.min(text.length, 5)]?.focus();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || !email) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      loginAction(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) return;
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      const { data } = await api.post('/auth/resend-otp', { email });
      setInfo(data?.message || 'A new code has been sent.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-airline-light flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <Mail className="text-airline-blue" size={28} />
        </div>
        <h1 className="text-2xl font-black text-airline-dark text-center">Verify your email</h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          We sent a 6-digit code to <strong>{email || 'your inbox'}</strong>. Enter it below to activate your account.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                inputMode="numeric"
                maxLength={1}
                className="w-12 h-14 text-center text-2xl font-mono font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-airline-sky focus:border-airline-sky"
              />
            ))}
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          {info && <p className="text-sm text-green-700 text-center">{info}</p>}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-airline-blue text-white font-bold py-3 rounded-xl hover:bg-airline-dark disabled:opacity-60 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
            Verify email
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Didn't get a code?{' '}
          <button onClick={resend} disabled={resending} className="font-bold text-airline-blue hover:underline disabled:opacity-50">
            {resending ? 'Sending…' : 'Resend'}
          </button>
        </div>
        <div className="mt-4 text-center text-sm">
          <Link to="/login" className="text-gray-500 hover:text-gray-700">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
};
