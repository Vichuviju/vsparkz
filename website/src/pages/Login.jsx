import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  const googleUrl = `${API_BASE}/auth/google?redirect_uri=${encodeURIComponent(window.location.origin + '/dashboard')}`;
  const facebookUrl = `${API_BASE}/auth/facebook?redirect_uri=${encodeURIComponent(window.location.origin + '/dashboard')}`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-navy" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-muted/10 rounded-full blur-3xl" />
      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-8 animate-fade-in">
          <div className="flex justify-center mb-6">
            <img src="/logo/logo1.png" alt="V-Sparkz Digital" className="h-32 w-32 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary text-center mb-1">Welcome back</h1>
          <p className="text-text-muted text-sm text-center mb-6">Sign in to V-Sparkz</p>
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
                className="w-full rounded-vsparkz border border-surface-border bg-navy-800/80 px-4 py-2.5 text-text-primary placeholder-text-secondary focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all glow-accent"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-vsparkz border border-surface-border bg-navy-800/80 px-4 py-2.5 text-text-primary placeholder-text-secondary focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all glow-accent"
                required
              />
            </div>
            <div className="flex justify-end text-sm">
              <Link to="/forgot-password" className="text-accent hover:text-accent-bright transition-colors">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
          <div className="mt-6">
            <p className="text-center text-text-muted text-sm mb-3">Or continue with</p>
            <div className="flex gap-3 justify-center">
              <a href={googleUrl} className="inline-flex items-center justify-center rounded-vsparkz border border-surface-border bg-navy-800/60 px-4 py-2.5 text-sm text-text-primary hover:bg-navy-700 hover:border-accent/20 transition-all">
                Google
              </a>
              <a href={facebookUrl} className="inline-flex items-center justify-center rounded-vsparkz border border-surface-border bg-navy-800/60 px-4 py-2.5 text-sm text-text-primary hover:bg-navy-700 hover:border-accent/20 transition-all">
                Facebook
              </a>
            </div>
          </div>
          <p className="mt-6 text-center text-text-muted text-sm">
            Don&apos;t have an account? <Link to="/register" className="text-accent hover:text-accent-bright transition-colors font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
