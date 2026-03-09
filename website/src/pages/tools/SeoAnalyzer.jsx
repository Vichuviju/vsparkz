import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export default function SeoAnalyzer() {
  const { isAuthenticated } = useAuth();
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const runAnalysis = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const config = isAuthenticated ? {} : {};
      const { data } = await api.post('/tools/seo-analyze', { url: url.trim() }, config);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Analysis failed');
      if (err.response?.data?.requires_subscription) {
        setError('Free use limit reached. Please subscribe for more analyses.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-2">SEO Analyzer</h1>
        <p className="text-text-muted mb-6">Enter a URL to get a quick SEO check (meta title, description, score).</p>
        {!isAuthenticated && (
          <p className="mb-4 p-3 rounded-vsparkz bg-accent/10 border border-accent/20 text-accent-bright text-sm">
            <Link to="/login" className="underline">Log in</Link> or <Link to="/register" className="underline">sign up</Link> for 1 free analysis per account.
          </p>
        )}
        {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}
        <form onSubmit={runAnalysis} className="flex gap-2 mb-6">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-4 py-2.5 rounded-vsparkz border border-surface-border bg-navy-800/80 text-text-primary placeholder-text-secondary focus:border-accent focus:ring-1 focus:ring-accent/30"
            required
          />
          <button type="submit" disabled={loading} className="btn-primary px-5 py-2.5 disabled:opacity-50">
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </form>
        {result && (
          <div className="glass-card p-5 animate-fade-in">
            <h2 className="font-semibold text-text-primary mb-2">Result</h2>
            <p className="text-text-muted text-sm">URL: {result.url}</p>
            <p className="text-text-muted text-sm mt-1">Title: {result.title || '—'}</p>
            <p className="text-text-muted text-sm mt-1">Description: {result.description || '—'}</p>
            <p className="mt-3 text-accent font-medium">Score: {result.score}/100</p>
          </div>
        )}
      </div>
    </div>
  );
}
