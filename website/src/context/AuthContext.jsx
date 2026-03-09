import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'vsparkz_token';
const USER_KEY = 'vsparkz_user';

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5173';

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(!!token);

  const persistAuth = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/login', { email, password });
    persistAuth(data.token, data.user);
    const role = (data.user?.role ?? data.user?.effective_role ?? '').toString().trim().toLowerCase();
    if (role === 'client') {
      navigate('/dashboard');
    } else if (['freelancer', 'employee', 'project_manager'].includes(role)) {
      navigate('/portal/assigned-projects');
    } else {
      window.location.href = ADMIN_URL;
    }
    return data;
  }, [navigate, persistAuth]);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/register', payload);
    persistAuth(data.token, data.user);
    if (data.user.role === 'client') {
      navigate('/dashboard');
    } else {
      window.location.href = ADMIN_URL;
    }
    return data;
  }, [navigate, persistAuth]);

  const logout = useCallback(async () => {
    try {
      await api.post('/admin/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const oauthError = params.get('oauth_error');
    if (oauthError) {
      window.history.replaceState({}, '', window.location.pathname);
      window.dispatchEvent(new CustomEvent('oauth-error', { detail: oauthError }));
      return;
    }
    if (tokenFromUrl && params.get('oauth') === '1') {
      window.history.replaceState({}, '', window.location.pathname);
      api.get('/admin/me', { headers: { Authorization: `Bearer ${tokenFromUrl}` } })
        .then(({ data }) => {
          persistAuth(tokenFromUrl, data);
          if (data.role === 'client') {
            navigate('/dashboard');
          } else {
            window.location.href = ADMIN_URL;
          }
        })
        .catch(() => {
          navigate('/login');
        });
    }
  }, [navigate, persistAuth]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/admin/me')
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem(USER_KEY, JSON.stringify(data));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isClient: user?.role === 'client',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
