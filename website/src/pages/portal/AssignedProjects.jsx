import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const TASK_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' },
];

export default function AssignedProjects() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateType, setUpdateType] = useState('comment');
  const [updateContent, setUpdateContent] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchProjects = () => {
    api.get('/portal/assigned-projects')
      .then(({ data }) => setProjects(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openProject = (project) => {
    setSelected(null);
    api.get(`/portal/assigned-projects/${project.id}`)
      .then(({ data }) => setSelected(data))
      .catch(() => setError('Failed to load project'));
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await api.patch(`/portal/project-tasks/${taskId}`, { status });
      if (selected) openProject(selected);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const submitTaskUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTaskId || !updateContent.trim()) return;
    setSaving(true);
    try {
      await api.post('/portal/task-updates', {
        project_task_id: selectedTaskId,
        type: updateType,
        content: updateContent.trim(),
      });
      setUpdateContent('');
      setSelectedTaskId(null);
      if (selected) openProject(selected);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted">Loading…</div>;
  if (error) return <div className="p-8"><div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Assigned Projects</h1>
      {projects.length === 0 ? (
        <p className="text-text-muted">No assigned projects.</p>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <div key={p.id} className="p-4 rounded-lg border border-navy-600 bg-navy-800/30 hover:bg-navy-800/50">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-text-primary">{p.name}</h2>
                  <p className="text-sm text-text-muted">{p.client?.company_name ?? '—'}</p>
                </div>
                <button type="button" onClick={() => openProject(p)} className="text-accent hover:underline text-sm">View tasks</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-900 border border-navy-600 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-5 border-b border-navy-600 flex justify-between items-start">
              <h2 className="text-lg font-bold text-text-primary">{selected.name}</h2>
              <button type="button" onClick={() => setSelected(null)} className="text-text-muted hover:text-text-primary">×</button>
            </div>
            <div className="p-5">
              <p className="text-sm text-text-muted mb-4">Client: {selected.client?.company_name ?? '—'}</p>
              <h3 className="font-medium text-text-primary mb-2">Tasks</h3>
              <ul className="space-y-3">
                {(selected.project_tasks || selected.projectTasks || []).map((t) => (
                  <li key={t.id} className="p-3 bg-navy-800/50 rounded-lg">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <span className="font-medium text-text-primary">{t.title}</span>
                      <select value={t.status} onChange={(e) => updateTaskStatus(t.id, e.target.value)} className="px-2 py-1 bg-navy-800 border border-navy-600 rounded text-text-primary text-sm">
                        {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <p className="text-xs text-text-muted mt-1">Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</p>
                    <button type="button" onClick={() => setSelectedTaskId(t.id)} className="mt-2 text-accent hover:underline text-sm">Add update / comment</button>
                    {(t.task_updates || t.taskUpdates || []).length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-text-muted">
                        {(t.task_updates || t.taskUpdates).slice(0, 3).map((u) => (
                          <li key={u.id}>{u.type}: {u.content?.slice(0, 60)}{u.content?.length > 60 ? '…' : ''}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {selectedTaskId && (
              <form onSubmit={submitTaskUpdate} className="p-5 border-t border-navy-600">
                <h4 className="text-sm font-medium text-text-primary mb-2">Add update</h4>
                <select value={updateType} onChange={(e) => setUpdateType(e.target.value)} className="mb-2 w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-text-primary text-sm">
                  <option value="comment">Comment</option>
                  <option value="work_update">Work update</option>
                  <option value="question">Question</option>
                </select>
                <textarea value={updateContent} onChange={(e) => setUpdateContent(e.target.value)} className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-text-primary text-sm" rows={3} placeholder="Your update..." required />
                <div className="flex gap-2 mt-2">
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-accent text-white text-sm disabled:opacity-50">Submit</button>
                  <button type="button" onClick={() => { setSelectedTaskId(null); setUpdateContent(''); }} className="px-4 py-2 rounded-lg border border-navy-600 text-text-muted text-sm">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
