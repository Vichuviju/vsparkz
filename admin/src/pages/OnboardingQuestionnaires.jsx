import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function OnboardingQuestionnaires() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false,
  });

  const fetchItems = () => {
    setLoading(true);
    api
      .get('/admin/onboarding-questionnaires')
      .then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setItems(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        setItems([]);
        setError('Failed to load onboarding questionnaires.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openAdd = () => {
    setModal('form');
    setEditingItem(null);
    setFormData({ name: '', description: '', is_default: false });
    setError(null);
  };

  const openEdit = (item) => {
    setModal('form');
    setEditingItem(item);
    setFormData({
      name: item.name ?? '',
      description: item.description ?? '',
      is_default: item.is_default ?? false,
    });
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      is_default: formData.is_default,
    };
    try {
      if (editingItem) {
        await api.put(`/admin/onboarding-questionnaires/${editingItem.id}`, payload);
      } else {
        await api.post('/admin/onboarding-questionnaires', payload);
      }
      fetchItems();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save questionnaire.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    setError(null);
    try {
      await api.delete(`/admin/onboarding-questionnaires/${id}`);
      fetchItems();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete questionnaire.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">Onboarding Questionnaires</h1>
          <p className="text-text-muted">Questionnaires for client onboarding.</p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">
          Add questionnaire
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
                <th className="text-left px-4 py-3 text-sm font-medium">Default</th>
                <th className="text-left px-4 py-3 text-sm font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-navy-700">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                    No onboarding questionnaires yet. Add one to get started.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="dark:hover:bg-navy-800/50">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{item.description ?? '—'}</td>
                    <td className="px-4 py-3">{item.is_default ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => openEdit(item)} className="text-primary-500 hover:underline text-sm mr-2">Edit</button>
                      <button type="button" onClick={() => setDeleteConfirm(item)} className="text-red-500 hover:underline text-sm">Delete</button>
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
            <h2 className="text-lg font-semibold text-text-primary mb-4">{editingItem ? 'Edit questionnaire' : 'Add questionnaire'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary" rows={3} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_default" checked={formData.is_default} onChange={(e) => setFormData((f) => ({ ...f, is_default: e.target.checked }))} className="rounded border-navy-600" />
                <label htmlFor="is_default" className="text-sm text-text-primary">Default questionnaire</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 rounded-lg text-sm">{saving ? 'Saving...' : (editingItem ? 'Update' : 'Create')}</button>
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg border dark:border-navy-600 text-text-primary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-text-primary mb-4">Delete questionnaire &quot;{deleteConfirm.name}&quot;? This cannot be undone.</p>
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

export default OnboardingQuestionnaires;
export { OnboardingQuestionnaires };
