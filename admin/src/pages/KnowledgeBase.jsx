import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function KnowledgeBase() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [editingSpace, setEditingSpace] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    visibility: 'private',
  });

  const fetchSpaces = () => {
    setLoading(true);
    api
      .get('/admin/knowledge-spaces')
      .then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setSpaces(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        setSpaces([]);
        setError('Failed to load knowledge spaces.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  const openAdd = () => {
    setModal('form');
    setEditingSpace(null);
    setForm({
      name: '',
      description: '',
      visibility: 'private',
    });
    setError(null);
  };

  const openEdit = (s) => {
    setModal('form');
    setEditingSpace(s);
    setForm({
      name: s.name ?? '',
      description: s.description ?? '',
      visibility: s.visibility ?? 'private',
    });
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditingSpace(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      visibility: form.visibility || 'private',
    };
    try {
      if (editingSpace) {
        await api.put(`/admin/knowledge-spaces/${editingSpace.id}`, payload);
      } else {
        await api.post('/admin/knowledge-spaces', payload);
      }
      fetchSpaces();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save knowledge space.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    setError(null);
    try {
      await api.delete(`/admin/knowledge-spaces/${id}`);
      fetchSpaces();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete knowledge space.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">Knowledge Base</h1>
          <p className="text-text-muted">Knowledge spaces and articles.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
        >
          Add knowledge space
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
                <th className="text-left px-4 py-3 text-sm font-medium">Visibility</th>
                <th className="text-left px-4 py-3 text-sm font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-navy-700">
              {spaces.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                    No knowledge spaces yet. Add one to get started.
                  </td>
                </tr>
              ) : (
                spaces.map((s) => (
                  <tr key={s.id} className="dark:hover:bg-navy-800/50">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{s.description ?? '—'}</td>
                    <td className="px-4 py-3">{s.visibility ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="text-primary-500 hover:underline text-sm mr-2"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(s)}
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
          <div className="glass-card rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {editingSpace ? 'Edit knowledge space' : 'Add knowledge space'}
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
                <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Visibility</label>
                <select
                  value={form.visibility}
                  onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary"
                >
                  <option value="private">Private</option>
                  <option value="internal">Internal</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 rounded-lg text-sm">
                  {saving ? 'Saving...' : (editingSpace ? 'Update' : 'Create')}
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
              Delete knowledge space &quot;{deleteConfirm.name}&quot;? This cannot be undone.
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

export default KnowledgeBase;
export { KnowledgeBase };
