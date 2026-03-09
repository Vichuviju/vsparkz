import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export function Agreements() {
  const [list, setList] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ client_id: '', project_id: '', title: '', scope: '', timeline: '', payment_terms: '', status: 'draft' });

  useEffect(() => {
    Promise.all([
      api.get('/admin/clients').then(r => setClients(r.data?.data ?? r.data ?? [])),
      api.get('/admin/projects').then(r => setProjects(r.data?.data ?? r.data ?? [])),
      api.get('/admin/agreements')
        .then(r => setList(r.data?.data ?? r.data ?? []))
        .catch(err => setError(err.response?.data?.message || 'Failed to load'))
    ]).finally(() => setLoading(false));
  }, []);

  const getClientName = (id) => clients.find(c => c.id === id)?.company_name ?? id;
  const getProjectName = (id) => projects.find(p => p.id === id)?.name ?? id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/agreements/${editing.id}`, form);
      } else {
        await api.post('/admin/agreements', form);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ client_id: '', project_id: '', title: '', scope: '', timeline: '', payment_terms: '', status: 'draft' });
      const { data } = await api.get('/admin/agreements');
      setList(data?.data ?? data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({ client_id: row.client_id, project_id: row.project_id, title: row.title, scope: row.scope, timeline: row.timeline, payment_terms: row.payment_terms, status: row.status });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this agreement?')) return;
    try {
      await api.delete(`/admin/agreements/${id}`);
      setList(list.filter((it) => it.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleView = async (row) => {
    try {
      const { data } = await api.get(`/admin/agreements/${row.id}`);
      setDetail(data);
      setShowDetailModal(true);
    } catch (err) {
      setError('Failed to load details');
    }
  };

  const handleDownloadPdf = async (agreementId) => {
    try {
      const response = await api.get(`/admin/agreements/${agreementId}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agreement-${agreementId}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      window.open(`${api.defaults.baseURL}/admin/agreements/${agreementId}/pdf`, '_blank');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Agreements</h1>
        <button className="btn-primary px-4 py-2" onClick={() => setShowModal(true)}>Add Agreement</button>
      </div>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}
      {loading ? <div className="p-8 text-center text-text-muted">Loading…</div> : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800/50 text-left">
                <th className="px-5 py-3 text-text-muted font-medium">Client</th>
                <th className="px-5 py-3 text-text-muted font-medium">Project</th>
                <th className="px-5 py-3 text-text-muted font-medium">Title</th>
                <th className="px-5 py-3 text-text-muted font-medium">Status</th>
                <th className="px-5 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={5} className="px-5 py-8 text-text-muted text-center">No agreements yet.</td></tr> : list.map((row) => (
                <tr key={row.id} className="border-t border-navy-600 hover:bg-navy-700/30">
                  <td className="px-5 py-3 text-text-primary">{getClientName(row.client_id)}</td>
                  <td className="px-5 py-3 text-text-muted">{getProjectName(row.project_id) || '—'}</td>
                  <td className="px-5 py-3 text-text-primary">{row.title}</td>
                  <td className="px-5 py-3 text-text-muted">{row.status}</td>
                  <td className="px-5 py-3">
                    <Link to={`/agreements/${row.id}`} className="text-accent hover:text-accent-bright mr-2">View</Link>
                    <button type="button" className="text-accent hover:text-accent-bright mr-2" onClick={() => handleDownloadPdf(row.id)}>PDF</button>
                    <button className="text-accent hover:text-accent-bright mr-2" onClick={() => handleEdit(row)}>Edit</button>
                    <button className="text-accent-muted hover:text-accent-bright" onClick={() => handleDelete(row.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-text-primary mb-4">{editing ? 'Edit' : 'Add'} Agreement</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Client</label>
                <select className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} required>
                  <option value="">Select Client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Project</label>
                <select className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})}>
                  <option value="">Select Project (optional)</option>
                  {projects.filter(p => !form.client_id || p.client_id == form.client_id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Title</label>
                <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Scope</label>
                <textarea className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" rows={3} value={form.scope} onChange={e => setForm({...form, scope: e.target.value})} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Timeline</label>
                <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.timeline} onChange={e => setForm({...form, timeline: e.target.value})} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Payment Terms</label>
                <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.payment_terms} onChange={e => setForm({...form, payment_terms: e.target.value})} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Status</label>
                <select className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="signed">Signed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                <button type="button" className="px-4 py-2 border border-navy-600 rounded-vsparkz text-text-muted hover:text-text-primary" onClick={() => { setShowModal(false); setEditing(null); setForm({ client_id: '', project_id: '', title: '', scope: '', timeline: '', payment_terms: '', status: 'draft' }); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-text-primary mb-4">Agreement Details</h2>
            <div className="space-y-3 text-sm">
              <div><span className="font-medium text-text-muted">Client:</span> <span className="text-text-primary">{getClientName(detail.client_id)}</span></div>
              <div><span className="font-medium text-text-muted">Project:</span> <span className="text-text-primary">{getProjectName(detail.project_id) || '—'}</span></div>
              <div><span className="font-medium text-text-muted">Title:</span> <span className="text-text-primary">{detail.title}</span></div>
              <div><span className="font-medium text-text-muted">Scope:</span> <span className="text-text-primary whitespace-pre-wrap">{detail.scope || '—'}</span></div>
              <div><span className="font-medium text-text-muted">Timeline:</span> <span className="text-text-primary">{detail.timeline || '—'}</span></div>
              <div><span className="font-medium text-text-muted">Payment Terms:</span> <span className="text-text-primary">{detail.payment_terms || '—'}</span></div>
              <div><span className="font-medium text-text-muted">Status:</span> <span className="text-text-primary">{detail.status}</span></div>
              <div><span className="font-medium text-text-muted">Created:</span> <span className="text-text-primary">{detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'}</span></div>
            </div>
            <div className="mt-6 flex gap-2">
              <button type="button" className="btn-primary flex-1" onClick={() => handleDownloadPdf(detail.id)}>Download PDF</button>
              <button className="px-4 py-2 border border-navy-600 rounded-vsparkz text-text-muted hover:text-text-primary" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
