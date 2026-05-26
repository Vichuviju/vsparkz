import { useEffect, useState } from 'react';
import api from '../lib/api';

export function InfluencerCategories() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '' });
  const [saving, setSaving] = useState(false);

  const fetchList = () => {
    setLoading(true);
    api.get('/admin/influencer-categories').then(({ data }) => {
      setList(data);
    }).catch((err) => setError(err.response?.data?.message || 'Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, []);

  const openCreate = () => {
    setModal('new');
    setForm({ name: '' });
  };
  const openEdit = (row) => {
    setModal(row.id);
    setForm({ name: row.name });
  };
  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'new') {
        await api.post('/admin/influencer-categories', form);
      } else {
        await api.put(`/admin/influencer-categories/${modal}`, form);
      }
      fetchList();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/admin/influencer-categories/${id}`);
      fetchList();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">Content Categories</h1>
        <button type="button" onClick={openCreate} className="btn-primary px-4 py-2 text-sm">Add Category</button>
      </div>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}
      <div className="glass-card overflow-hidden">
        {loading ? <div className="p-8 text-center text-text-muted">Loading…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="dark:bg-navy-800/50 bg-gray-50 text-left">
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Name</th>
                  <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={2} className="px-5 py-8 text-text-muted text-center">No categories yet</td></tr>
                ) : list.map((row) => (
                  <tr key={row.id} className="border-t dark:border-navy-600 border-gray-200 dark:hover:bg-navy-700/30 hover:bg-gray-50">
                    <td className="px-5 py-3 dark:text-text-primary text-gray-900 font-medium">{row.name}</td>
                    <td className="px-5 py-3">
                      <button type="button" onClick={() => openEdit(row)} className="text-accent hover:dark:text-accent-bright text-cyan-800 font-medium mr-2">Edit</button>
                      <button type="button" onClick={() => handleDelete(row.id)} className="text-accent-muted hover:dark:text-accent-bright text-cyan-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full p-6 border dark:border-navy-600 border-gray-200">
            <h2 className="text-lg font-semibold dark:text-text-primary text-gray-900 mb-4">{modal === 'new' ? 'Add Category' : 'Edit Category'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ name: e.target.value })} required className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
                <button type="button" onClick={closeModal} className="px-4 py-2 border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900 hover:bg-navy-700/80">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
