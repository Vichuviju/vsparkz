import { useEffect, useState } from 'react';
import api from '../lib/api';

export function StrategyReports() {
  const [list, setList] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ client_id: '', project_id: '', title: '', status: 'draft', estimated_budget: 0, content: '' });

  useEffect(() => {
    Promise.all([
      api.get('/admin/clients').then(r => setClients(r.data?.data ?? r.data ?? [])),
      api.get('/admin/projects').then(r => setProjects(r.data?.data ?? r.data ?? [])),
      api.get('/admin/strategy-reports')
        .then(r => setList(r.data?.data ?? r.data ?? []))
        .catch(err => setError(err.response?.data?.message || 'Failed'))
    ]).finally(() => setLoading(false));
  }, []);

  const getClientName = (id) => clients.find(c => c.id === id)?.company_name ?? id;
  const getProjectName = (id) => projects.find(p => p.id === id)?.name ?? id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/strategy-reports/${editing.id}`, form);
      } else {
        await api.post('/admin/strategy-reports', form);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ client_id: '', project_id: '', title: '', status: 'draft', estimated_budget: 0, content: '' });
      const { data } = await api.get('/admin/strategy-reports');
      setList(data?.data ?? data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({ client_id: row.client_id, project_id: row.project_id, title: row.title || '', status: row.status || 'draft', estimated_budget: row.estimated_budget || 0, content: row.content || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this strategy report?')) return;
    try {
      await api.delete(`/admin/strategy-reports/${id}`);
      setList(list.filter((it) => it.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleView = (row) => {
    setDetail(row);
    setShowDetailModal(true);
  };

  const handleSend = async (id) => {
    try {
      await api.post(`/admin/strategy-reports/${id}/send`);
      const { data } = await api.get('/admin/strategy-reports');
      setList(data?.data ?? data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/strategy-reports/${id}/approve`);
      const { data } = await api.get('/admin/strategy-reports');
      setList(data?.data ?? data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handlePdf = async (id) => {
    try {
      const response = await api.get(`/admin/strategy-reports/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `strategy-report-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('PDF download error:', err);
      setError('Failed to download PDF. Try opening in a new tab.');
      window.open(`/admin/strategy-reports/${id}/pdf`, '_blank');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">Strategy Reports</h1>
        <button className="btn-primary px-4 py-2" onClick={() => setShowModal(true)}>Add Report</button>
      </div>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 dark:text-accent-bright text-cyan-800 text-sm">{error}</div>}
      {loading ? <div className="p-8 text-center dark:text-text-muted text-gray-500">Loading…</div> : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="dark:bg-navy-800/50 bg-gray-50 text-left">
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Client</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Project</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Title</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Status</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Budget</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={6} className="px-5 py-8 dark:text-text-muted text-gray-500 text-center">No strategy reports yet.</td></tr> : list.map((row) => (
                <tr key={row.id} className="border-t dark:border-navy-600 border-gray-100 dark:hover:bg-navy-700/30 hover:bg-gray-50">
                  <td className="px-5 py-3 dark:text-text-primary text-gray-900">{getClientName(row.client_id)}</td>
                  <td className="px-5 py-3 dark:text-text-muted text-gray-500">{getProjectName(row.project_id) || '—'}</td>
                  <td className="px-5 py-3 dark:text-text-primary text-gray-900">{row.title || '—'}</td>
                  <td className="px-5 py-3 dark:text-text-muted text-gray-500">{row.status}</td>
                  <td className="px-5 py-3 dark:text-text-muted text-gray-500">₹{row.estimated_budget || 0}</td>
                  <td className="px-5 py-3">
                    <button className="text-accent hover:text-accent-bright mr-1" onClick={() => handleView(row)}>View</button>
                    <button className="text-accent hover:text-accent-bright mr-1" onClick={() => handleEdit(row)}>Edit</button>
                    <button className="text-accent-muted hover:text-accent-bright mr-1" onClick={() => handleDelete(row.id)}>Delete</button>
                    {row.status === 'draft' && <button className="text-accent hover:text-accent-bright mr-1" onClick={() => handleSend(row.id)}>Send</button>}
                    {row.status === 'sent' && <button className="text-accent hover:text-accent-bright mr-1" onClick={() => handleApprove(row.id)}>Approve</button>}
                    <button className="text-accent hover:text-accent-bright" onClick={() => handlePdf(row.id)}>PDF</button>
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
            <h2 className="text-xl font-bold dark:text-text-primary text-gray-900 mb-4">{editing ? 'Edit' : 'Add'} Strategy Report</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Client</label>
                <select className="w-full px-3 py-2 dark:bg-navy-800/80 bg-white border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} required>
                  <option value="">Select Client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Project</label>
                <select className="w-full px-3 py-2 dark:bg-navy-800/80 bg-white border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900" value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})}>
                  <option value="">Select Project (optional)</option>
                  {projects.filter(p => !form.client_id || p.client_id == form.client_id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Title</label>
                <input className="w-full px-3 py-2 dark:bg-navy-800/80 bg-white border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Status</label>
                <select className="w-full px-3 py-2 dark:bg-navy-800/80 bg-white border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Estimated Budget</label>
                <input type="number" className="w-full px-3 py-2 dark:bg-navy-800/80 bg-white border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900" value={form.estimated_budget} onChange={e => setForm({...form, estimated_budget: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Content</label>
                <textarea className="w-full px-3 py-2 dark:bg-navy-800/80 bg-white border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900" rows={4} value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                <button type="button" className="px-4 py-2 border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-muted text-gray-500 dark:hover:text-text-primary hover:text-gray-900" onClick={() => { setShowModal(false); setEditing(null); setForm({ client_id: '', project_id: '', title: '', status: 'draft', estimated_budget: 0, content: '' }); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold dark:text-text-primary text-gray-900 mb-4">Strategy Report Details</h2>
            <div className="space-y-3 text-sm">
              <div><span className="font-medium dark:text-text-muted text-gray-500">Client:</span> <span className="dark:text-text-primary text-gray-900">{getClientName(detail.client_id)}</span></div>
              <div><span className="font-medium dark:text-text-muted text-gray-500">Project:</span> <span className="dark:text-text-primary text-gray-900">{getProjectName(detail.project_id) || '—'}</span></div>
              <div><span className="font-medium dark:text-text-muted text-gray-500">Title:</span> <span className="dark:text-text-primary text-gray-900">{detail.title || '—'}</span></div>
              <div><span className="font-medium dark:text-text-muted text-gray-500">Status:</span> <span className="dark:text-text-primary text-gray-900">{detail.status}</span></div>
              <div><span className="font-medium dark:text-text-muted text-gray-500">Estimated Budget:</span> <span className="dark:text-text-primary text-gray-900">₹{detail.estimated_budget || 0}</span></div>
              <div><span className="font-medium dark:text-text-muted text-gray-500">Content:</span> <span className="dark:text-text-primary text-gray-900 whitespace-pre-wrap">{detail.content || '—'}</span></div>
              <div><span className="font-medium dark:text-text-muted text-gray-500">Created:</span> <span className="dark:text-text-primary text-gray-900">{detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'}</span></div>
            </div>
            <div className="mt-6">
              <button className="btn-primary w-full" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
