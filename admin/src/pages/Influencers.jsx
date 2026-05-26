import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export function Influencers() {
  const [list, setList] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    name: '', profile_image: '', platform: '', followers: '', youtube_followers: '', instagram_followers: '', engagement_rate: '',
    language: '', location: '', category: '', content_category_id: '', email: '', phone: '', status: 'new',
    work_status: '', growth_status: '', male_percentage: '', female_percentage: '', peak_time: '',
    assigned_team_member_id: '', reporting_manager_id: '', enrolled_at: '', pricing_per_post: '', pricing_per_reel: '', pricing_per_story: '',
  });
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [team, setTeam] = useState([]);

  const fetchList = (page = 1) => {
    setLoading(true);
    const params = { page, per_page: 15 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (categoryFilter) params.content_category_id = categoryFilter;
    api.get('/admin/influencers', { params }).then(({ data }) => {
      setList(data.data ?? data);
      setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total });
    }).catch((err) => setError(err.response?.data?.message || 'Failed to load')).finally(() => setLoading(false));
  };

  const fetchData = async () => {
    try {
      const [catRes, teamRes] = await Promise.all([
        api.get('/admin/influencer-categories'),
        api.get('/admin/team', { params: { per_page: 100 } }),
      ]);
      setCategories(catRes.data);
      setTeam(teamRes.data.data ?? teamRes.data);
    } catch (err) {
      console.error('Failed to load metadata', err);
    }
  };

  useEffect(() => {
    fetchList();
    fetchData();
  }, [statusFilter, categoryFilter]);

  const openCreate = () => {
    setModal('new');
    setForm({
      name: '', profile_image: '', platform: '', followers: '', youtube_followers: '', instagram_followers: '', engagement_rate: '',
      language: '', location: '', category: '', content_category_id: '', email: '', phone: '', status: 'new',
      work_status: 'need to contact', growth_status: 'growing', male_percentage: '', female_percentage: '', peak_time: '',
      assigned_team_member_id: '', reporting_manager_id: '', enrolled_at: new Date().toISOString().split('T')[0],
      pricing_per_post: '', pricing_per_reel: '', pricing_per_story: '',
    });
  };
  const openEdit = (row) => {
    setModal(row.id);
    setForm({
      name: row.name ?? '',
      profile_image: row.profile_image ?? '',
      platform: row.platform ?? '',
      followers: row.followers ?? '',
      youtube_followers: row.youtube_followers ?? '',
      instagram_followers: row.instagram_followers ?? '',
      engagement_rate: row.engagement_rate ?? '',
      language: row.language ?? '',
      location: row.location ?? '',
      category: row.category ?? '',
      content_category_id: row.content_category_id ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
      status: row.status ?? 'new',
      work_status: row.work_status ?? '',
      growth_status: row.growth_status ?? '',
      male_percentage: row.male_percentage ?? '',
      female_percentage: row.female_percentage ?? '',
      peak_time: row.peak_time ?? '',
      assigned_team_member_id: row.assigned_team_member_id ?? '',
      reporting_manager_id: row.reporting_manager_id ?? '',
      enrolled_at: row.enrolled_at ?? '',
      pricing_per_post: row.pricing_per_post ?? '',
      pricing_per_reel: row.pricing_per_reel ?? '',
      pricing_per_story: row.pricing_per_story ?? '',
    });
  };
  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      followers: form.followers ? parseInt(form.followers, 10) : null,
      youtube_followers: form.youtube_followers ? parseInt(form.youtube_followers, 10) : null,
      instagram_followers: form.instagram_followers ? parseInt(form.instagram_followers, 10) : null,
      engagement_rate: form.engagement_rate ? parseFloat(form.engagement_rate) : null,
      male_percentage: form.male_percentage ? parseFloat(form.male_percentage) : null,
      female_percentage: form.female_percentage ? parseFloat(form.female_percentage) : null,
    };
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
        <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">Influencers</h1>
        <div className="flex gap-2">
          <Link to="/admin/influencer-categories" className="px-4 py-2 border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900 text-sm hover:bg-navy-700/30">Manage Categories</Link>
          <button type="button" onClick={openCreate} className="btn-primary px-4 py-2 text-sm">Add influencer</button>
        </div>
      </div>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}
      <div className="flex flex-wrap gap-4 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); fetchList(1); }} className="flex gap-2 flex-1 min-w-[200px]">
          <input type="text" placeholder="Search name, email, location..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 text-sm focus:border-accent" />
          <button type="submit" className="btn-primary px-4 py-2 text-sm">Search</button>
        </form>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 text-sm">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 text-sm">
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="assigned">Assigned</option>
        </select>
      </div>
      <div className="glass-card overflow-hidden">
        {loading ? <div className="p-8 text-center text-text-muted">Loading…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="dark:bg-navy-800/50 bg-gray-50 text-left">
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Name</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Category</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Followers (Total/YT/IG)</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Status</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-text-muted text-center">No influencers yet</td></tr>
                ) : list.map((row) => (
                  <tr key={row.id} className="border-t dark:border-navy-600 border-gray-200 dark:hover:bg-navy-700/30 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {row.profile_image ? <img src={row.profile_image} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-xs">{row.name.charAt(0)}</div>}
                        <span className="dark:text-text-primary text-gray-900 font-medium">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 dark:text-text-muted text-gray-500">{row.content_category?.name ?? row.category ?? '—'}</td>
                    <td className="px-5 py-3 dark:text-text-muted text-gray-500">
                      <div>T: {Number(row.followers ?? 0).toLocaleString()}</div>
                      <div className="text-xs opacity-70">YT: {Number(row.youtube_followers ?? 0).toLocaleString()} | IG: {Number(row.instagram_followers ?? 0).toLocaleString()}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs bg-accent/20 text-accent">{row.status ?? 'new'}</span>
                      {row.work_status && <span className="ml-1 inline-flex px-2 py-0.5 rounded text-xs bg-navy-700 text-text-muted">{row.work_status}</span>}
                    </td>
                    <td className="px-5 py-3">
                      <Link to={`/admin/influencers/${row.id}`} className="text-accent hover:dark:text-accent-bright text-cyan-800 font-medium mr-3">View</Link>
                      <button type="button" onClick={() => openEdit(row)} className="text-accent hover:dark:text-accent-bright text-cyan-800 font-medium mr-3">Edit</button>
                      <button type="button" onClick={() => handleDelete(row.id)} className="text-accent-muted hover:dark:text-accent-bright text-cyan-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-card max-w-2xl w-full p-6 my-8 border dark:border-navy-600 border-gray-200">
            <h2 className="text-lg font-semibold dark:text-text-primary text-gray-900 mb-4">{modal === 'new' ? 'Add influencer' : 'Edit influencer'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Name *</label><input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Profile Image URL</label><input type="text" value={form.profile_image} onChange={(e) => setForm((f) => ({ ...f, profile_image: e.target.value }))} placeholder="https://..." className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Total Followers</label><input type="number" min={0} value={form.followers} onChange={(e) => setForm((f) => ({ ...f, followers: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">YouTube Followers</label><input type="number" min={0} value={form.youtube_followers} onChange={(e) => setForm((f) => ({ ...f, youtube_followers: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Instagram Followers</label><input type="number" min={0} value={form.instagram_followers} onChange={(e) => setForm((f) => ({ ...f, instagram_followers: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Category Master</label>
                  <select value={form.content_category_id} onChange={(e) => setForm((f) => ({ ...f, content_category_id: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900">
                    <option value="">— Select Category —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Engagement rate %</label><input type="number" min={0} max={100} step={0.01} value={form.engagement_rate} onChange={(e) => setForm((f) => ({ ...f, engagement_rate: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Main Status</label><select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900"><option value="new">New</option><option value="shortlisted">Shortlisted</option><option value="assigned">Assigned</option></select></div>
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Work Status</label><select value={form.work_status} onChange={(e) => setForm((f) => ({ ...f, work_status: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900"><option value="">— Select —</option><option value="ready to work">Ready to work</option><option value="need to contact">Need to contact</option></select></div>
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Growth Status</label><select value={form.growth_status} onChange={(e) => setForm((f) => ({ ...f, growth_status: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900"><option value="">— Select —</option><option value="growing">Growing</option><option value="downgrading">Downgrading</option><option value="stable">Stable</option></select></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Men %</label><input type="number" min={0} max={100} value={form.male_percentage} onChange={(e) => setForm((f) => ({ ...f, male_percentage: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Female %</label><input type="number" min={0} max={100} value={form.female_percentage} onChange={(e) => setForm((f) => ({ ...f, female_percentage: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Peak Time</label><input type="text" value={form.peak_time} onChange={(e) => setForm((f) => ({ ...f, peak_time: e.target.value }))} placeholder="e.g. 6PM - 9PM" className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Assigned Team Member</label>
                  <select value={form.assigned_team_member_id} onChange={(e) => setForm((f) => ({ ...f, assigned_team_member_id: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900">
                    <option value="">— Select —</option>
                    {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Reporting Manager</label>
                  <select value={form.reporting_manager_id} onChange={(e) => setForm((f) => ({ ...f, reporting_manager_id: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900">
                    <option value="">— Select —</option>
                    {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Enrollment Date</label><input type="date" value={form.enrolled_at} onChange={(e) => setForm((f) => ({ ...f, enrolled_at: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Platform</label><input type="text" value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))} placeholder="Instagram, YouTube, etc." className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
                <button type="button" onClick={closeModal} className="px-4 py-2 border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900 hover:bg-navy-700/80">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
