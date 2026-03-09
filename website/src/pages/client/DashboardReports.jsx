import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function DashboardReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/client/reports')
      .then((r) => setReports(Array.isArray(r.data) ? r.data : []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-4">Campaign Reports</h1>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}
      {loading ? <p className="text-text-muted">Loading…</p> : reports.length === 0 ? (
        <p className="text-text-muted">No reports yet.</p>
      ) : (
        <ul className="space-y-2">
          {reports.map((r) => (
            <li key={r.id} className="p-3 glass-card rounded-vsparkz">
              <span className="font-medium text-text-primary">{r.title ?? 'Report #' + r.id}</span>
              <span className="text-text-muted text-sm ml-2">{r.type}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
