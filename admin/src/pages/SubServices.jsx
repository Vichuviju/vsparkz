import { useEffect, useState } from 'react';
import api from '../lib/api';

export function SubServices() {
  const [items, setItems] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const defaultForm = () => ({
    service_id: '',
    name: '',
    description: '',
    average_price: '',
    freelance_price: '',
    average_duration_value: '',
    average_duration_unit: 'days',
    service_type: 'one-time',
    sort_order: 0,
    is_active: true,
  });
  const [form, setForm] = useState(defaultForm());

  useEffect(() => {
    api.get('/admin/services').then(({ data }) => setServices(Array.isArray(data) ? data : [])).catch(() => {});
    api.get('/admin/sub-services')
      .then(({ data }) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const getServiceName = (id) => services.find((s) => s.id === id)?.title ?? id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/sub-services/${editing.id}`, form);
      } else {
        await api.post('/admin/sub-services', form);
      }
      setShowModal(false);
      setEditing(null);
      setForm(defaultForm());
      // Refetch
      const { data } = await api.get('/admin/sub-services');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (it) => {
    setEditing(it);
    setForm({
      service_id: it.service_id,
      name: it.name,
      description: it.description ?? '',
      average_price: it.average_price ?? '',
      freelance_price: it.freelance_price ?? '',
      average_duration_value: it.average_duration_value ?? '',
      average_duration_unit: it.average_duration_unit ?? 'days',
      service_type: it.service_type ?? 'one-time',
      sort_order: it.sort_order ?? 0,
      is_active: !!it.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this sub-service?')) return;
    try {
      await api.delete(`/admin/sub-services/${id}`);
      setItems(items.filter((it) => it.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Sub-Services</h1>
        <button className="btn-primary px-4 py-2" onClick={() => setShowModal(true)}>Add Sub-Service</button>
      </div>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}
      {loading ? (
        <div className="p-8 text-center text-text-muted">Loading…</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800/50 text-left">
                <th className="px-5 py-3 text-text-muted font-medium">Service</th>
                <th className="px-5 py-3 text-text-muted font-medium">Name</th>
                <th className="px-5 py-3 text-text-muted font-medium">Avg Price</th>
                <th className="px-5 py-3 text-text-muted font-medium">Duration</th>
                <th className="px-5 py-3 text-text-muted font-medium">Type</th>
                <th className="px-5 py-3 text-text-muted font-medium">Order</th>
                <th className="px-5 py-3 text-text-muted font-medium">Active</th>
                <th className="px-5 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-text-muted text-center">No sub-services yet.</td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="border-t border-navy-600">
                    <td className="px-5 py-3 text-text-muted">{getServiceName(it.service_id)}</td>
                    <td className="px-5 py-3 text-text-primary">{it.name}</td>
                    <td className="px-5 py-3">{it.average_price != null ? `₹${Number(it.average_price).toLocaleString()}` : '—'}</td>
                    <td className="px-5 py-3">{it.average_duration_value != null ? `${it.average_duration_value} ${it.average_duration_unit || ''}` : '—'}</td>
                    <td className="px-5 py-3 text-text-muted">{it.service_type === 'recurring' ? 'Recurring' : 'One-time'}</td>
                    <td className="px-5 py-3">{it.sort_order}</td>
                    <td className="px-5 py-3">{it.is_active ? 'Yes' : 'No'}</td>
                    <td className="px-5 py-3">
                      <button className="text-accent hover:text-accent-bright mr-3" onClick={() => handleEdit(it)}>Edit</button>
                      <button className="text-accent-muted hover:text-accent-bright" onClick={() => handleDelete(it.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-4">
          <div className="glass-card p-6 w-full max-w-md my-auto">
            <h2 className="text-xl font-bold text-text-primary mb-4">{editing ? 'Edit' : 'Add'} Sub-Service</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Service</label>
                <select className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.service_id} onChange={e => setForm({...form, service_id: e.target.value})} required>
                  <option value="">Select Service</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Name</label>
                <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
                <textarea className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Service type</label>
                <select className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.service_type} onChange={e => setForm({...form, service_type: e.target.value})}>
                  <option value="one-time">One-time</option>
                  <option value="recurring">Recurring</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Average price (₹)</label>
                  <input type="number" min="0" step="0.01" className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.average_price} onChange={e => setForm({...form, average_price: e.target.value})} placeholder="In-house" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Freelance price (₹)</label>
                  <input type="number" min="0" step="0.01" className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.freelance_price} onChange={e => setForm({...form, freelance_price: e.target.value})} placeholder="Optional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Duration value</label>
                  <input type="number" min="0" className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.average_duration_value} onChange={e => setForm({...form, average_duration_value: e.target.value})} placeholder="e.g. 10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Duration unit</label>
                  <select className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.average_duration_unit} onChange={e => setForm({...form, average_duration_unit: e.target.value})}>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="posts">Posts</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Sort Order</label>
                <input type="number" className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value) || 0})} />
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2 text-text-muted">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />
                  Active
                </label>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                <button type="button" className="px-4 py-2 border border-navy-600 rounded-vsparkz text-text-muted hover:text-text-primary" onClick={() => { setShowModal(false); setEditing(null); setForm(defaultForm()); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
