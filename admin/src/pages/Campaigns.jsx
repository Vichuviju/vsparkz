import { useEffect, useState } from 'react';
import api from '../lib/api';

const statusColors = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  paused: 'bg-amber-100 text-amber-800',
};

export function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    client_id: '',
    project_id: '',
    client: '',
    influencer_name: '',
    platform: '',
    influencer_reach: '',
    engagement_rate: '',
    result_summary: '',
    start_date: '',
    end_date: '',
    status: 'active',
  });
  const [saving, setSaving] = useState(false);

  const fetchCampaigns = (page = 1) => {
    setLoading(true);
    const params = { page, per_page: 15 };
    if (statusFilter) params.status = statusFilter;
    api
      .get('/admin/campaigns', { params })
      .then(({ data }) => {
        setCampaigns(data.data ?? data);
        setMeta({
          current_page: data.current_page,
          last_page: data.last_page,
          total: data.total,
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load campaigns'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCampaigns(); }, [statusFilter]);
  useEffect(() => {
    api.get('/admin/clients', { params: { per_page: 200 } }).then(({ data }) => setClients(data.data ?? data ?? [])).catch(() => setClients([]));
    api.get('/admin/projects', { params: { per_page: 200 } }).then(({ data }) => setProjects(data.data ?? data ?? [])).catch(() => setProjects([]));
  }, []);

  const openCreate = () => {
    setEditing('new');
    setForm({ name: '', client_id: '', project_id: '', client: '', influencer_name: '', platform: '', influencer_reach: '', engagement_rate: '', result_summary: '', start_date: '', end_date: '', status: 'active' });
  };

  const openEdit = (c) => {
    setEditing(c.id);
    setForm({
      name: c.name,
      client_id: c.client_id ?? '',
      project_id: c.project_id ?? '',
      client: c.client ?? '',
      influencer_name: c.influencer_name ?? '',
      platform: c.platform ?? '',
      influencer_reach: c.influencer_reach ?? '',
      engagement_rate: c.engagement_rate ?? '',
      result_summary: c.result_summary ?? '',
      start_date: c.start_date ? c.start_date.slice(0, 10) : '',
      end_date: c.end_date ? c.end_date.slice(0, 10) : '',
      status: c.status ?? 'active',
    });
  };

  const closeForm = () => setEditing(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    payload.client_id = payload.client_id ? parseInt(payload.client_id, 10) : null;
    payload.project_id = payload.project_id ? parseInt(payload.project_id, 10) : null;
    if (payload.influencer_reach === '') payload.influencer_reach = null;
    if (payload.engagement_rate === '') payload.engagement_rate = null;
    if (payload.start_date === '') payload.start_date = null;
    if (payload.end_date === '') payload.end_date = null;
    try {
      if (editing === 'new') {
        await api.post('/admin/campaigns', payload);
      } else {
        await api.put(`/admin/campaigns/${editing}`, payload);
      }
      fetchCampaigns();
      closeForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this campaign?')) return;
    try {
      await api.delete(`/admin/campaigns/${id}`);
      fetchCampaigns();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Influencer Campaigns</h1>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
          >
            Add Campaign
          </button>
        </div>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-5 py-3 text-slate-600 font-medium">Name</th>
                  <th className="px-5 py-3 text-slate-600 font-medium">Client</th>
                  <th className="px-5 py-3 text-slate-600 font-medium">Influencer</th>
                  <th className="px-5 py-3 text-slate-600 font-medium">Reach</th>
                  <th className="px-5 py-3 text-slate-600 font-medium">Engagement</th>
                  <th className="px-5 py-3 text-slate-600 font-medium">Status</th>
                  <th className="px-5 py-3 text-slate-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-slate-500 text-center">
                      No campaigns yet. Add one above.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-800 font-medium">{c.name}</td>
                      <td className="px-5 py-3 text-slate-600">{c.client_relation?.company_name ?? c.client ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-600">{c.influencer_name ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {c.influencer_reach != null ? c.influencer_reach.toLocaleString() : '—'}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {c.engagement_rate != null ? `${c.engagement_rate}%` : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs ${statusColors[c.status] ?? 'bg-slate-100 text-slate-800'}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="text-indigo-600 hover:underline mr-3"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {meta.last_page > 1 && (
            <div className="px-5 py-3 border-t border-slate-200 flex justify-between items-center text-sm text-slate-600">
              <span>
                Page {meta.current_page} of {meta.last_page} ({meta.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={meta.current_page <= 1}
                  onClick={() => fetchCampaigns(meta.current_page - 1)}
                  className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => fetchCampaigns(meta.current_page + 1)}
                  className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              {editing === 'new' ? 'Add Campaign' : 'Edit Campaign'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Campaign name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Client</label>
                  <select value={form.client_id} onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option value="">— Select client —</option>
                    {clients.map((cl) => (
                      <option key={cl.id} value={cl.id}>{cl.company_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Project</label>
                  <select value={form.project_id} onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option value="">— Select project —</option>
                    {projects.map((pr) => (
                      <option key={pr.id} value={pr.id}>{pr.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Client (legacy text)</label>
                  <input
                    type="text"
                    value={form.client}
                    onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Influencer name</label>
                  <input
                    type="text"
                    value={form.influencer_name}
                    onChange={(e) => setForm((f) => ({ ...f, influencer_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Platform</label>
                  <input
                    type="text"
                    value={form.platform}
                    onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                    placeholder="Instagram, YouTube..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Influencer reach</label>
                  <input
                    type="number"
                    min={0}
                    value={form.influencer_reach}
                    onChange={(e) => setForm((f) => ({ ...f, influencer_reach: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Engagement rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.engagement_rate}
                  onChange={(e) => setForm((f) => ({ ...f, engagement_rate: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Result summary</label>
                <textarea
                  value={form.result_summary}
                  onChange={(e) => setForm((f) => ({ ...f, result_summary: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Start date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">End date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
