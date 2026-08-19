import { useEffect, useState } from 'react';
import api from '../lib/api';

const AVATAR_COLORS = [
  'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
];

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
  completed: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
  paused: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
};

export function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
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
    const params = { page, per_page: 10 };
    if (statusFilter) params.status = statusFilter;
    
    api.get('/admin/campaigns', { params })
      .then(({ data }) => {
        const rawData = data.data ?? data;
        setCampaigns(Array.isArray(rawData) ? rawData : []);
        setMeta({
          current_page: data.current_page ?? 1,
          last_page: data.last_page ?? 1,
          total: data.total ?? rawData.length,
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
    setForm({ 
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
      status: 'active' 
    });
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
      fetchCampaigns(meta.current_page);
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
      fetchCampaigns(meta.current_page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm font-medium text-slate-400 dark:text-slate-500">
            Monitor and manage your influencer outreach and social campaign stats.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>

          <button 
            type="button" 
            onClick={openCreate} 
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/10 transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Campaign
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 font-semibold text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500/30 border-t-blue-500 mx-auto mb-4" />
            Loading campaigns database…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-left text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Campaign Name</th>
                  <th className="px-6 py-4">Client / Project</th>
                  <th className="px-6 py-4">Influencer Details</th>
                  <th className="px-6 py-4">Target Reach</th>
                  <th className="px-6 py-4">Engagement Rate</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-slate-400 text-center font-bold">No campaigns found</td>
                  </tr>
                ) : (
                  campaigns.map((row, index) => {
                    const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                    const initial = row.name ? row.name.charAt(0).toUpperCase() : 'C';
                    
                    return (
                      <tr 
                        key={row.id} 
                        className="border-t border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        {/* Campaign Name with Initial Avatar */}
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${avatarColor}`}>
                              {initial}
                            </div>
                            <div>
                              <div className="text-slate-800 dark:text-white text-xs font-extrabold">{row.name}</div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Influencer Campaign</div>
                            </div>
                          </div>
                        </td>

                        {/* Client / Project Double Deck */}
                        <td className="px-6 py-4">
                          <div className="text-slate-800 dark:text-white font-bold">
                            {row.client_relation?.company_name ?? row.client ?? '—'}
                          </div>
                          {row.project_relation && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                              Project: {row.project_relation.name}
                            </div>
                          )}
                        </td>

                        {/* Influencer Name & Platform */}
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold">
                          <div className="text-slate-800 dark:text-white font-bold">{row.influencer_name ?? '—'}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{row.platform ?? 'General'}</div>
                        </td>

                        {/* Reach */}
                        <td className="px-6 py-4 text-slate-800 dark:text-white font-bold">
                          {row.influencer_reach != null ? row.influencer_reach.toLocaleString() : '—'}
                        </td>

                        {/* Engagement Rate Pill */}
                        <td className="px-6 py-4">
                          {row.engagement_rate != null ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                              {row.engagement_rate}% ER
                            </span>
                          ) : '—'}
                        </td>

                        {/* Status badge pill */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                            STATUS_STYLES[row.status] || 'bg-slate-100 text-slate-800'
                          }`}>
                            {row.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button 
                              type="button" 
                              onClick={() => openEdit(row)} 
                              className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                              title="Edit Campaign"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                              </svg>
                            </button>

                            <button 
                              type="button" 
                              onClick={() => handleDelete(row.id)} 
                              className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                              title="Delete Campaign"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && meta.last_page > 1 && (
          <div className="px-6 py-4.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900/60">
            <span>
              Showing {((meta.current_page - 1) * 10) + 1} to {Math.min(meta.current_page * 10, meta.total)} of {meta.total} results
            </span>
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                disabled={meta.current_page <= 1} 
                onClick={() => fetchCampaigns(meta.current_page - 1)} 
                className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              
              {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => fetchCampaigns(pageNum)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-colors ${
                    meta.current_page === pageNum
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button 
                type="button" 
                disabled={meta.current_page >= meta.last_page} 
                onClick={() => fetchCampaigns(meta.current_page + 1)} 
                className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 cursor-pointer">
              <span className="text-[10px]">10 / page</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Form Overlay Modal */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto z-[9999] bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-card max-w-2xl w-full p-6 my-8 border border-slate-100 dark:border-slate-800 shadow-2xl animate-fade-in max-h-[min(92dvh,44rem)] overflow-y-auto mx-3 sm:mx-auto">
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mb-4">
              {editing === 'new' ? 'Add Campaign' : 'Edit Campaign'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Campaign Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Client</label>
                  <select 
                    value={form.client_id} 
                    onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))} 
                    className="w-full px-4 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none cursor-pointer"
                  >
                    <option value="">— Select client —</option>
                    {clients.map((cl) => (
                      <option key={cl.id} value={cl.id}>{cl.company_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Project</label>
                  <select 
                    value={form.project_id} 
                    onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))} 
                    className="w-full px-4 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none cursor-pointer"
                  >
                    <option value="">— Select project —</option>
                    {projects.map((pr) => (
                      <option key={pr.id} value={pr.id}>{pr.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Client (legacy text)</label>
                  <input
                    type="text"
                    value={form.client}
                    onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Influencer Name</label>
                  <input
                    type="text"
                    value={form.influencer_name}
                    onChange={(e) => setForm((f) => ({ ...f, influencer_name: e.target.value }))}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Platform</label>
                  <input
                    type="text"
                    value={form.platform}
                    onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                    placeholder="Instagram, YouTube..."
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Influencer Reach</label>
                  <input
                    type="number"
                    min={0}
                    value={form.influencer_reach}
                    onChange={(e) => setForm((f) => ({ ...f, influencer_reach: e.target.value }))}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Engagement Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.engagement_rate}
                  onChange={(e) => setForm((f) => ({ ...f, engagement_rate: e.target.value }))}
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Result Summary</label>
                <textarea
                  value={form.result_summary}
                  onChange={(e) => setForm((f) => ({ ...f, result_summary: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-4 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-4 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-4 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-2.5 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
