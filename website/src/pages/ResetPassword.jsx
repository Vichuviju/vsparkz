import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [password_confirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== password_confirmation) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/reset-password', { token, email, password, password_confirmation });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const authLayout = (children) => (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-navy" />
      <div className="w-full max-w-md relative z-10 glass-card p-8 animate-fade-in">
        <div className="flex justify-center mb-6">
          <img src="/logo/logo1.png" alt="V-Sparkz Digital" className="h-32 w-32 object-contain" />
        </div>
        {children}
      </div>
    </div>
  );

  if (success) {
    return authLayout(
      <div className="text-center">
        <div className="w-14 h-14 rounded-vsparkz-lg bg-accent/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Password reset</h1>
        <p className="text-text-muted mb-6">Your password has been updated. You can now sign in.</p>
        <Link to="/login" className="text-accent hover:text-accent-bright font-medium transition-colors">Sign in</Link>
      </div>
    );
  }

  if (!token) {
    return authLayout(
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Invalid link</h1>
        <p className="text-text-muted mb-6">This reset link is invalid or expired.</p>
        <Link to="/forgot-password" className="text-accent hover:text-accent-bright font-medium transition-colors">Request a new link</Link>
      </div>
    );
  }

  return authLayout(
    <>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Set new password</h1>
      <p className="text-text-muted text-sm mb-6">Enter your new password below.</p>
      {error && (
        <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-vsparkz border border-surface-border bg-navy-800/80 px-4 py-2.5 text-text-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-vsparkz border border-surface-border bg-navy-800/80 px-4 py-2.5 text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/30"
            required
            minLength={8}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">Confirm password</label>
          <input
            type="password"
            value={password_confirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            className="w-full rounded-vsparkz border border-surface-border bg-navy-800/80 px-4 py-2.5 text-text-primary focus:border-accent focus:ring-1 focus:ring-accent/30"
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </>
  );
}
