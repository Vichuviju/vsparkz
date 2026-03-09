import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export function Invoices() {
  const [list, setList] = useState([]);
  const [clients, setClients] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ client_id: '', number: '', items: [], subtotal: 0, tax_rate: 0, tax_amount: 0, total: 0, status: 'draft', due_date: '' });
  const [saving, setSaving] = useState(false);

  const fetchList = (page = 1) => {
    setLoading(true);
    const params = { page, per_page: 15 };
    if (statusFilter) params.status = statusFilter;
    api.get('/admin/invoices', { params }).then(({ data }) => {
      setList(data.data ?? data);
      setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total });
    }).catch((err) => setError(err.response?.data?.message || 'Failed to load')).finally(() => setLoading(false));
  };
  useEffect(() => { fetchList(); }, [statusFilter]);
  useEffect(() => { api.get('/admin/clients', { params: { per_page: 200 } }).then(({ data }) => setClients(data.data ?? data ?? [])).catch(() => setClients([])); }, []);

  const openCreate = () => { setModal('new'); setForm({ client_id: '', number: `INV-${Date.now()}`, items: [], subtotal: 0, tax_rate: 0, tax_amount: 0, total: 0, status: 'draft', due_date: '' }); };
  const openEdit = (row) => { setModal(row.id); setForm({ client_id: row.client_id, number: row.number, items: row.items ?? [], subtotal: row.subtotal ?? 0, tax_rate: row.tax_rate ?? 0, tax_amount: row.tax_amount ?? 0, total: row.total ?? 0, status: row.status ?? 'draft', due_date: row.due_date ? row.due_date.slice(0, 10) : '' }); };
  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, client_id: parseInt(form.client_id, 10), subtotal: parseFloat(form.subtotal) || 0, tax_rate: parseFloat(form.tax_rate) || 0, tax_amount: parseFloat(form.tax_amount) || 0, total: parseFloat(form.total) || 0, due_date: form.due_date || null };
    try {
      if (modal === 'new') await api.post('/admin/invoices', payload);
      else await api.put(`/admin/invoices/${modal}`, payload);
      fetchList();
      closeModal();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => { if (!confirm('Delete this invoice?')) return; try { await api.delete(`/admin/invoices/${id}`); fetchList(); } catch (err) { setError(err.response?.data?.message || 'Failed to delete'); } };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">Invoices</h1>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 text-sm">
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <button type="button" onClick={openCreate} className="btn-primary px-4 py-2 text-sm">+ Add invoice</button>
        </div>
      </div>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 dark:text-accent-bright text-cyan-800 text-sm">{error}</div>}
      {loading ? <div className="p-8 text-center dark:text-text-muted text-gray-500">Loading…</div> : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="dark:bg-navy-800/50 bg-gray-50 text-left"><th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Number</th><th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Client</th><th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Total</th><th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Status</th><th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Due</th><th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Actions</th></tr></thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={6} className="px-5 py-8 dark:text-text-muted text-gray-500 text-center">No invoices yet</td></tr> : list.map((row) => (
                <tr key={row.id} className="border-t dark:border-navy-600 border-gray-200 dark:hover:bg-navy-700/30 hover:bg-gray-50">
                  <td className="px-5 py-3 dark:text-text-primary text-gray-900 font-mono">{row.number}</td>
                  <td className="px-5 py-3 dark:text-text-muted text-gray-500">{row.client?.company_name ?? '—'}</td>
                  <td className="px-5 py-3 dark:text-text-primary text-gray-900">{Number(row.total).toFixed(2)}</td>
                  <td className="px-5 py-3"><span className="inline-flex px-2 py-0.5 rounded text-xs bg-accent/20 text-accent">{row.status}</span></td>
                  <td className="px-5 py-3 dark:text-text-muted text-gray-500">{row.due_date ? new Date(row.due_date).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3"><Link to={`/invoices/${row.id}`} className="text-accent hover:dark:text-accent-bright text-cyan-800 font-medium mr-2">View</Link><button type="button" onClick={() => openEdit(row)} className="text-accent hover:dark:text-accent-bright text-cyan-800 font-medium mr-2">Edit</button><button type="button" onClick={() => handleDelete(row.id)} className="text-accent-muted hover:dark:text-accent-bright text-cyan-800">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {meta.last_page > 1 && <div className="px-5 py-3 border-t dark:border-navy-600 border-gray-200 flex justify-between items-center text-sm dark:text-text-muted text-gray-500"><span>Page {meta.current_page} of {meta.last_page}</span><div className="flex gap-2"><button type="button" disabled={meta.current_page <= 1} onClick={() => fetchList(meta.current_page - 1)} className="px-3 py-1 rounded-vsparkz border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white dark:text-text-primary text-gray-900 disabled:opacity-50">Previous</button><button type="button" disabled={meta.current_page >= meta.last_page} onClick={() => fetchList(meta.current_page + 1)} className="px-3 py-1 rounded-vsparkz border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white dark:text-text-primary text-gray-900 disabled:opacity-50">Next</button></div></div>}
        </div>
      )}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-card max-w-lg w-full p-6 my-8 border dark:border-navy-600 border-gray-200">
            <h2 className="text-lg font-semibold dark:text-text-primary text-gray-900 mb-4">{modal === 'new' ? 'Add invoice' : 'Edit invoice'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Client *</label><select value={form.client_id} onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))} required className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent"><option value="">—</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}</select></div>
              <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Number *</label><input type="text" value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} required className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 font-mono focus:border-accent" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Subtotal</label><input type="number" step="0.01" value={form.subtotal} onChange={(e) => setForm((f) => ({ ...f, subtotal: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent" /></div>
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Tax rate %</label><input type="number" step="0.01" value={form.tax_rate} onChange={(e) => setForm((f) => ({ ...f, tax_rate: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Tax amount</label><input type="number" step="0.01" value={form.tax_amount} onChange={(e) => setForm((f) => ({ ...f, tax_amount: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent" /></div>
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Total</label><input type="number" step="0.01" value={form.total} onChange={(e) => setForm((f) => ({ ...f, total: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent" /></div>
              </div>
              <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Due date</label><input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent" /></div>
              <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Status</label><select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent"><option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></div>
              <div className="flex gap-2 pt-2"><button type="submit" disabled={saving} className="btn-primary px-4 py-2 disabled:opacity-50">Save</button><button type="button" onClick={closeModal} className="px-4 py-2 border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900 dark:hover:bg-navy-700/80 hover:bg-gray-100">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
