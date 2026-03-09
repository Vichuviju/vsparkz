import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function Brands() {
  const [brands, setBrands] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [editingBrand, setEditingBrand] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    client_id: '',
    default_currency: '',
    time_zone: '',
  });

  const fetchBrands = () => {
    setLoading(true);
    api
      .get('/admin/brands')
      .then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setBrands(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        setBrands([]);
        setError('Failed to load brands.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    api
      .get('/admin/clients', { params: { per_page: 500 } })
      .then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setClients(Array.isArray(d) ? d : []);
      })
      .catch(() => setClients([]));
  }, []);

  const openAdd = () => {
    setModal('form');
    setEditingBrand(null);
    setForm({
      name: '',
      slug: '',
      client_id: '',
      default_currency: '',
      time_zone: '',
    });
    setError(null);
  };

  const openEdit = (b) => {
    setModal('form');
    setEditingBrand(b);
    setForm({
      name: b.name ?? '',
      slug: b.slug ?? '',
      client_id: b.client_id ?? '',
      default_currency: b.default_currency ?? '',
      time_zone: b.time_zone ?? '',
    });
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditingBrand(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      client_id: form.client_id ? Number(form.client_id) : null,
      default_currency: form.default_currency.trim() || null,
      time_zone: form.time_zone.trim() || null,
    };
    try {
      if (editingBrand) {
        await api.put(`/admin/brands/${editingBrand.id}`, payload);
      } else {
        await api.post('/admin/brands', payload);
      }
      fetchBrands();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save brand.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    setError(null);
    try {
      await api.delete(`/admin/brands/${id}`);
      fetchBrands();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete brand.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">Brands</h1>
          <p className="text-text-muted">Multi-brand: brands, locations, and assignments.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
        >
          Add brand
        </button>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="dark:bg-navy-800/50 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Slug</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Client</th>
                <th className="text-left px-4 py-3 text-sm font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-navy-700">
              {brands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                    No brands yet. Add one to get started.
                  </td>
                </tr>
              ) : (
                brands.map((b) => (
                  <tr key={b.id} className="dark:hover:bg-navy-800/50">
                    <td className="px-4 py-3 font-medium">{b.name}</td>
                    <td className="px-4 py-3">{b.slug ?? '—'}</td>
                    <td className="px-4 py-3">{b.client?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openEdit(b)}
                        className="text-primary-500 hover:underline text-sm mr-2"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(b)}
                        className="text-red-500 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'form' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {editingBrand ? 'Edit brand' : 'Add brand'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary"
                  placeholder="auto from name if empty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Client</label>
                <select
                  value={form.client_id}
                  onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary"
                >
                  <option value="">— None —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name ?? c.company_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Default currency</label>
                <input
                  type="text"
                  value={form.default_currency}
                  onChange={(e) => setForm((f) => ({ ...f, default_currency: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary"
                  placeholder="e.g. USD"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Time zone</label>
                <input
                  type="text"
                  value={form.time_zone}
                  onChange={(e) => setForm((f) => ({ ...f, time_zone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary"
                  placeholder="e.g. UTC"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 rounded-lg text-sm">
                  {saving ? 'Saving...' : (editingBrand ? 'Update' : 'Create')}
                </button>
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg border dark:border-navy-600 text-text-primary text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-text-primary mb-4">
              Delete brand &quot;{deleteConfirm.name}&quot;? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
              <button type="button" onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border dark:border-navy-600 text-text-primary text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Brands;
export { Brands };
