import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function EmailAutomation() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [editingList, setEditingList] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    source: '',
    is_dynamic: false,
  });

  const fetchLists = () => {
    setLoading(true);
    api
      .get('/admin/contact-lists')
      .then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setLists(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        setLists([]);
        setError('Failed to load contact lists.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const openAdd = () => {
    setModal('form');
    setEditingList(null);
    setForm({ name: '', description: '', source: '', is_dynamic: false });
    setError(null);
  };

  const openEdit = (l) => {
    setModal('form');
    setEditingList(l);
    setForm({
      name: l.name ?? '',
      description: l.description ?? '',
      source: l.source ?? '',
      is_dynamic: l.is_dynamic ?? false,
    });
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditingList(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      source: form.source.trim() || null,
      is_dynamic: form.is_dynamic,
    };
    try {
      if (editingList) {
        await api.put(`/admin/contact-lists/${editingList.id}`, payload);
      } else {
        await api.post('/admin/contact-lists', payload);
      }
      fetchLists();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save contact list.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    setError(null);
    try {
      await api.delete(`/admin/contact-lists/${id}`);
      fetchLists();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete contact list.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">Email Automation</h1>
          <p className="text-text-muted">Contact lists, segments, email sequences.</p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">
          Add contact list
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
                <th className="text-left px-4 py-3 text-sm font-medium">Description</th>
                <th className="text-left px-4 py-3 text-sm font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-navy-700">
              {lists.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-text-muted">
                    No contact lists yet. Create lists to manage email campaigns.
                  </td>
                </tr>
              ) : (
                lists.map((l) => (
                  <tr key={l.id} className="dark:hover:bg-navy-800/50">
                    <td className="px-4 py-3 font-medium">{l.name}</td>
                    <td className="px-4 py-3">{l.description ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => openEdit(l)} className="text-primary-500 hover:underline text-sm mr-2">Edit</button>
                      <button type="button" onClick={() => setDeleteConfirm(l)} className="text-red-500 hover:underline text-sm">Delete</button>
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
            <h2 className="text-lg font-semibold text-text-primary mb-4">{editingList ? 'Edit contact list' : 'Add contact list'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Source</label>
                <input type="text" value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_dynamic" checked={form.is_dynamic} onChange={(e) => setForm((f) => ({ ...f, is_dynamic: e.target.checked }))} className="rounded border-navy-600" />
                <label htmlFor="is_dynamic" className="text-sm text-text-primary">Dynamic list</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 rounded-lg text-sm">{saving ? 'Saving...' : (editingList ? 'Update' : 'Create')}</button>
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg border dark:border-navy-600 text-text-primary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-text-primary mb-4">Delete contact list &quot;{deleteConfirm.name}&quot;? This cannot be undone.</p>
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

export default EmailAutomation;
export { EmailAutomation };
