import { useState } from 'react';
import api from '../lib/api';

/**
 * SEO Analyzer – lead magnet / tool page (PRD §3.2).
 * Free 1-time use → can be extended with backend analysis API.
 */
export function SeoAnalyzer() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.post('/tools/seo-analyze', { url: url.trim() });
      setResult(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Analysis failed';
      setError(err.response?.status === 403 && err.response?.data?.requires_subscription
        ? (err.response?.data?.message || 'Free use limit reached. Subscribe for more analyses.')
        : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">SEO Analyzer</h1>
        <p className="mt-1 text-sm dark:text-text-muted text-gray-500">
          Enter a URL to run a quick SEO check. Use this as a lead-generation tool (1 free analysis).
        </p>
      </div>

      <div className="glass-card p-6 max-w-2xl">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label htmlFor="seo-url" className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">
              Website URL
            </label>
            <input
              id="seo-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-accent/30 focus:border-accent"
              required
            />
          </div>
          {error && (
            <div className="p-3 rounded-vsparkz bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-3 disabled:opacity-50"
          >
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </form>
      </div>

      {result && (
        <div className="mt-6 glass-card p-6 max-w-2xl">
          <h2 className="font-semibold dark:text-text-primary text-gray-900 mb-2">Result</h2>
          <p className="text-sm dark:text-text-muted text-gray-500 mb-1">URL: {result.url}</p>
          <p className="text-sm dark:text-text-primary text-gray-700 mt-2"><strong>Title:</strong> {result.title || '—'}</p>
          <p className="text-sm dark:text-text-primary text-gray-700 mt-1"><strong>Description:</strong> {result.description || '—'}</p>
          <p className="text-sm dark:text-text-primary text-gray-700 mt-2"><strong>Score:</strong> {result.score ?? '—'}/100</p>
          {result.used_free !== undefined && (
            <p className="text-xs dark:text-text-muted text-gray-500 mt-2">{result.used_free ? 'This counted as your free analysis.' : ''}</p>
          )}
        </div>
      )}
    </div>
  );
}
