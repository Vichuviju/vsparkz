import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function ServicePackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    base_price: '',
    currency: 'INR',
    pricing_model: 'flat',
    active: true,
  });

  const fetchPackages = () => {
    setLoading(true);
    setError(null);
    api
      .get('/admin/service-packages')
      .then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setPackages(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        setPackages([]);
        setError('Failed to load service packages.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const openAdd = () => {
    setModal('add');
    setEditingPackage(null);
    setForm({
      name: '',
      description: '',
      base_price: '',
      currency: 'INR',
      pricing_model: 'flat',
      active: true,
    });
    setError(null);
  };

  const openEdit = (p) => {
    setModal('edit');
    setEditingPackage(p);
    setForm({
      name: p.name ?? '',
      description: p.description ?? '',
      base_price: p.base_price ?? '',
      currency: p.currency ?? 'INR',
      pricing_model: p.pricing_model ?? 'flat',
      active: p.active !== false,
    });
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditingPackage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      base_price: form.base_price !== '' ? Number(form.base_price) : null,
      currency: form.currency,
      pricing_model: form.pricing_model,
      active: form.active,
    };
    try {
      if (modal === 'add') {
        await api.post('/admin/service-packages', payload);
      } else {
        await api.put(`/admin/service-packages/${editingPackage.id}`, payload);
      }
      fetchPackages();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save service package.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this service package?')) return;
    setError(null);
    try {
      await api.delete(`/admin/service-packages/${id}`);
      fetchPackages();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete service package.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Productized Services</h1>
          <p className="text-text-muted text-sm mt-1">Manage standard service packages and productized offerings.</p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary px-4 py-2 text-sm">
          + Add Package
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : packages.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center text-text-muted">
          No productized service packages yet. Click &quot;Add Package&quot; to create one.
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead className="dark:bg-navy-800/50 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Description</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Base Price</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Model</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-navy-700">
              {packages.map((p) => (
                <tr key={p.id} className="dark:hover:bg-navy-800/50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-text-muted max-w-xs truncate">{p.description ?? '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {p.base_price != null ? `${p.currency} ${Number(p.base_price).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">{p.pricing_model ?? '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        p.active !== false
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {p.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => openEdit(p)} className="text-accent hover:underline text-sm mr-2">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline text-sm">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-slate-900/60 backdrop-blur-sm" onClick={closeModal}>
          <div
            className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {modal === 'add' ? 'Add service package' : 'Edit service package'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Base Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.base_price}
                    onChange={(e) => setForm((f) => ({ ...f, base_price: e.target.value }))}
                    className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Pricing Model</label>
                <select
                  value={form.pricing_model}
                  onChange={(e) => setForm((f) => ({ ...f, pricing_model: e.target.value }))}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                >
                  <option value="flat">Flat rate</option>
                  <option value="hourly">Hourly rate</option>
                  <option value="recurring">Recurring subscription</option>
                  <option value="custom">Custom scope</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="package-active"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="rounded border-navy-600 text-accent focus:ring-accent"
                />
                <label htmlFor="package-active" className="text-sm text-text-primary">
                  Active
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={closeModal} className="px-4 py-2 border dark:border-navy-600 rounded text-sm">
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

export default ServicePackages;
export { ServicePackages };
