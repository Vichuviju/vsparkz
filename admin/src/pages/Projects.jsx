import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';

const TASK_TYPES = ['seo', 'social', 'influencer', 'ads'];
const STATUS_OPTIONS = ['pending', 'in_progress', 'completed'];

export function Projects() {
  const location = useLocation();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [workflowFilter, setWorkflowFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [detailProject, setDetailProject] = useState(null);
  const [form, setForm] = useState({ client_id: '', service_id: '', name: '', campaign_type: '', status: 'active', stage: '', next_appointment_at: '', next_appointment_type: '', start_date: '', end_date: '' });
  const [taskForm, setTaskForm] = useState({ type: 'seo', title: '', status: 'pending', due_date: '', assigned_to: '' });
  const [saving, setSaving] = useState(false);

  const fetchList = (page = 1) => {
    setLoading(true);
    const params = { page, per_page: 15 };
    if (statusFilter) params.status = statusFilter;
    if (workflowFilter) params.workflow_status = workflowFilter;
    api.get('/admin/projects', { params }).then(({ data }) => {
      setList(data.data ?? data);
      setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total });
    }).catch((err) => setError(err.response?.data?.message || 'Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, [statusFilter, workflowFilter]);
  useEffect(() => {
    api.get('/admin/clients', { params: { per_page: 200 } }).then(({ data }) => setClients(data.data ?? data ?? [])).catch(() => setClients([]));
    api.get('/admin/services', { params: { per_page: 200 } }).then(({ data }) => setServices(data.data ?? data ?? [])).catch(() => setServices([]));
    api.get('/admin/users').then(({ data }) => setUsers(Array.isArray(data) ? data : [])).catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    const clientId = location.state?.clientId;
    if (clientId != null && clientId !== '') {
      setModal('new');
      setForm((f) => ({ ...f, client_id: String(clientId) }));
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  const openCreate = (presetClientId = '') => {
    setModal('new');
    setForm({ client_id: presetClientId, service_id: '', name: '', campaign_type: '', status: 'active', stage: '', next_appointment_at: '', next_appointment_type: '', start_date: '', end_date: '' });
  };
  const openEdit = (row) => {
    setModal(row.id);
    setForm({
      client_id: row.client_id ?? '',
      service_id: row.service_id ?? '',
      name: row.name ?? '',
      campaign_type: row.campaign_type ?? '',
      status: row.status ?? 'active',
      stage: row.stage ?? '',
      next_appointment_at: row.next_appointment_at ? (row.next_appointment_at.slice && row.next_appointment_at.slice(0, 16)) : '',
      next_appointment_type: row.next_appointment_type ?? '',
      start_date: row.start_date ? row.start_date.slice(0, 10) : '',
      end_date: row.end_date ? row.end_date.slice(0, 10) : '',
    });
  };
  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      client_id: parseInt(form.client_id, 10) || null,
      service_id: form.service_id ? parseInt(form.service_id, 10) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      next_appointment_at: form.next_appointment_at ? form.next_appointment_at.slice(0, 10) + (form.next_appointment_at.length > 10 ? form.next_appointment_at.slice(10) : '') : null,
    };
    try {
      if (modal === 'new') await api.post('/admin/projects', payload);
      else await api.put(`/admin/projects/${modal}`, payload);
      fetchList();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    try {
      await api.delete(`/admin/projects/${id}`);
      if (detailProject?.id === id) setDetailProject(null);
      fetchList();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const openDetail = (project) => {
    api.get(`/admin/projects/${project.id}`).then(({ data }) => setDetailProject(data)).catch(() => setError('Failed to load project'));
  };
  const closeDetail = () => setDetailProject(null);

  const refreshDetail = () => {
    if (detailProject?.id) {
      api.get(`/admin/projects/${detailProject.id}`).then(({ data }) => setDetailProject(data)).catch(() => {});
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!detailProject?.id) return;
    setSaving(true);
    const payload = { ...taskForm, assigned_to: taskForm.assigned_to ? parseInt(taskForm.assigned_to, 10) : null, due_date: taskForm.due_date || null };
    try {
      await api.post(`/admin/projects/${detailProject.id}/tasks`, payload);
      setTaskForm({ type: 'seo', title: '', status: 'pending', due_date: '', assigned_to: '' });
      refreshDetail();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add task');
    } finally {
      setSaving(false);
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      await api.put(`/admin/project-tasks/${taskId}`, updates);
      refreshDetail();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/admin/project-tasks/${taskId}`);
      refreshDetail();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
        <div className="flex gap-2 flex-wrap">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary text-sm">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On hold</option>
          </select>
          <select value={workflowFilter} onChange={(e) => setWorkflowFilter(e.target.value)} className="px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary text-sm">
            <option value="">All workflow</option>
            <option value="project_initialized">Project Initialized</option>
            <option value="requirement_gathering">Requirement Gathering</option>
            <option value="quotation_processing">Quotation Processing</option>
            <option value="quotation_generated">Quotation Generated</option>
            <option value="work_in_progress">Work In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button type="button" onClick={() => openCreate('')} className="btn-primary px-4 py-2 text-sm">Add project</button>
        </div>
      </div>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}
      {loading ? <div className="p-8 text-center text-text-muted">Loading…</div> : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800/50 text-left">
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Name</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Client</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Service</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Type</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Status</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Dates</th>
                <th className="px-5 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 dark:text-text-muted text-gray-500 text-center">No projects yet</td></tr>
              ) : list.map((row) => (
                <tr key={row.id} className="border-t dark:border-navy-600 border-gray-100 dark:hover:bg-navy-700/30 hover:bg-gray-50">
                  <td className="px-5 py-3 dark:text-text-primary text-gray-900 font-medium">{row.name}</td>
                  <td className="px-5 py-3 dark:text-text-muted text-gray-500">{row.client?.company_name ?? '—'}</td>
                  <td className="px-5 py-3 dark:text-text-muted text-gray-500">{row.service?.title ?? '—'}</td>
                  <td className="px-5 py-3 dark:text-text-muted text-gray-500">{row.campaign_type ?? '—'}</td>
                  <td className="px-5 py-3"><span className="inline-flex px-2 py-0.5 rounded text-xs bg-accent/20 text-accent">{row.workflow_status ? row.workflow_status.replace(/_/g, ' ') : row.status}</span></td>
                  <td className="px-5 py-3 text-text-muted">{row.start_date ? new Date(row.start_date).toLocaleDateString() : '—'} – {row.end_date ? new Date(row.end_date).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3">
                    <Link to={`/projects/${row.id}`} className="text-accent hover:text-accent-bright font-medium mr-2">View</Link>
                    <button type="button" onClick={() => openDetail(row)} className="text-accent hover:text-accent-bright mr-2">Panel</button>
                    <button type="button" onClick={() => openEdit(row)} className="text-accent hover:text-accent-bright mr-2">Edit</button>
                    <button type="button" onClick={() => handleDelete(row.id)} className="text-accent-muted hover:text-accent-bright">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {meta.last_page > 1 && (
            <div className="px-5 py-3 border-t border-navy-600 flex justify-between items-center text-sm text-text-muted">
              <span>Page {meta.current_page} of {meta.last_page} ({meta.total} total)</span>
              <div className="flex gap-2">
                <button type="button" disabled={meta.current_page <= 1} onClick={() => fetchList(meta.current_page - 1)} className="px-3 py-1 rounded-vsparkz border border-navy-600 bg-navy-800/80 text-text-primary disabled:opacity-50">Previous</button>
                <button type="button" disabled={meta.current_page >= meta.last_page} onClick={() => fetchList(meta.current_page + 1)} className="px-3 py-1 rounded-vsparkz border border-navy-600 bg-navy-800/80 text-text-primary disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-card max-w-lg w-full p-6 my-8 border border-navy-600">
            <h2 className="text-lg font-semibold text-text-primary mb-4">{modal === 'new' ? 'Add project' : 'Edit project'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Client *</label><select value={form.client_id} onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))} required className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900"><option value="">— Select —</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}</select></div>
              <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Service</label><select value={form.service_id} onChange={(e) => setForm((f) => ({ ...f, service_id: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900"><option value="">— None —</option>{services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select></div>
              <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Name *</label><input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
              <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Campaign type</label><input type="text" value={form.campaign_type} onChange={(e) => setForm((f) => ({ ...f, campaign_type: e.target.value }))} placeholder="e.g. SEO, SMM" className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Stage</label><input type="text" value={form.stage} onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))} placeholder="e.g. Requirement, Execution" className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Status</label><select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900"><option value="active">Active</option><option value="completed">Completed</option><option value="on_hold">On hold</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Start date</label><input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">End date</label><input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Next appointment</label><input type="datetime-local" value={form.next_appointment_at} onChange={(e) => setForm((f) => ({ ...f, next_appointment_at: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
                <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Appointment type</label><input type="text" value={form.next_appointment_type} onChange={(e) => setForm((f) => ({ ...f, next_appointment_type: e.target.value }))} placeholder="e.g. Requirement call, Meet" className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" /></div>
              </div>
              <div className="flex gap-2 pt-2"><button type="submit" disabled={saving} className="btn-primary px-4 py-2 disabled:opacity-50">Save</button><button type="button" onClick={closeModal} className="px-4 py-2 border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900 dark:hover:bg-navy-700/80 hover:bg-gray-100">Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {detailProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-slate-800">{detailProject.name}</h2>
              <button type="button" onClick={closeDetail} className="text-slate-500 hover:text-slate-700">×</button>
            </div>
            <p className="text-slate-600 text-sm mb-4">Client: {detailProject.client?.company_name ?? '—'} · Status: {detailProject.status}</p>
            <h3 className="font-medium text-text-primary mb-2">Tasks</h3>
            <form onSubmit={addTask} className="flex flex-wrap gap-2 mb-4 p-3 bg-navy-800/50 rounded-vsparkz">
              <input type="text" value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} placeholder="Task title" required className="flex-1 min-w-[120px] px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary text-sm" />
              <select value={taskForm.type} onChange={(e) => setTaskForm((f) => ({ ...f, type: e.target.value }))} className="px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary text-sm">
                {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm((f) => ({ ...f, due_date: e.target.value }))} className="px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary text-sm" />
              <select value={taskForm.assigned_to} onChange={(e) => setTaskForm((f) => ({ ...f, assigned_to: e.target.value }))} className="px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary text-sm">
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <button type="submit" disabled={saving} className="btn-primary px-3 py-2 text-sm disabled:opacity-50">Add task</button>
            </form>
            <ul className="space-y-2">
              {(detailProject.project_tasks || []).length === 0 ? <li className="text-text-muted text-sm">No tasks yet.</li> : detailProject.project_tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2 p-2 border border-navy-600 rounded-vsparkz text-sm">
                  <span className="font-medium text-text-primary flex-1">{t.title}</span>
                  <span className="text-text-muted">{t.type}</span>
                  <select value={t.status} onChange={(e) => updateTask(t.id, { status: e.target.value })} className="px-2 py-1 border border-navy-600 bg-navy-800/80 rounded text-xs text-text-primary">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className="text-text-muted">{t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</span>
                  <span className="text-text-muted">{t.assigned_to?.name ?? '—'}</span>
                  <button type="button" onClick={() => deleteTask(t.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
