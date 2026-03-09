import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function AdsPerformance() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/admin/campaigns')
      .then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setCampaigns(Array.isArray(d) ? d : (r.data?.data && Array.isArray(r.data.data) ? r.data.data : []));
      })
      .catch(() => {
        setCampaigns([]);
        setError('Failed to load campaigns.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">Ads Performance</h1>
      <p className="text-text-muted mb-4">Campaigns and ad performance metrics. Connect Meta Ads or other channels for detailed metrics.</p>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="dark:bg-navy-800/50 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Campaign</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Client / Project</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-navy-700">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-text-muted">
                    No campaigns yet. Create campaigns from the Campaigns section.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="dark:hover:bg-navy-800/50">
                    <td className="px-4 py-3 font-medium">{c.name ?? c.title ?? '—'}</td>
                    <td className="px-4 py-3">{c.client?.company_name ?? c.project_id ?? '—'}</td>
                    <td className="px-4 py-3">{c.status ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdsPerformance;
export { AdsPerformance };
