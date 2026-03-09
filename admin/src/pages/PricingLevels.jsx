import { useEffect, useState } from 'react';
import api from '../lib/api';

export function PricingLevels() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ slug: '', label: '', sort_order: 0 });

  useEffect(() => {
    api.get('/admin/pricing-levels')
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch((err) => setError(err.response?.data?.message || 'Failed'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/pricing-levels/${editing.id}`, form);
      } else {
        await api.post('/admin/pricing-levels', form);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ slug: '', label: '', sort_order: 0 });
      const { data } = await api.get('/admin/pricing-levels');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (it) => {
    setEditing(it);
    setForm({ slug: it.slug, label: it.label, sort_order: it.sort_order });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this pricing level?')) return;
    try {
      await api.delete(`/admin/pricing-levels/${id}`);
      setItems(items.filter((it) => it.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Pricing Levels</h1>
        <button className="btn-primary px-4 py-2" onClick={() => setShowModal(true)}>Add Level</button>
      </div>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}
      {loading ? <div className="p-8 text-center text-text-muted">Loading…</div> : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800/50 text-left">
                <th className="px-5 py-3 text-text-muted font-medium">Slug</th>
                <th className="px-5 py-3 text-text-muted font-medium">Label</th>
                <th className="px-5 py-3 text-text-muted font-medium">Order</th>
                <th className="px-5 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-text-muted text-center">No pricing levels.</td></tr>
              ) : items.map((it) => (
                <tr key={it.id} className="border-t border-navy-600 hover:bg-navy-700/30">
                  <td className="px-5 py-3 text-text-primary">{it.slug}</td>
                  <td className="px-5 py-3 text-text-muted">{it.label}</td>
                  <td className="px-5 py-3 text-text-muted">{it.sort_order}</td>
                  <td className="px-5 py-3">
                    <button className="text-accent hover:text-accent-bright mr-3" onClick={() => handleEdit(it)}>Edit</button>
                    <button className="text-accent-muted hover:text-accent-bright" onClick={() => handleDelete(it.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">{editing ? 'Edit' : 'Add'} Pricing Level</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Slug</label>
                <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Label</label>
                <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.label} onChange={e => setForm({...form, label: e.target.value})} required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Sort Order</label>
                <input type="number" className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value) || 0})} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                <button type="button" className="px-4 py-2 border border-navy-600 rounded-vsparkz text-text-muted hover:text-text-primary" onClick={() => { setShowModal(false); setEditing(null); setForm({ slug: '', label: '', sort_order: 0 }); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
