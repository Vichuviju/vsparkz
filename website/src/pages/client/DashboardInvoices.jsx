import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function DashboardInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/client/invoices')
      .then((r) => setInvoices(Array.isArray(r.data) ? r.data : []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-4">Invoices</h1>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}
      {loading ? <p className="text-text-muted">Loading…</p> : invoices.length === 0 ? (
        <p className="text-text-muted">No invoices yet.</p>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800/50 text-left">
                <th className="px-5 py-3 text-text-muted font-medium">Number</th>
                <th className="px-5 py-3 text-text-muted font-medium">Total</th>
                <th className="px-5 py-3 text-text-muted font-medium">Status</th>
                <th className="px-5 py-3 text-text-muted font-medium">Due date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-navy-600 hover:bg-navy-700/30">
                  <td className="px-5 py-3 font-medium text-text-primary">{inv.number}</td>
                  <td className="px-5 py-3 text-text-muted">{inv.total}</td>
                  <td className="px-5 py-3 text-text-muted">{inv.status}</td>
                  <td className="px-5 py-3 text-text-muted">{inv.due_date ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
