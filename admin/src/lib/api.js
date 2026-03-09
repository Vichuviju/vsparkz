/**
 * Axios instance for Vsparkz Admin API.
 * Base URL from env; token attached via interceptor from localStorage.
 */
import axios from 'axios';

// Direct connection to backend (no proxy). Override with VITE_API_URL if needed.
const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// Attach Sanctum token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vsparkz_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // FormData must be sent with multipart boundary – do not force application/json
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// On 401, clear token and redirect to login (handled by app router)
// On 403 with code subscription_expired, show subscription expired screen
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vsparkz_token');
      localStorage.removeItem('vsparkz_user');
      window.dispatchEvent(new Event('auth-logout'));
    }
    if (error.response?.status === 403 && error.response?.data?.code === 'subscription_expired') {
      window.dispatchEvent(new CustomEvent('subscription-expired', { detail: error.response.data }));
    }
    return Promise.reject(error);
  }
);

export default api;
