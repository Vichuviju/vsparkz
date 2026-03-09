import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';

const TASK_TYPES = ['seo', 'social', 'influencer', 'ads'];
const STATUS_OPTIONS = ['pending', 'in_progress', 'review', 'completed'];

const WORKFLOW_LABELS = {
  project_initialized: 'Project Initialized',
  requirement_gathering: 'Requirement Gathering',
  quotation_processing: 'Quotation Processing',
  quotation_generated: 'Quotation Generated',
  quotation_rejected: 'Quotation Rejected',
  quotation_resubmitted: 'Quotation Resubmitted',
  agreement_generation: 'Agreement Generation',
  agreement_rework: 'Agreement Rework',
  work_in_progress: 'Work in Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
};

export function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [taskForm, setTaskForm] = useState({ type: 'seo', title: '', status: 'pending', due_date: '', assigned_to: '' });
  const [saving, setSaving] = useState(false);
  const [workflowSaving, setWorkflowSaving] = useState(false);

  const fetchProject = () => {
    if (!id) return;
    setLoading(true);
    api.get(`/admin/projects/${id}`)
      .then(({ data }) => setProject(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load project'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProject();
    api.get('/admin/users').then(({ data }) => setUsers(Array.isArray(data) ? data : [])).catch(() => setUsers([]));
  }, [id]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!project?.id) return;
    setSaving(true);
    const payload = { ...taskForm, assigned_to: taskForm.assigned_to ? parseInt(taskForm.assigned_to, 10) : null, due_date: taskForm.due_date || null };
    try {
      await api.post(`/admin/projects/${project.id}/tasks`, payload);
      setTaskForm({ type: 'seo', title: '', status: 'pending', due_date: '', assigned_to: '' });
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add task');
    } finally {
      setSaving(false);
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      await api.put(`/admin/project-tasks/${taskId}`, updates);
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Remove this task?')) return;
    try {
      await api.delete(`/admin/project-tasks/${taskId}`);
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const setWorkflowStatus = async (workflowStatus) => {
    if (!project?.id) return;
    setWorkflowSaving(true);
    setError(null);
    try {
      await api.patch(`/admin/projects/${project.id}`, { workflow_status: workflowStatus });
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update workflow');
    } finally {
      setWorkflowSaving(false);
    }
  };

  if (loading && !project) return <div className="p-8 text-center text-text-muted">Loading…</div>;
  if (error && !project) return <div className="p-8"><div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright">{error}</div><Link to="/projects" className="text-accent hover:underline">Back to Projects</Link></div>;
  if (!project) return null;

  const tasks = project.project_tasks || project.projectTasks || [];

  return (
    <div>
      <div className="mb-6">
        <Link to="/projects" className="text-sm text-text-muted hover:text-accent mb-1 inline-block">← Projects</Link>
        <h1 className="text-2xl font-bold text-text-primary">{project.name}</h1>
        <p className="text-text-muted text-sm mt-1">Client: <Link to={`/clients/${project.client_id}`} className="text-accent hover:underline">{project.client?.company_name ?? project.client_id}</Link> · Status: <span className="inline-flex px-2 py-0.5 rounded text-xs bg-accent/20 text-accent">{project.status}</span> · Workflow: <span className="inline-flex px-2 py-0.5 rounded text-xs bg-navy-600 text-text-primary">{WORKFLOW_LABELS[project.workflow_status] ?? project.workflow_status}</span></p>
      </div>

      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}

      {project.workflow_status === 'requirement_gathering' && (
        <div className="glass-card p-4 mb-6 flex items-center justify-between">
          <span className="text-text-primary">Requirement gathering in progress. When done, move to quotation.</span>
          <button type="button" disabled={workflowSaving} onClick={() => setWorkflowStatus('quotation_processing')} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">Mark requirement completed</button>
        </div>
      )}

      {project.workflow_status === 'quotation_processing' && (
        <div className="glass-card p-4 mb-6 flex items-center justify-between">
          <span className="text-text-primary">Ready for quotation. Create a quotation for this project.</span>
          <Link to={`/quotations?project_id=${project.id}`} className="btn-primary px-4 py-2 text-sm">Create Quotation</Link>
        </div>
      )}

      <div className="glass-card p-6 mb-6">
        <h2 className="font-semibold text-text-primary mb-3">Details</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-text-muted">Campaign type</dt><dd className="text-text-primary">{project.campaign_type ?? '—'}</dd>
          <dt className="text-text-muted">Start</dt><dd className="text-text-primary">{project.start_date ? new Date(project.start_date).toLocaleDateString() : '—'}</dd>
          <dt className="text-text-muted">End</dt><dd className="text-text-primary">{project.end_date ? new Date(project.end_date).toLocaleDateString() : '—'}</dd>
        </dl>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-semibold text-text-primary mb-4">Tasks</h2>
        <form onSubmit={addTask} className="flex flex-wrap gap-2 mb-4 p-3 bg-navy-800/50 rounded-vsparkz">
          <input type="text" value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} placeholder="Task title" required className="flex-1 min-w-[120px] px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary text-sm" />
          <select value={taskForm.type} onChange={(e) => setTaskForm((f) => ({ ...f, type: e.target.value }))} className="px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary text-sm">
            {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={taskForm.status} onChange={(e) => setTaskForm((f) => ({ ...f, status: e.target.value }))} className="px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary text-sm">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm((f) => ({ ...f, due_date: e.target.value }))} className="px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary text-sm" />
          <select value={taskForm.assigned_to} onChange={(e) => setTaskForm((f) => ({ ...f, assigned_to: e.target.value }))} className="px-3 py-2 border border-navy-600 bg-navy-800/80 rounded-vsparkz text-text-primary text-sm">
            <option value="">Unassigned</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button type="submit" disabled={saving} className="btn-primary px-3 py-2 text-sm disabled:opacity-50">Add task</button>
        </form>
        <ul className="space-y-2">
          {tasks.length === 0 ? <li className="text-text-muted text-sm">No tasks yet.</li> : tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-2 p-2 border border-navy-600 rounded-vsparkz text-sm">
              <span className="font-medium text-text-primary flex-1">{t.title}</span>
              <span className="text-text-muted">{t.type}</span>
              <select value={t.status} onChange={(e) => updateTask(t.id, { status: e.target.value })} className="px-2 py-1 border border-navy-600 bg-navy-800/80 rounded text-xs text-text-primary">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="text-text-muted">{t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</span>
              <span className="text-text-muted">{t.assigned_to?.name ?? '—'}</span>
              <button type="button" onClick={() => deleteTask(t.id)} className="text-accent-muted hover:text-accent-bright text-xs">Remove</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
