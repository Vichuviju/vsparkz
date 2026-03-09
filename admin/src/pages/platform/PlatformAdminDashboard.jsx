import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export function PlatformAdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) return;
    api.get('/admin/platform/analytics')
      .then(({ data: d }) => setData(d))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-6 text-amber-800 dark:text-amber-200">
        Access restricted. Super admin only.
      </div>
    );
  }

  if (loading) return <div className="text-text-muted">Loading…</div>;
  if (error) return <div className="text-accent-bright">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Platform Admin</h1>
      <p className="text-text-muted text-sm mb-6">
        Manage tenants, plans, and subscriptions.{' '}
        <Link to="/platform-admin/tenants" className="text-accent hover:underline">Tenants</Link>
        {' · '}
        <Link to="/platform-admin/plans" className="text-accent hover:underline">Plans</Link>
        {' · '}
        <Link to="/platform-admin/subscriptions" className="text-accent hover:underline">Subscriptions</Link>
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-vsparkz-lg border border-navy-600 bg-navy-800/40 p-4">
          <p className="text-sm text-text-muted">Total Tenants</p>
          <p className="text-2xl font-bold text-text-primary">{data?.total_tenants ?? 0}</p>
        </div>
        <div className="rounded-vsparkz-lg border border-navy-600 bg-navy-800/40 p-4">
          <p className="text-sm text-text-muted">Active</p>
          <p className="text-2xl font-bold text-text-primary">{data?.active_tenants ?? 0}</p>
        </div>
        <div className="rounded-vsparkz-lg border border-navy-600 bg-navy-800/40 p-4">
          <p className="text-sm text-text-muted">Expired</p>
          <p className="text-2xl font-bold text-text-primary">{data?.expired_tenants ?? 0}</p>
        </div>
        <div className="rounded-vsparkz-lg border border-navy-600 bg-navy-800/40 p-4">
          <p className="text-sm text-text-muted">MRR (₹)</p>
          <p className="text-2xl font-bold text-text-primary">{Number(data?.mrr ?? 0).toLocaleString()}</p>
        </div>
      </div>
      {data?.usage_load?.length > 0 && (
        <div className="rounded-vsparkz-lg border border-navy-600 bg-navy-800/40 p-4">
          <h2 className="text-lg font-semibold text-text-primary mb-3">Usage (top tenants)</h2>
          <ul className="space-y-2 text-sm text-text-muted">
            {data.usage_load.map((t) => (
              <li key={t.id} className="flex justify-between">
                <span>{t.name}</span>
                <span>Users: {t.users_count} | Clients: {t.clients_count} | Projects: {t.projects_count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
