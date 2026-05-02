import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { Logo } from '../components/Logo';

export const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token') || '', [params]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/auth/forgot-password', { email });
      setMessage('Reset link sent. Check your email.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setMessage('Password reset successful. You can now sign in.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-airline-light flex justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <h1 className="text-2xl font-bold mb-4">{token ? 'Set New Password' : 'Reset Password'}</h1>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {message && <p className="text-green-600 text-sm mb-3">{message}</p>}
        {!token ? (
          <form onSubmit={requestReset} className="space-y-4">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="Email address" className="w-full border rounded-lg px-3 py-2" />
            <button disabled={loading} className="w-full bg-airline-blue text-white py-2 rounded-lg font-semibold disabled:opacity-50">Send Reset Link</button>
          </form>
        ) : (
          <form onSubmit={submitReset} className="space-y-4">
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="New password" className="w-full border rounded-lg px-3 py-2" />
            <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required placeholder="Confirm password" className="w-full border rounded-lg px-3 py-2" />
            <button disabled={loading} className="w-full bg-airline-blue text-white py-2 rounded-lg font-semibold disabled:opacity-50">Update Password</button>
          </form>
        )}
        <Link className="text-airline-blue text-sm mt-5 inline-block" to="/login">Back to Login</Link>
      </div>
    </div>
  );
};
