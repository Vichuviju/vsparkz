import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function ServicePackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/admin/service-packages')
      .then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setPackages(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        setPackages([]);
        setError('Failed to load service packages. Endpoint may not be configured yet.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">Productized Services</h1>
      <p className="text-text-muted mb-4">Service packages and productized offerings. Reuses pricing from Quotation flow.</p>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : packages.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center text-text-muted">
          No productized service packages yet. Add packages via the API or configure in Services & Pricing.
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="dark:bg-navy-800/50 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-navy-700">
              {packages.map((p) => (
                <tr key={p.id} className="dark:hover:bg-navy-800/50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{p.description ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ServicePackages;
export { ServicePackages };
