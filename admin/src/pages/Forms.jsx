import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function Forms() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [editingForm, setEditingForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    status: 'draft',
  });

  const fetchForms = () => {
    setLoading(true);
    api
      .get('/admin/forms')
      .then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setForms(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        setForms([]);
        setError('Failed to load forms.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const openAdd = () => {
    setModal('form');
    setEditingForm(null);
    setForm({ name: '', slug: '', description: '', status: 'draft' });
    setError(null);
  };

  const openEdit = (f) => {
    setModal('form');
    setEditingForm(f);
    setForm({
      name: f.name ?? '',
      slug: f.slug ?? '',
      description: f.description ?? '',
      status: f.status ?? 'draft',
    });
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditingForm(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || null,
      status: form.status || 'draft',
    };
    try {
      if (editingForm) {
        await api.put(`/admin/forms/${editingForm.id}`, payload);
      } else {
        await api.post('/admin/forms', payload);
      }
      fetchForms();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save form.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    setError(null);
    try {
      await api.delete(`/admin/forms/${id}`);
      fetchForms();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete form.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">Forms</h1>
          <p className="text-text-muted">Form definitions and embed scripts.</p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">
          Add form
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
                <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-navy-700">
              {forms.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                    No forms yet. Add one to get started.
                  </td>
                </tr>
              ) : (
                forms.map((f) => (
                  <tr key={f.id} className="dark:hover:bg-navy-800/50">
                    <td className="px-4 py-3 font-medium">{f.name}</td>
                    <td className="px-4 py-3">{f.slug ?? '—'}</td>
                    <td className="px-4 py-3">{f.status ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => openEdit(f)} className="text-primary-500 hover:underline text-sm mr-2">Edit</button>
                      <button type="button" onClick={() => setDeleteConfirm(f)} className="text-red-500 hover:underline text-sm">Delete</button>
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
            <h2 className="text-lg font-semibold text-text-primary mb-4">{editingForm ? 'Edit form' : 'Add form'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Slug</label>
                <input type="text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary" placeholder="auto from name if empty" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 rounded-lg text-sm">{saving ? 'Saving...' : (editingForm ? 'Update' : 'Create')}</button>
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg border dark:border-navy-600 text-text-primary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-text-primary mb-4">Delete form &quot;{deleteConfirm.name}&quot;? This cannot be undone.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleDelete(deleteConfirm.id)} disabled={saving} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50">Delete</button>
              <button type="button" onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border dark:border-navy-600 text-text-primary text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Forms;
export { Forms };
