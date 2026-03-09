import { useEffect, useState } from 'react';
import api from '../lib/api';

export function RequirementTemplates() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', is_active: true, itemsText: '' });

  const loadList = () => {
    api.get('/admin/requirement-templates')
      .then(({ data }) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadList();
  }, []);

  const itemsToText = (arr) => (Array.isArray(arr) ? arr.join('\n') : '');
  const textToItems = (text) => (text || '').split('\n').map((s) => s.trim()).filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        is_active: form.is_active,
        items: textToItems(form.itemsText),
      };
      if (editing) {
        await api.put(`/admin/requirement-templates/${editing.id}`, payload);
      } else {
        await api.post('/admin/requirement-templates', payload);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', description: '', is_active: true, itemsText: '' });
      loadList();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (it) => {
    setEditing(it);
    setForm({
      name: it.name || '',
      description: it.description || '',
      is_active: !!it.is_active,
      itemsText: itemsToText(it.items),
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this requirement template?')) return;
    try {
      await api.delete(`/admin/requirement-templates/${id}`);
      setItems(items.filter((it) => it.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', is_active: true, itemsText: '' });
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">Requirement Templates</h1>
        <button className="btn-primary px-4 py-2" onClick={openCreate}>Add template</button>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-vsparkz bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <div className="p-8 text-center text-text-muted">Loading…</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800/50 text-left">
                <th className="px-5 py-3 text-text-muted font-medium">Name</th>
                <th className="px-5 py-3 text-text-muted font-medium">Description</th>
                <th className="px-5 py-3 text-text-muted font-medium">Active</th>
                <th className="px-5 py-3 text-text-muted font-medium">Items</th>
                <th className="px-5 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-text-muted text-center">No templates yet.</td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="border-t border-navy-600 dark:border-gray-600 hover:bg-navy-700/30">
                    <td className="px-5 py-3 dark:text-text-primary text-gray-900">{it.name}</td>
                    <td className="px-5 py-3 text-text-muted max-w-xs truncate">{it.description || '—'}</td>
                    <td className="px-5 py-3 text-text-muted">{it.is_active ? 'Yes' : 'No'}</td>
                    <td className="px-5 py-3 text-text-muted">{Array.isArray(it.items) ? it.items.length : 0}</td>
                    <td className="px-5 py-3">
                      <button type="button" className="text-accent hover:text-accent-bright mr-3" onClick={() => handleEdit(it)}>Edit</button>
                      <button type="button" className="text-accent-muted hover:text-accent-bright" onClick={() => handleDelete(it.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold dark:text-text-primary text-gray-900 mb-4">{editing ? 'Edit' : 'Add'} template</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Name</label>
                <input
                  className="w-full px-3 py-2 dark:bg-navy-800/80 bg-white border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 dark:bg-navy-800/80 bg-white border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Requirements (one per line)</label>
                <textarea
                  className="w-full px-3 py-2 dark:bg-navy-800/80 bg-white border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900"
                  rows={6}
                  placeholder="Brand guidelines&#10;Target audience&#10;Deliverables"
                  value={form.itemsText}
                  onChange={(e) => setForm({ ...form, itemsText: e.target.value })}
                />
              </div>
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="req-tpl-active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-navy-600"
                />
                <label htmlFor="req-tpl-active" className="text-sm text-text-muted">Active (show in Requirement handling)</label>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                <button
                  type="button"
                  className="px-4 py-2 border dark:border-navy-600 border-gray-200 rounded-vsparkz text-text-muted hover:text-text-primary"
                  onClick={() => { setShowModal(false); setEditing(null); }}
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
