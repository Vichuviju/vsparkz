import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type: '',
    contact_email: '',
    contact_phone: '',
    location: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchVendors = () => {
    setLoading(true);
    api
      .get('/admin/vendors')
      .then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setVendors(Array.isArray(d) ? d : []);
      })
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const openCreate = () => {
    setModal('new');
    setForm({ name: '', type: '', contact_email: '', contact_phone: '', location: '', notes: '' });
    setError(null);
  };

  const openEdit = (v) => {
    setModal(v.id);
    setForm({
      name: v.name ?? '',
      type: v.type ?? '',
      contact_email: v.contact_email ?? '',
      contact_phone: v.contact_phone ?? '',
      location: v.location ?? '',
      notes: v.notes ?? '',
    });
    setError(null);
  };

  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (modal === 'new') {
        await api.post('/admin/vendors', form);
      } else {
        await api.put(`/admin/vendors/${modal}`, form);
      }
      fetchVendors();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this vendor?')) return;
    try {
      await api.delete(`/admin/vendors/${id}`);
      fetchVendors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Vendors</h1>
          <p className="text-text-muted text-sm mt-1">Manage vendors, rate cards, and contracts.</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary px-4 py-2 text-sm">
          + Add vendor
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
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="dark:bg-navy-800/50 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Type</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Contact</th>
                <th className="text-left px-4 py-3 text-sm font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-navy-700">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                    No vendors yet. Add a vendor to get started.
                  </td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id} className="dark:hover:bg-navy-800/50">
                    <td className="px-4 py-3 font-medium">{v.name}</td>
                    <td className="px-4 py-3">{v.type ?? '—'}</td>
                    <td className="px-4 py-3">{v.contact_email || v.contact_phone || '—'}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => openEdit(v)} className="text-accent hover:underline text-sm mr-2">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(v.id)} className="text-red-500 hover:underline text-sm">
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

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
          <div
            className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {modal === 'new' ? 'Add vendor' : 'Edit vendor'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
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
                <label className="block text-sm font-medium text-text-primary mb-1">Type</label>
                <input
                  type="text"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  placeholder="e.g. Design, Development"
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Contact email</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Contact phone</label>
                <input
                  type="text"
                  value={form.contact_phone}
                  onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border dark:border-navy-600 dark:bg-navy-900 rounded dark:text-text-primary"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm">
                  {saving ? 'Saving...' : 'Save'}
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

export default Vendors;
export { Vendors };
