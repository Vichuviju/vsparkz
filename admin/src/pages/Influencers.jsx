import { useEffect, useState } from 'react';
import api from '../lib/api';

export function Influencers() {
  const [list, setList] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    name: '', platform: '', followers: '', engagement_rate: '', language: '', location: '', category: '', email: '', phone: '', status: 'new',
  });
  const [saving, setSaving] = useState(false);

  const fetchList = (page = 1) => {
    setLoading(true);
    const params = { page, per_page: 15 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    api.get('/admin/influencers', { params }).then(({ data }) => {
      setList(data.data ?? data);
      setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total });
    }).catch((err) => setError(err.response?.data?.message || 'Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, [statusFilter]);

  const openCreate = () => {
    setModal('new');
    setForm({ name: '', platform: '', followers: '', engagement_rate: '', language: '', location: '', category: '', email: '', phone: '', status: 'new' });
  };
  const openEdit = (row) => {
    setModal(row.id);
    setForm({
      name: row.name ?? '',
      platform: row.platform ?? '',
      followers: row.followers ?? '',
      engagement_rate: row.engagement_rate ?? '',
      language: row.language ?? '',
      location: row.location ?? '',
      category: row.category ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
      status: row.status ?? 'new',
    });
  };
  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, followers: form.followers ? parseInt(form.followers, 10) : null, engagement_rate: form.engagement_rate ? parseFloat(form.engagement_rate) : null };
    try {
      if (modal === 'new') {
        await api.post('/admin/influencers', payload);
      } else {
        await api.put(`/admin/influencers/${modal}`, payload);
      }
      fetchList();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this influencer?')) return;
    try {
      await api.delete(`/admin/influencers/${id}`);
      fetchList();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Influencers</h1>
        <button type="button" onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">Add influencer</button>
      </div>
      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
      <div className="flex flex-wrap gap-4 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); fetchList(1); }} className="flex gap-2 flex-1 min-w-[200px]">
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Search</button>
        </form>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="assigned">Assigned</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-slate-500">Loading…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-5 py-3 text-slate-600 font-medium">Name</th>
                  <th className="px-5 py-3 text-slate-600 font-medium">Platform</th>
                  <th className="px-5 py-3 text-slate-600 font-medium">Followers</th>
                  <th className="px-5 py-3 text-slate-600 font-medium">Eng. rate</th>
                  <th className="px-5 py-3 text-slate-600 font-medium">Status</th>
                  <th className="px-5 py-3 text-slate-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-slate-500 text-center">No influencers yet</td></tr>
                ) : list.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-800">{row.name}</td>
                    <td className="px-5 py-3 text-slate-600">{row.platform ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{row.followers != null ? Number(row.followers).toLocaleString() : '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{row.engagement_rate != null ? `${row.engagement_rate}%` : '—'}</td>
                    <td className="px-5 py-3"><span className="inline-flex px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-800">{row.status ?? 'new'}</span></td>
                    <td className="px-5 py-3">
                      <button type="button" onClick={() => openEdit(row)} className="text-indigo-600 hover:underline mr-2">Edit</button>
                      <button type="button" onClick={() => handleDelete(row.id)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta.last_page > 1 && (
          <div className="px-5 py-3 border-t border-slate-200 flex justify-between items-center text-sm text-slate-600">
            <span>Page {meta.current_page} of {meta.last_page} ({meta.total} total)</span>
            <div className="flex gap-2">
              <button type="button" disabled={meta.current_page <= 1} onClick={() => fetchList(meta.current_page - 1)} className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50">Previous</button>
              <button type="button" disabled={meta.current_page >= meta.last_page} onClick={() => fetchList(meta.current_page + 1)} className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 my-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">{modal === 'new' ? 'Add influencer' : 'Edit influencer'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Name *</label><input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Platform</label><input type="text" value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Followers</label><input type="number" min={0} value={form.followers} onChange={(e) => setForm((f) => ({ ...f, followers: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Engagement rate %</label><input type="number" min={0} max={100} step={0.01} value={form.engagement_rate} onChange={(e) => setForm((f) => ({ ...f, engagement_rate: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg"><option value="new">New</option><option value="shortlisted">Shortlisted</option><option value="assigned">Assigned</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Language</label><input type="text" value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Location</label><input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Category / Niche</label><input type="text" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Save</button>
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
