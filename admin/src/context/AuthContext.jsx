import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'vsparkz_token';
const USER_KEY = 'vsparkz_user';

export function AuthProvider({ children }) {
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
  const [branding, setBranding] = useState(null);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/login', { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

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
    const handleLogout = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  // Validate token on mount
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

  // Fetch tenant branding when authenticated (for theming)
  useEffect(() => {
    if (!token || !user) {
      setBranding(null);
      return;
    }
    api.get('/admin/branding').then(({ data }) => {
      const payload = data?.data ?? data;
      setBranding(payload?.branding ? { branding: payload.branding, domains: payload.domains ?? [], email_identities: payload.email_identities ?? [] } : null);
    }).catch(() => setBranding(null));
  }, [token, user]);

  // Apply branding as CSS variables and data attributes
  useEffect(() => {
    const root = document.documentElement;
    if (!branding?.branding) {
      root.style.removeProperty('--tenant-primary-color');
      root.style.removeProperty('--tenant-secondary-color');
      root.style.removeProperty('--tenant-logo-url');
      root.removeAttribute('data-tenant-brand-name');
      return;
    }
    const b = branding.branding;
    if (b.primary_color) root.style.setProperty('--tenant-primary-color', b.primary_color);
    else root.style.removeProperty('--tenant-primary-color');
    if (b.secondary_color) root.style.setProperty('--tenant-secondary-color', b.secondary_color);
    else root.style.removeProperty('--tenant-secondary-color');
    if (b.logo_path) root.style.setProperty('--tenant-logo-url', `url(${b.logo_path})`);
    else root.style.removeProperty('--tenant-logo-url');
    if (b.brand_name) root.setAttribute('data-tenant-brand-name', b.brand_name);
    else root.removeAttribute('data-tenant-brand-name');
  }, [branding]);

  const value = {
    user,
    token,
    loading,
    branding,
    isAuthenticated: !!token && !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
