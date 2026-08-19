import { useState, useEffect } from 'react';
import api from '../lib/api';

function AdsPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/admin/ads-performance')
      .then((r) => {
        setData(r.data);
      })
      .catch(() => {
        setError('Failed to load ad performance stats.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-primary mb-1">Ads Performance Analytics</h1>
          <p className="text-text-muted text-sm">Aggregated metrics, spending patterns, conversion trends, and campaign details.</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : !data || !data.summary ? (
        <div className="glass-card rounded-2xl p-6 text-center text-text-muted">
          No ad performance data recorded yet. Ensure you have active campaigns.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="glass-card p-4 rounded-xl border dark:border-navy-700 bg-white dark:bg-navy-800/80">
              <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Total Spend</span>
              <p className="text-xl font-bold text-text-primary mt-1">₹{Number(data.summary.total_spend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="glass-card p-4 rounded-xl border dark:border-navy-700 bg-white dark:bg-navy-800/80">
              <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Impressions</span>
              <p className="text-xl font-bold text-text-primary mt-1">{Number(data.summary.total_impressions || 0).toLocaleString()}</p>
            </div>
            <div className="glass-card p-4 rounded-xl border dark:border-navy-700 bg-white dark:bg-navy-800/80">
              <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Clicks</span>
              <p className="text-xl font-bold text-text-primary mt-1">{Number(data.summary.total_clicks || 0).toLocaleString()}</p>
            </div>
            <div className="glass-card p-4 rounded-xl border dark:border-navy-700 bg-white dark:bg-navy-800/80">
              <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Conversions</span>
              <p className="text-xl font-bold text-text-primary mt-1">{Number(data.summary.total_conversions || 0).toLocaleString()}</p>
            </div>
            <div className="glass-card p-4 rounded-xl border dark:border-navy-700 bg-white dark:bg-navy-800/80">
              <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Avg. CTR</span>
              <p className="text-xl font-bold text-text-primary mt-1">{data.summary.avg_ctr}%</p>
            </div>
            <div className="glass-card p-4 rounded-xl border dark:border-navy-700 bg-white dark:bg-navy-800/80">
              <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Avg. CPC</span>
              <p className="text-xl font-bold text-text-primary mt-1">₹{data.summary.avg_cpc}</p>
            </div>
          </div>

          {/* Daily trend metrics */}
          <div className="glass-card p-6 rounded-2xl border dark:border-navy-700">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Daily Performance Log (Last 14 Days)</h2>
            <div className="overflow-x-auto rounded-xl border dark:border-navy-700">
              <table className="w-full text-sm">
                <thead className="dark:bg-navy-800/50 bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-text-primary">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-text-primary">Spend</th>
                    <th className="text-left px-4 py-3 font-medium text-text-primary">Impressions</th>
                    <th className="text-left px-4 py-3 font-medium text-text-primary">Clicks</th>
                    <th className="text-left px-4 py-3 font-medium text-text-primary">Conversions</th>
                    <th className="text-left px-4 py-3 font-medium text-text-primary">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-navy-700">
                  {data.daily_trend.slice().reverse().map((day) => {
                    const ctr = day.impressions > 0 ? ((day.clicks / day.impressions) * 100).toFixed(2) : '0.00';
                    return (
                      <tr key={day.date} className="dark:hover:bg-navy-800/50">
                        <td className="px-4 py-3 text-text-muted">{day.date}</td>
                        <td className="px-4 py-3 text-text-primary font-medium">₹{Number(day.spend).toFixed(2)}</td>
                        <td className="px-4 py-3 text-text-muted">{Number(day.impressions).toLocaleString()}</td>
                        <td className="px-4 py-3 text-text-muted">{Number(day.clicks).toLocaleString()}</td>
                        <td className="px-4 py-3 text-text-muted">{Number(day.conversions).toLocaleString()}</td>
                        <td className="px-4 py-3 text-accent font-semibold">{ctr}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Campaign comparison table */}
          <div className="glass-card p-6 rounded-2xl border dark:border-navy-700">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Ad Campaign Performance</h2>
            <div className="overflow-x-auto rounded-xl border dark:border-navy-700">
              <table className="w-full text-sm">
                <thead className="dark:bg-navy-800/50 bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-text-primary">Campaign Name</th>
                    <th className="text-left px-4 py-3 font-medium text-text-primary">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-text-primary">Spend</th>
                    <th className="text-left px-4 py-3 font-medium text-text-primary">Impressions</th>
                    <th className="text-left px-4 py-3 font-medium text-text-primary">Clicks</th>
                    <th className="text-left px-4 py-3 font-medium text-text-primary">Conversions</th>
                    <th className="text-left px-4 py-3 font-medium text-text-primary">CTR</th>
                    <th className="text-left px-4 py-3 font-medium text-text-primary">CPC</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-navy-700">
                  {data.campaign_stats.map((c) => {
                    const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0.00';
                    const cpc = c.clicks > 0 ? (c.spend / c.clicks).toFixed(2) : '0.00';
                    return (
                      <tr key={c.id} className="dark:hover:bg-navy-800/50">
                        <td className="px-4 py-3 font-medium text-text-primary">{c.name}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                              c.status === 'active'
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-primary font-medium">₹{Number(c.spend).toLocaleString()}</td>
                        <td className="px-4 py-3 text-text-muted">{Number(c.impressions).toLocaleString()}</td>
                        <td className="px-4 py-3 text-text-muted">{Number(c.clicks).toLocaleString()}</td>
                        <td className="px-4 py-3 text-text-muted">{Number(c.conversions).toLocaleString()}</td>
                        <td className="px-4 py-3 text-accent font-semibold">{ctr}%</td>
                        <td className="px-4 py-3 text-text-primary font-semibold">₹{cpc}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdsPerformance;
export { AdsPerformance };
