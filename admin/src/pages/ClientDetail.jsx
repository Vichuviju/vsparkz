import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';

export function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/admin/clients/${id}/profile`)
      .then(({ data }) => setProfile(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load client'))
      .finally(() => setLoading(false));
    api.get('/admin/projects', { params: { client_id: id, per_page: 100 } })
      .then(({ data }) => setProjects(data.data ?? data ?? []))
      .catch(() => setProjects([]));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-text-muted">Loading…</div>;
  if (error || !profile) return <div className="p-8"><div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright">{error || 'Client not found'}</div><Link to="/clients" className="text-accent hover:underline">Back to Clients</Link></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/clients" className="text-sm text-text-muted hover:text-accent mb-1 inline-block">← Clients</Link>
          <h1 className="text-2xl font-bold text-text-primary">{profile.company_name}</h1>
        </div>
        <Link to="/projects" state={{ clientId: parseInt(id, 10) }} className="btn-primary px-4 py-2 text-sm no-underline">Add Project</Link>
      </div>

      <div className="glass-card p-6 mb-6">
        <h2 className="font-semibold text-text-primary mb-3">Company</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-text-muted">Contact</dt><dd className="text-text-primary">{profile.contact_name ?? '—'}</dd>
          <dt className="text-text-muted">Email</dt><dd className="text-text-primary">{profile.email ?? '—'}</dd>
          <dt className="text-text-muted">Phone</dt><dd className="text-text-primary">{profile.phone ?? '—'}</dd>
          <dt className="text-text-muted">Source</dt><dd className="text-text-primary">{profile.source ?? '—'}</dd>
          <dt className="text-text-muted">Address</dt><dd className="text-text-primary col-span-2">{profile.address ?? '—'}</dd>
        </dl>
      </div>

      <div className="glass-card overflow-hidden mb-6">
        <h2 className="px-5 py-3 border-b border-navy-600 font-semibold text-text-primary">Projects ({projects.length})</h2>
        {projects.length === 0 ? (
          <p className="px-5 py-4 text-text-muted text-sm">No projects yet. Use &quot;Add Project&quot; to create one (status: Project Initialized).</p>
        ) : (
          <ul className="divide-y divide-navy-600">
            {projects.map((p) => (
              <li key={p.id} className="px-5 py-3 flex justify-between items-center">
                <span className="text-text-primary font-medium">{p.name}</span>
                <span className="text-text-muted text-xs mr-2">{p.workflow_status?.replace(/_/g, ' ') ?? p.status}</span>
                <Link to={`/projects/${p.id}`} className="text-accent hover:text-accent-bright text-sm">View</Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="glass-card overflow-hidden mb-6">
        <h2 className="px-5 py-3 border-b border-navy-600 font-semibold text-text-primary">Invoices</h2>
        {(!profile.invoices || profile.invoices.length === 0) ? (
          <p className="px-5 py-4 text-text-muted text-sm">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-navy-800/50 text-left"><th className="px-5 py-3 text-text-muted font-medium">Number</th><th className="px-5 py-3 text-text-muted font-medium">Total</th><th className="px-5 py-3 text-text-muted font-medium">Status</th><th className="px-5 py-3 text-text-muted font-medium">Due</th><th className="px-5 py-3 text-text-muted font-medium">Actions</th></tr></thead>
              <tbody>
                {profile.invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-navy-600">
                    <td className="px-5 py-3 text-text-primary font-mono">{inv.number}</td>
                    <td className="px-5 py-3 text-text-muted">{Number(inv.total).toFixed(2)}</td>
                    <td className="px-5 py-3"><span className="inline-flex px-2 py-0.5 rounded text-xs bg-accent/20 text-accent">{inv.status}</span></td>
                    <td className="px-5 py-3 text-text-muted">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-3"><Link to={`/invoices/${inv.id}`} className="text-accent hover:text-accent-bright">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-card overflow-hidden mb-6">
        <h2 className="px-5 py-3 border-b border-navy-600 font-semibold text-text-primary">Quotations</h2>
        {(!profile.quotations || profile.quotations.length === 0) ? (
          <p className="px-5 py-4 text-text-muted text-sm">No quotations yet.</p>
        ) : (
          <ul className="divide-y divide-navy-600">
            {profile.quotations.map((q) => (
              <li key={q.id} className="px-5 py-3 flex justify-between items-center">
                <span className="text-text-primary">{q.number} – {q.title ?? '—'}</span>
                <span className="text-text-muted text-sm">{q.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <h2 className="px-5 py-3 border-b border-navy-600 font-semibold text-text-primary">Agreements</h2>
        {(!profile.agreements || profile.agreements.length === 0) ? (
          <p className="px-5 py-4 text-text-muted text-sm">No agreements yet.</p>
        ) : (
          <ul className="divide-y divide-navy-600">
            {profile.agreements.map((a) => (
              <li key={a.id} className="px-5 py-3 flex justify-between items-center">
                <span className="text-text-primary">{a.title}</span>
                <span className="text-text-muted text-sm">{a.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
