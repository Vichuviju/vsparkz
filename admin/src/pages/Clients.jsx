import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export function Clients() {
  const [list, setList] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ company_name: '', contact_name: '', email: '', phone: '', address: '', tax_id: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchList = (page = 1) => {
    setLoading(true);
    const params = { page, per_page: 15 };
    if (search) params.search = search;
    api.get('/admin/clients', { params }).then(({ data }) => {
      setList(data.data ?? data);
      setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total });
    }).catch((err) => setError(err.response?.data?.message || 'Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, []);

  const openCreate = () => {
    setModal('new');
    setForm({ company_name: '', contact_name: '', email: '', phone: '', address: '', tax_id: '', notes: '' });
  };
  const openEdit = (row) => {
    setModal(row.id);
    setForm({
      company_name: row.company_name ?? '',
      contact_name: row.contact_name ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
      address: row.address ?? '',
      tax_id: row.tax_id ?? '',
      notes: row.notes ?? '',
    });
  };
  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'new') await api.post('/admin/clients', form);
      else await api.put(`/admin/clients/${modal}`, form);
      fetchList();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this client?')) return;
    try {
      await api.delete(`/admin/clients/${id}`);
      fetchList();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">Clients</h1>
        <button type="button" onClick={openCreate} className="btn-primary px-4 py-2 text-sm">+ Add client</button>
      </div>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 dark:text-accent-bright text-cyan-800 text-sm">{error}</div>}
      <div className="flex gap-4 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); fetchList(1); }} className="flex gap-2 flex-1 min-w-[200px]">
          <input type="text" placeholder="Search company, contact, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 placeholder-gray-400 text-sm focus:border-accent focus:ring-1 focus:ring-accent/30" />
          <button type="submit" className="btn-primary px-4 py-2 text-sm">Search</button>
        </form>
      </div>
      <div className="glass-card overflow-hidden">
        {loading ? <div className="p-8 text-center dark:text-text-muted text-gray-500">Loading…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="dark:bg-navy-800/50 bg-gray-50 text-left">
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Company</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Contact</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Email</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Phone</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Source</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 dark:text-text-muted text-gray-500 text-center">No clients yet</td></tr>
                ) : list.map((row) => (
                  <tr key={row.id} className="border-t dark:border-navy-600 border-gray-200 dark:hover:bg-navy-700/30 hover:bg-gray-50">
                    <td className="px-5 py-3 dark:text-text-primary text-gray-900 font-medium">{row.company_name}</td>
                    <td className="px-5 py-3 dark:text-text-muted text-gray-500">{row.contact_name ?? '—'}</td>
                    <td className="px-5 py-3 dark:text-text-muted text-gray-500">{row.email ?? '—'}</td>
                    <td className="px-5 py-3 dark:text-text-muted text-gray-500">{row.phone ?? '—'}</td>
                    <td className="px-5 py-3 dark:text-text-muted text-gray-500">{row.source ?? 'Manual'}</td>
                    <td className="px-5 py-3">
                      <Link to={`/clients/${row.id}`} className="text-accent hover:dark:text-accent-bright text-cyan-800 font-medium mr-2">View</Link>
                      <button type="button" onClick={() => openEdit(row)} className="text-accent hover:dark:text-accent-bright text-cyan-800 font-medium mr-2">Edit</button>
                      <button type="button" onClick={() => handleDelete(row.id)} className="text-accent-muted hover:dark:text-accent-bright text-cyan-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta.last_page > 1 && (
          <div className="px-5 py-3 border-t dark:border-navy-600 border-gray-200 flex justify-between items-center text-sm dark:text-text-muted text-gray-500">
            <span>Page {meta.current_page} of {meta.last_page} ({meta.total} total)</span>
            <div className="flex gap-2">
              <button type="button" disabled={meta.current_page <= 1} onClick={() => fetchList(meta.current_page - 1)} className="px-3 py-1 rounded-vsparkz border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white dark:text-text-primary text-gray-900 disabled:opacity-50">Previous</button>
              <button type="button" disabled={meta.current_page >= meta.last_page} onClick={() => fetchList(meta.current_page + 1)} className="px-3 py-1 rounded-vsparkz border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white dark:text-text-primary text-gray-900 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-card max-w-lg w-full p-6 my-8 border dark:border-navy-600 border-gray-200">
            <h2 className="text-lg font-semibold dark:text-text-primary text-gray-900 mb-4">{modal === 'new' ? 'Add client' : 'Edit client'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Company name *</label><input type="text" value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} required className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent focus:ring-1 focus:ring-accent/30" /></div>
              <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Contact name</label><input type="text" value={form.contact_name} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Email</label><input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent" /></div>
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Phone</label><input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent" /></div>
              </div>
              <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Address</label><textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} rows={2} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent" /></div>
              <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Tax ID</label><input type="text" value={form.tax_id} onChange={(e) => setForm((f) => ({ ...f, tax_id: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent" /></div>
              <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 disabled:opacity-50">Save</button>
                <button type="button" onClick={closeModal} className="px-4 py-2 border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900 hover:bg-navy-700/80">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
