import { useEffect, useState } from 'react';
import api from '../lib/api';

export function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '', slug: '', description: '', is_active: true,
    category: '', service_type: 'one-time', default_duration_value: '', default_duration_unit: 'days',
    dependencies: [],
  });
  const [saving, setSaving] = useState(false);

  const fetchServices = () => {
    api
      .get('/admin/services', { params: { with_totals: 1 } })
      .then(({ data }) => setServices(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load services'))
      .finally(() => setLoading(false));
  };

  const formatDuration = (dur) => {
    if (!dur || typeof dur !== 'object') return '—';
    const parts = Object.entries(dur)
      .filter(([, v]) => v > 0)
      .map(([u, v]) => `${v} ${u}`);
    return parts.length ? parts.join(', ') : '—';
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreate = () => {
    setEditing('new');
    setForm({
      title: '', slug: '', description: '', is_active: true,
      category: '', service_type: 'one-time', default_duration_value: '', default_duration_unit: 'days',
      dependencies: [],
    });
  };

  const openEdit = (s) => {
    setEditing(s.id);
    setForm({
      title: s.title,
      slug: s.slug ?? '',
      description: s.description ?? '',
      is_active: s.is_active ?? true,
      category: s.category ?? '',
      service_type: s.service_type ?? 'one-time',
      default_duration_value: s.default_duration_value ?? '',
      default_duration_unit: s.default_duration_unit ?? 'days',
      dependencies: Array.isArray(s.dependencies) ? s.dependencies : [],
    });
  };

  const closeForm = () => setEditing(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing === 'new') {
        await api.post('/admin/services', form);
      } else {
        await api.put(`/admin/services/${editing}`, form);
      }
      fetchServices();
      closeForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this service?')) return;
    try {
      await api.delete(`/admin/services/${id}`);
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Services</h1>
        <button type="button" onClick={openCreate} className="btn-primary px-4 py-2 text-sm">Add Service</button>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>
      )}
      {loading ? (
        <div className="p-8 text-center text-text-muted">Loading…</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800/50 text-left">
                <th className="px-5 py-3 text-text-muted font-medium">Title</th>
                <th className="px-5 py-3 text-text-muted font-medium">Slug</th>
                <th className="px-5 py-3 text-text-muted font-medium">Sub total price</th>
                <th className="px-5 py-3 text-text-muted font-medium">Sub total time</th>
                <th className="px-5 py-3 text-text-muted font-medium">Active</th>
                <th className="px-5 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-text-muted text-center">No services yet. Add one above.</td></tr>
              ) : (
                services.map((s) => (
                  <tr key={s.id} className="border-t border-navy-600 hover:bg-navy-700/30">
                    <td className="px-5 py-3 text-text-primary">{s.title}</td>
                    <td className="px-5 py-3 text-text-muted">{s.slug ?? '—'}</td>
                    <td className="px-5 py-3">{s.subservice_total_price != null && s.subservice_total_price > 0 ? `₹${Number(s.subservice_total_price).toLocaleString()}` : '—'}</td>
                    <td className="px-5 py-3 text-text-muted">{formatDuration(s.subservice_total_duration)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs ${s.is_active ? 'bg-accent/20 text-accent' : 'bg-navy-700 text-text-muted'}`}>{s.is_active ? 'Yes' : 'No'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button type="button" onClick={() => openEdit(s)} className="text-accent hover:text-accent-bright font-medium mr-2">Edit</button>
                      <button type="button" onClick={() => handleDelete(s.id)} className="text-accent-muted hover:text-accent-bright">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full p-6 border border-navy-600">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {editing === 'new' ? 'Add Service' : 'Edit Service'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Slug (optional)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary focus:border-accent"
                  placeholder="auto from title if empty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary focus:border-accent"
                  placeholder="e.g. Design, Marketing"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Service type</label>
                <select
                  value={form.service_type}
                  onChange={(e) => setForm((f) => ({ ...f, service_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary focus:border-accent"
                >
                  <option value="one-time">One-time</option>
                  <option value="recurring">Recurring</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Default duration (value)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.default_duration_value}
                    onChange={(e) => setForm((f) => ({ ...f, default_duration_value: e.target.value }))}
                    className="w-full px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Unit</label>
                  <select
                    value={form.default_duration_unit}
                    onChange={(e) => setForm((f) => ({ ...f, default_duration_unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary focus:border-accent"
                  >
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Dependencies (other service IDs, comma-separated)</label>
                <input
                  type="text"
                  value={Array.isArray(form.dependencies) ? form.dependencies.join(', ') : ''}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    dependencies: e.target.value.split(',').map((x) => parseInt(x.trim(), 10)).filter((n) => !Number.isNaN(n)),
                  }))}
                  className="w-full px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary focus:border-accent"
                  placeholder="e.g. 1, 2"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm text-text-muted">Active</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-4 py-2 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 border border-navy-600 rounded-vsparkz text-text-primary hover:bg-navy-700/80"
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
