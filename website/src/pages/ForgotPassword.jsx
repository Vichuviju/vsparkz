import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-navy" />
        <div className="w-full max-w-md text-center relative z-10 glass-card p-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Check your email</h1>
          <p className="text-text-muted mb-6">If an account exists for that email, we sent a password reset link.</p>
          <Link to="/login" className="text-accent hover:text-accent-bright font-medium transition-colors">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-navy" />
      <div className="w-full max-w-md relative z-10 glass-card p-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Reset password</h1>
        <p className="text-text-muted text-sm mb-6">Enter your email to receive a reset link.</p>
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
              className="w-full rounded-vsparkz border border-surface-border bg-navy-800/80 px-4 py-2.5 text-text-primary placeholder-text-secondary focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
              placeholder="you@example.com"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <p className="mt-6 text-center">
          <Link to="/login" className="text-accent hover:text-accent-bright text-sm font-medium transition-colors">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
