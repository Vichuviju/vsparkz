import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function SeoWorkspace() {
  const [keywords, setKeywords] = useState([]);
  const [clients, setClients] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    keyword: '',
    target_url: '',
    priority: '',
    status: 'active',
    client_id: '',
    campaign_id: '',
  });

  const fetchKeywords = () => {
    setLoading(true);
    api
      .get('/admin/keywords')
      .then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setKeywords(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        setKeywords([]);
        setError('Failed to load keywords.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchKeywords();
  }, []);

  useEffect(() => {
    api.get('/admin/clients', { params: { per_page: 500 } }).then((r) => {
      const d = r.data?.data ?? r.data ?? [];
      setClients(Array.isArray(d) ? d : []);
    }).catch(() => setClients([]));
    api.get('/admin/campaigns', { params: { per_page: 500 } }).then((r) => {
      const d = r.data?.data ?? r.data ?? [];
      setCampaigns(Array.isArray(d) ? d : []);
    }).catch(() => setCampaigns([]));
  }, []);

  const openAdd = () => {
    setModal('form');
    setEditingKeyword(null);
    setForm({
      keyword: '',
      target_url: '',
      priority: '',
      status: 'active',
      client_id: '',
      campaign_id: '',
    });
    setError(null);
  };

  const openEdit = (k) => {
    setModal('form');
    setEditingKeyword(k);
    setForm({
      keyword: k.keyword ?? '',
      target_url: k.target_url ?? '',
      priority: k.priority ?? '',
      status: k.status ?? 'active',
      client_id: k.client_id ?? '',
      campaign_id: k.campaign_id ?? '',
    });
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditingKeyword(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      keyword: form.keyword.trim(),
      target_url: form.target_url.trim() || null,
      priority: form.priority ? Number(form.priority) : null,
      status: form.status || null,
      client_id: form.client_id ? Number(form.client_id) : null,
      campaign_id: form.campaign_id ? Number(form.campaign_id) : null,
    };
    try {
      if (editingKeyword) {
        await api.put(`/admin/keywords/${editingKeyword.id}`, payload);
      } else {
        await api.post('/admin/keywords', payload);
      }
      fetchKeywords();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save keyword.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    setError(null);
    try {
      await api.delete(`/admin/keywords/${id}`);
      fetchKeywords();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete keyword.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">SEO Workspace</h1>
          <p className="text-text-muted">Keywords, rankings, competitors, site audits, backlinks.</p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">
          Add keyword
        </button>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="dark:bg-navy-800/50 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Keyword</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Target URL</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-navy-700">
              {keywords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                    No keywords yet. Add keywords to track rankings.
                  </td>
                </tr>
              ) : (
                keywords.map((k) => (
                  <tr key={k.id} className="dark:hover:bg-navy-800/50">
                    <td className="px-4 py-3 font-medium">{k.keyword ?? '—'}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{k.target_url ?? '—'}</td>
                    <td className="px-4 py-3">{k.status ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => openEdit(k)} className="text-primary-500 hover:underline text-sm mr-2">Edit</button>
                      <button type="button" onClick={() => setDeleteConfirm(k)} className="text-red-500 hover:underline text-sm">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'form' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-primary mb-4">{editingKeyword ? 'Edit keyword' : 'Add keyword'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Keyword *</label>
                <input type="text" value={form.keyword} onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))} className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Target URL</label>
                <input type="text" value={form.target_url} onChange={(e) => setForm((f) => ({ ...f, target_url: e.target.value }))} className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Client</label>
                <select value={form.client_id} onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary">
                  <option value="">— None —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name ?? c.company_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Campaign</label>
                <select value={form.campaign_id} onChange={(e) => setForm((f) => ({ ...f, campaign_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary">
                  <option value="">— None —</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
                <input type="text" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary" placeholder="e.g. active" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 rounded-lg text-sm">{saving ? 'Saving...' : (editingKeyword ? 'Update' : 'Create')}</button>
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg border dark:border-navy-600 text-text-primary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-text-primary mb-4">Delete keyword &quot;{deleteConfirm.keyword}&quot;? This cannot be undone.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleDelete(deleteConfirm.id)} disabled={saving} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50">Delete</button>
              <button type="button" onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border dark:border-navy-600 text-text-primary text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SeoWorkspace;
export { SeoWorkspace };
