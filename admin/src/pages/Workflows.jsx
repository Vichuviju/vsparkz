import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function Workflows() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    is_active: true,
  });

  const fetchTemplates = () => {
    setLoading(true);
    api
      .get('/admin/workflow-templates')
      .then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setTemplates(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        setTemplates([]);
        setError('Failed to load workflow templates.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openAdd = () => {
    setModal('form');
    setEditingTemplate(null);
    setForm({
      name: '',
      category: '',
      description: '',
      is_active: true,
    });
    setError(null);
  };

  const openEdit = (t) => {
    setModal('form');
    setEditingTemplate(t);
    setForm({
      name: t.name ?? '',
      category: t.category ?? '',
      description: t.description ?? '',
      is_active: t.is_active !== false,
    });
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditingTemplate(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      is_active: form.is_active,
    };
    try {
      if (editingTemplate) {
        await api.put(`/admin/workflow-templates/${editingTemplate.id}`, payload);
      } else {
        await api.post('/admin/workflow-templates', payload);
      }
      fetchTemplates();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save workflow template.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    setError(null);
    try {
      await api.delete(`/admin/workflow-templates/${id}`);
      fetchTemplates();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete workflow template.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">Workflows (SOP)</h1>
          <p className="text-text-muted">Workflow templates and standard operating procedures.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
        >
          Add workflow template
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
                <th className="text-left px-4 py-3 text-sm font-medium">Category</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Description</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Active</th>
                <th className="text-left px-4 py-3 text-sm font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-navy-700">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                    No workflow templates yet. Add one to get started.
                  </td>
                </tr>
              ) : (
                templates.map((t) => (
                  <tr key={t.id} className="dark:hover:bg-navy-800/50">
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3">{t.category ?? '—'}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{t.description ?? '—'}</td>
                    <td className="px-4 py-3">{t.is_active !== false ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        className="text-primary-500 hover:underline text-sm mr-2"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(t)}
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
              {editingTemplate ? 'Edit workflow template' : 'Add workflow template'}
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
                <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary"
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="rounded border-navy-600"
                />
                <label htmlFor="is_active" className="text-sm text-text-primary">Active</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 rounded-lg text-sm">
                  {saving ? 'Saving...' : (editingTemplate ? 'Update' : 'Create')}
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
              Delete workflow template &quot;{deleteConfirm.name}&quot;? This cannot be undone.
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

export default Workflows;
export { Workflows };
