import { useState, useEffect } from 'react';
import api from '../lib/api';

function SocialPlanner() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ from_date: '', to_date: '', project_id: '', campaign_id: '' });
  const [modal, setModal] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    project_id: '',
    campaign_id: '',
    scheduled_date: '',
    content_type: '',
    title: '',
    raw_content: '',
    status: 'draft',
    influencer_id: '',
  });

  const fetchItems = () => {
    setLoading(true);
    const params = { paginate: false };
    if (filters.from_date) params.from_date = filters.from_date;
    if (filters.to_date) params.to_date = filters.to_date;
    if (filters.project_id) params.project_id = filters.project_id;
    if (filters.campaign_id) params.campaign_id = filters.campaign_id;
    api
      .get('/admin/content-calendar', { params })
      .then((r) => {
        const raw = r.data;
        const list = Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data) ? raw.data : []);
        setItems(list);
      })
      .catch(() => {
        setItems([]);
        setError('Failed to load content calendar.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, [filters.from_date, filters.to_date, filters.project_id, filters.campaign_id]);

  useEffect(() => {
    api.get('/admin/projects', { params: { per_page: 200 } }).then((r) => {
      const d = r.data?.data ?? r.data ?? [];
      setProjects(Array.isArray(d) ? d : []);
    }).catch(() => setProjects([]));
    api.get('/admin/campaigns', { params: { per_page: 200 } }).then((r) => {
      const d = r.data?.data ?? r.data ?? [];
      setCampaigns(Array.isArray(d) ? d : []);
    }).catch(() => setCampaigns([]));
    api.get('/admin/influencers', { params: { per_page: 200 } }).then((r) => {
      const d = r.data?.data ?? r.data ?? [];
      setInfluencers(Array.isArray(d) ? d : []);
    }).catch(() => setInfluencers([]));
  }, []);

  const openAdd = () => {
    setModal('add');
    setEditingItem(null);
    const today = new Date().toISOString().slice(0, 10);
    setForm({
      project_id: '',
      campaign_id: '',
      scheduled_date: today,
      content_type: 'post',
      title: '',
      raw_content: '',
      status: 'draft',
      influencer_id: '',
    });
    setError(null);
  };

  const openEdit = (item) => {
    setModal('edit');
    setEditingItem(item);
    setForm({
      project_id: item.project_id ?? '',
      campaign_id: item.campaign_id ?? '',
      scheduled_date: item.scheduled_date ? item.scheduled_date.slice(0, 10) : '',
      content_type: item.content_type ?? 'post',
      title: item.title ?? '',
      raw_content: item.raw_content ?? '',
      status: item.status ?? 'draft',
      influencer_id: item.influencer_id ?? '',
    });
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      project_id: form.project_id ? Number(form.project_id) : null,
      campaign_id: form.campaign_id ? Number(form.campaign_id) : null,
      scheduled_date: form.scheduled_date || null,
      content_type: form.content_type || null,
      title: form.title || null,
      raw_content: form.raw_content || null,
      status: form.status || 'draft',
      influencer_id: form.influencer_id ? Number(form.influencer_id) : null,
    };
    try {
      if (modal === 'add') {
        await api.post('/admin/content-calendar', payload);
      } else {
        await api.put(`/admin/content-calendar/${editingItem.id}`, payload);
      }
      fetchItems();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this calendar item?')) return;
    setError(null);
    try {
      await api.delete(`/admin/content-calendar/${id}`);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Social Planner</h1>
          <p className="text-text-muted text-sm mt-1">Content calendar and scheduled posts.</p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary px-4 py-2 text-sm">
          + Add item
        </button>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="date"
          value={filters.from_date}
          onChange={(e) => setFilters((f) => ({ ...f, from_date: e.target.value }))}
          className="px-3 py-2 border dark:border-navy-600 dark:bg-navy-800 rounded text-sm"
        />
        <input
          type="date"
          value={filters.to_date}
          onChange={(e) => setFilters((f) => ({ ...f, to_date: e.target.value }))}
          className="px-3 py-2 border dark:border-navy-600 dark:bg-navy-800 rounded text-sm"
        />
        <select
          value={filters.project_id}
          onChange={(e) => setFilters((f) => ({ ...f, project_id: e.target.value }))}
          className="px-3 py-2 border dark:border-navy-600 dark:bg-navy-800 rounded text-sm"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={filters.campaign_id}
          onChange={(e) => setFilters((f) => ({ ...f, campaign_id: e.target.value }))}
          className="px-3 py-2 border dark:border-navy-600 dark:bg-navy-800 rounded text-sm"
        >
          <option value="">All campaigns</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name ?? c.title}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="dark:bg-navy-800/50 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Title</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Scheduled</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Type</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-navy-700">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                    No scheduled content yet. Add items to the content calendar.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="dark:hover:bg-navy-800/50">
                    <td className="px-4 py-3 font-medium">{item.title || (item.raw_content?.slice(0, 40) + (item.raw_content?.length > 40 ? '…' : '')) || '—'}</td>
                    <td className="px-4 py-3">{(item.scheduled_date || item.scheduled_at) ? new Date(item.scheduled_date || item.scheduled_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">{item.content_type ?? '—'}</td>
                    <td className="px-4 py-3">{item.status ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => openEdit(item)} className="text-accent hover:underline text-sm mr-2">Edit</button>
                      <button type="button" onClick={() => handleDelete(item.id)} className="text-red-500 hover:underline text-sm">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
          <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-primary mb-4">{modal === 'add' ? 'Add calendar item' : 'Edit calendar item'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Project</label>
                  <select
                    value={form.project_id}
                    onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
                    className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                  >
                    <option value="">—</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Campaign</label>
                  <select
                    value={form.campaign_id}
                    onChange={(e) => setForm((f) => ({ ...f, campaign_id: e.target.value }))}
                    className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                  >
                    <option value="">—</option>
                    {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.title}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Scheduled date *</label>
                <input
                  type="date"
                  value={form.scheduled_date}
                  onChange={(e) => setForm((f) => ({ ...f, scheduled_date: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Content type</label>
                <select
                  value={form.content_type}
                  onChange={(e) => setForm((f) => ({ ...f, content_type: e.target.value }))}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                >
                  <option value="post">Post</option>
                  <option value="story">Story</option>
                  <option value="reel">Reel</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Content</label>
                <textarea
                  value={form.raw_content}
                  onChange={(e) => setForm((f) => ({ ...f, raw_content: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Influencer</label>
                <select
                  value={form.influencer_id}
                  onChange={(e) => setForm((f) => ({ ...f, influencer_id: e.target.value }))}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                >
                  <option value="">—</option>
                  {influencers.map((i) => <option key={i.id} value={i.id}>{i.name ?? i.username}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm">{saving ? 'Saving…' : 'Save'}</button>
                <button type="button" onClick={closeModal} className="px-4 py-2 border dark:border-navy-600 rounded text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialPlanner;
export { SocialPlanner };
