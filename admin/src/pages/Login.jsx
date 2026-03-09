import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null); // null = checking, true = ok, false = not connected
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const healthUrl = apiBase.replace(/\/api\/?$/, '') + '/api/health';

  const checkBackend = async () => {
    setBackendStatus(null);
    try {
      const res = await fetch(healthUrl, { cache: 'no-store' });
      const data = await res.json();
      setBackendStatus(res.ok && data?.ok === true);
    } catch {
      setBackendStatus(false);
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      let msg = data?.message || data?.errors?.email?.[0];
      if (status === 500) {
        msg = msg || (typeof data === 'string' ? 'Server error. See details below.' : 'Server error (500). Ensure backend is running (cd backend && php artisan serve) and database is set up (php artisan migrate && php artisan db:seed).');
      } else if (err.code === 'ERR_NETWORK' || !status) {
        msg = 'Cannot reach API. Start the backend: cd backend && php artisan serve';
      }
      setError(msg || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden dark:bg-gradient-navy bg-gray-100">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-muted/10 rounded-full blur-3xl" />
      <div className="w-full max-w-md glass-card p-8 relative z-10">
        <div className="flex justify-center mb-6">
          <img src="/logo/logo1.png" alt="V-Sparkz Digital" className="h-32 w-32 object-contain" />
        </div>
        <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900 text-center mb-1">V-Sparkz Admin</h1>
        <p className="dark:text-text-muted text-gray-500 text-center text-sm mb-6">Sign in to the admin portal</p>

        <div className="mb-6 p-4 rounded-vsparkz dark:bg-navy-800/60 bg-white border dark:border-navy-600 border-gray-200 text-sm">
          {backendStatus === null && (
            <div className="flex items-center gap-2 text-accent">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span>Connecting...</span>
            </div>
          )}
          {backendStatus === true && (
            <div className="flex items-center gap-2 text-accent-bright">
              <div className="w-2 h-2 bg-accent-bright rounded-full animate-pulse" />
              <span>Backend online</span>
            </div>
          )}
          {backendStatus === false && (
            <div className="text-accent-muted space-y-2 border border-accent-muted/40 rounded-vsparkz p-3 dark:bg-navy-900/50 bg-rose-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent-muted rounded-full" />
                <p className="font-medium dark:text-text-primary text-gray-900">Backend offline</p>
              </div>
              <p className="text-xs dark:text-text-muted text-gray-600">Start the backend:</p>
              <code className="block text-xs dark:bg-navy-950 bg-gray-100 p-2 rounded border dark:border-navy-600 border-gray-200 mt-1 text-accent">cd backend && php artisan serve</code>
              <button type="button" onClick={checkBackend} className="text-xs underline text-accent hover:text-accent-bright mt-2">Reconnect</button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 dark:text-accent-bright text-cyan-800 text-sm">{error}</div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@vsparkz.com"
              className="w-full px-4 py-3 dark:bg-navy-800/80 bg-white border dark:border-navy-600 border-gray-200 rounded-vsparkz focus:ring-2 focus:ring-accent/30 focus:border-accent dark:text-text-primary text-gray-900 placeholder-gray-400 transition-all"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1.5">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-3 dark:bg-navy-800/80 bg-white border dark:border-navy-600 border-gray-200 rounded-vsparkz focus:ring-2 focus:ring-accent/30 focus:border-accent dark:text-text-primary text-gray-900 placeholder-gray-400 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Signing in...</span>
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-xs dark:text-text-muted text-gray-500">V-Sparkz Digital Marketing Platform</p>
        </div>
      </div>
    </div>
  );
}
