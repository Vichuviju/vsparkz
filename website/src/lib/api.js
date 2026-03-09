import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vsparkz_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vsparkz_token');
      localStorage.removeItem('vsparkz_user');
    }
    return Promise.reject(err);
  }
);

export async function getPageBySlug(slug) {
  const { data } = await api.get(`/pages/${slug}`);
  return data;
}

/** Active landing template + ordered sections and blocks (for home page). */
export async function getLanding() {
  const { data } = await api.get('/landing');
  return data;
}

/** Site settings (name, logo URL) for header/footer. */
export async function getSiteSettings() {
  const { data } = await api.get('/site-settings');
  return data;
}

export async function submitContact(payload) {
  const { data } = await api.post('/leads', { ...payload, source: 'contact' });
  return data;
}

export async function submitGetQuote(payload) {
  const { data } = await api.post('/leads', { ...payload, source: 'get_quote' });
  return data;
}

export async function submitInfluencerOnboarding(payload) {
  const { data } = await api.post('/influencers', payload);
  return data;
}
