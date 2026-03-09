import { useState, useEffect } from 'react';
import { api } from '../lib/api';

function AutomationWorkflows() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    is_active: true,
  });

  const fetchWorkflows = () => {
    setLoading(true);
    api
      .get('/admin/automation-workflows')
      .then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setWorkflows(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        setWorkflows([]);
        setError('Failed to load automation workflows.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const openAdd = () => {
    setModal('form');
    setEditingWorkflow(null);
    setForm({ name: '', description: '', is_active: true });
    setError(null);
  };

  const openEdit = (w) => {
    setModal('form');
    setEditingWorkflow(w);
    setForm({
      name: w.name ?? '',
      description: w.description ?? '',
      is_active: w.is_active !== false,
    });
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditingWorkflow(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      is_active: form.is_active,
    };
    try {
      if (editingWorkflow) {
        await api.put(`/admin/automation-workflows/${editingWorkflow.id}`, payload);
      } else {
        await api.post('/admin/automation-workflows', payload);
      }
      fetchWorkflows();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save automation workflow.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    setError(null);
    try {
      await api.delete(`/admin/automation-workflows/${id}`);
      fetchWorkflows();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete automation workflow.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">Automation Workflows</h1>
          <p className="text-text-muted">Event-driven automation workflows.</p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">
          Add workflow
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
                <th className="text-left px-4 py-3 text-sm font-medium">Active</th>
                <th className="text-left px-4 py-3 text-sm font-medium w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-navy-700">
              {workflows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                    No automation workflows yet. Add one to get started.
                  </td>
                </tr>
              ) : (
                workflows.map((w) => (
                  <tr key={w.id} className="dark:hover:bg-navy-800/50">
                    <td className="px-4 py-3 font-medium">{w.name}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{w.description ?? '—'}</td>
                    <td className="px-4 py-3">{w.is_active !== false ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => openEdit(w)} className="text-primary-500 hover:underline text-sm mr-2">Edit</button>
                      <button type="button" onClick={() => setDeleteConfirm(w)} className="text-red-500 hover:underline text-sm">Delete</button>
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
            <h2 className="text-lg font-semibold text-text-primary mb-4">{editingWorkflow ? 'Edit workflow' : 'Add workflow'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg border dark:border-navy-600 dark:bg-navy-800 text-text-primary" rows={3} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded border-navy-600" />
                <label htmlFor="is_active" className="text-sm text-text-primary">Active</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 rounded-lg text-sm">{saving ? 'Saving...' : (editingWorkflow ? 'Update' : 'Create')}</button>
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg border dark:border-navy-600 text-text-primary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-text-primary mb-4">Delete workflow &quot;{deleteConfirm.name}&quot;? This cannot be undone.</p>
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

export default AutomationWorkflows;
export { AutomationWorkflows };
