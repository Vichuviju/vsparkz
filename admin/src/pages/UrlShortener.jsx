import { useState, useEffect } from 'react';
import api from '../lib/api';

export function UrlShortener() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [originalUrl, setOriginalUrl] = useState('');

  const fetchLinks = async () => {
    try {
      const { data } = await api.get('/admin/utilities/short-links');
      setLinks(data.data || []);
    } catch (err) {
      console.error('Failed to fetch short links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!originalUrl) return;
    try {
      await api.post('/admin/utilities/short-links', { original_url: originalUrl });
      setOriginalUrl('');
      fetchLinks();
    } catch (err) {
      alert('Failed to shorten URL');
    }
  };

  const copyToClipboard = (code) => {
    const url = `${window.location.origin}/s/${code}`;
    navigator.clipboard.writeText(url);
    alert('Copied to clipboard: ' + url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">URL Shortener</h1>
        <p className="text-sm dark:text-text-muted text-gray-500">Create trackable short links for your campaigns</p>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleCreate} className="flex gap-4">
          <input
            type="url"
            required
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            placeholder="Paste your long URL here..."
            className="flex-1 px-4 py-3 rounded-xl border dark:border-navy-600 border-gray-200 dark:bg-navy-800 bg-white dark:text-text-primary outline-none focus:ring-2 focus:ring-accent/20"
          />
          <button type="submit" className="btn-primary px-8 py-3 rounded-xl font-bold">Shorten</button>
        </form>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b dark:border-navy-700 border-gray-200">
              <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase">Original URL</th>
              <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase">Short URL</th>
              <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase">Clicks</th>
              <th className="px-6 py-4 text-xs font-semibold dark:text-text-muted text-gray-500 uppercase text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-navy-700 divide-gray-200">
            {loading ? (
              <tr><td colSpan="4" className="px-6 py-10 text-center dark:text-text-muted">Loading links...</td></tr>
            ) : links.length === 0 ? (
              <tr><td colSpan="4" className="px-6 py-10 text-center dark:text-text-muted">No links created yet.</td></tr>
            ) : (
              links.map(link => (
                <tr key={link.id} className="dark:hover:bg-navy-800/50 hover:bg-gray-50">
                  <td className="px-6 py-4 dark:text-text-muted text-sm truncate max-w-[200px]" title={link.original_url}>{link.original_url}</td>
                  <td className="px-6 py-4 font-mono text-accent text-sm">/s/{link.short_code}</td>
                  <td className="px-6 py-4 dark:text-text-primary font-bold">{link.clicks}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => copyToClipboard(link.short_code)}
                      className="text-xs font-bold uppercase tracking-wider dark:text-text-muted hover:text-accent transition-colors"
                    >
                      Copy
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
