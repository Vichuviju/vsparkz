import { useEffect, useState } from 'react';
import api from '../lib/api';

export function TasksHR() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', assignee_id: '', due_date: '', status: 'pending', project_id: '' });
  const [saving, setSaving] = useState(false);

  const fetchTasks = () => {
    setLoading(true);
    const params = statusFilter ? { status: statusFilter } : {};
    api.get('/admin/tasks', { params }).then(({ data }) => setTasks(data.data ?? data ?? [])).catch((err) => setError(err.response?.data?.message || 'Failed to load')).finally(() => setLoading(false));
  };
  useEffect(() => { fetchTasks(); }, [statusFilter]);
  useEffect(() => { api.get('/admin/users').then(({ data }) => setUsers(Array.isArray(data) ? data : [])).catch(() => setUsers([])); }, []);

  const openCreate = () => { setModal('new'); setForm({ title: '', description: '', assignee_id: '', due_date: '', status: 'pending', project_id: '' }); };
  const openEdit = (row) => { setModal(row.id); setForm({ title: row.title ?? '', description: row.description ?? '', assignee_id: row.assignee_id ?? '', due_date: row.due_date ? row.due_date.slice(0, 10) : '', status: row.status ?? 'pending', project_id: row.project_id ?? '' }); };
  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, assignee_id: form.assignee_id ? parseInt(form.assignee_id, 10) : null, project_id: form.project_id ? parseInt(form.project_id, 10) : null, due_date: form.due_date || null };
    try {
      if (modal === 'new') await api.post('/admin/tasks', payload);
      else await api.put(`/admin/tasks/${modal}`, payload);
      fetchTasks();
      closeModal();
    } catch (err) { setError(err.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
  };

  const updateStatus = (id, status) => {
    api.put(`/admin/tasks/${id}`, { status }).then(() => fetchTasks()).catch(() => setError('Failed to update'));
  };

  const handleDelete = async (id) => { if (!confirm('Delete this task?')) return; try { await api.delete(`/admin/tasks/${id}`); fetchTasks(); } catch (err) { setError(err.response?.data?.message || 'Failed'); } };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Tasks</h1>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm"><option value="">All</option><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select>
          <button type="button" onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">Add task</button>
        </div>
      </div>
      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
      {loading ? <div className="p-8 text-center text-slate-500">Loading…</div> : (
        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-left"><th className="px-5 py-3 text-slate-600 font-medium">Title</th><th className="px-5 py-3 text-slate-600 font-medium">Assignee</th><th className="px-5 py-3 text-slate-600 font-medium">Due</th><th className="px-5 py-3 text-slate-600 font-medium">Status</th><th className="px-5 py-3 text-slate-600 font-medium">Actions</th></tr></thead>
            <tbody>
              {tasks.length === 0 ? <tr><td colSpan={5} className="px-5 py-8 text-slate-500 text-center">No tasks yet</td></tr> : tasks.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-800 font-medium">{row.title}</td>
                  <td className="px-5 py-3 text-slate-600">{row.assignee?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-500">{row.due_date ? new Date(row.due_date).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3"><select value={row.status} onChange={(e) => updateStatus(row.id, e.target.value)} className="text-xs rounded px-2 py-1 border border-slate-300"><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></td>
                  <td className="px-5 py-3"><button type="button" onClick={() => openEdit(row)} className="text-indigo-600 hover:underline mr-2">Edit</button><button type="button" onClick={() => handleDelete(row.id)} className="text-red-600 hover:underline">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 my-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">{modal === 'new' ? 'Add task' : 'Edit task'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Title *</label><input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Assignee</label><select value={form.assignee_id} onChange={(e) => setForm((f) => ({ ...f, assignee_id: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg"><option value="">—</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Due date</label><input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg"><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></div>
              </div>
              <div className="flex gap-2 pt-2"><button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Save</button><button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
