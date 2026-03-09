import { useEffect, useState } from 'react';
import api from '../lib/api';

export function Plans() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'monthly', duration_days: 30, price: '', currency: 'INR', is_active: true });

  const loadList = () => {
    api.get('/admin/plans')
      .then(({ data }) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        type: form.type,
        duration_days: form.duration_days ? parseInt(form.duration_days, 10) : null,
        price: form.price !== '' ? parseFloat(form.price) : null,
        currency: form.currency,
        is_active: form.is_active,
      };
      if (editing) {
        await api.put(`/admin/plans/${editing.id}`, payload);
      } else {
        await api.post('/admin/plans', payload);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', type: 'monthly', duration_days: 30, price: '', currency: 'INR', is_active: true });
      loadList();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (it) => {
    setEditing(it);
    setForm({
      name: it.name || '',
      type: it.type || 'monthly',
      duration_days: it.duration_days ?? 30,
      price: it.price != null ? String(it.price) : '',
      currency: it.currency || 'INR',
      is_active: !!it.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this plan?')) return;
    try {
      await api.delete(`/admin/plans/${id}`);
      setItems(items.filter((it) => it.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', type: 'monthly', duration_days: 30, price: '', currency: 'INR', is_active: true });
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">Plans (Pricing)</h1>
        <button className="btn-primary px-4 py-2" onClick={openCreate}>Add plan</button>
      </div>
      <p className="text-sm text-text-muted mb-4">These plans appear on the public landing page pricing section.</p>
      {error && (
        <div className="mb-4 p-3 rounded-vsparkz bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <div className="p-8 text-center text-text-muted">Loading…</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800/50 text-left">
                <th className="px-5 py-3 text-text-muted font-medium">Name</th>
                <th className="px-5 py-3 text-text-muted font-medium">Type</th>
                <th className="px-5 py-3 text-text-muted font-medium">Duration</th>
                <th className="px-5 py-3 text-text-muted font-medium">Price</th>
                <th className="px-5 py-3 text-text-muted font-medium">Active</th>
                <th className="px-5 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-text-muted text-center">No plans yet. Add plans to show pricing on the landing page.</td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="border-t border-navy-600 dark:border-gray-600 hover:bg-navy-700/30">
                    <td className="px-5 py-3 dark:text-text-primary text-gray-900">{it.name}</td>
                    <td className="px-5 py-3 text-text-muted">{it.type || '—'}</td>
                    <td className="px-5 py-3 text-text-muted">{it.duration_days != null ? `${it.duration_days} days` : '—'}</td>
                    <td className="px-5 py-3 text-text-muted">
                      {it.price != null ? (it.currency === 'INR' ? `₹${Number(it.price).toLocaleString()}` : `${it.currency} ${Number(it.price).toLocaleString()}`) : '—'}
                    </td>
                    <td className="px-5 py-3 text-text-muted">{it.is_active ? 'Yes' : 'No'}</td>
                    <td className="px-5 py-3">
                      <button type="button" className="text-accent hover:text-accent-bright mr-3" onClick={() => handleEdit(it)}>Edit</button>
                      <button type="button" className="text-accent-muted hover:text-accent-bright" onClick={() => handleDelete(it.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold dark:text-text-primary text-gray-900 mb-4">{editing ? 'Edit' : 'Add'} plan</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Name</label>
                <input
                  className="w-full px-3 py-2 dark:bg-navy-800/80 bg-white border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Type</label>
                <select
                  className="w-full px-3 py-2 dark:bg-navy-800/80 bg-white border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Duration (days)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 dark:bg-navy-800/80 bg-white border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900"
                  value={form.duration_days}
                  onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 dark:bg-navy-800/80 bg-white border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Currency</label>
                <select
                  className="w-full px-3 py-2 dark:bg-navy-800/80 bg-white border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="plan-active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-navy-600"
                />
                <label htmlFor="plan-active" className="text-sm text-text-muted">Active (show on landing)</label>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                <button
                  type="button"
                  className="px-4 py-2 border dark:border-navy-600 border-gray-200 rounded-vsparkz text-text-muted hover:text-text-primary"
                  onClick={() => { setShowModal(false); setEditing(null); }}
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
