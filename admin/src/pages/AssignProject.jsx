import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const ROLES = [
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'employee', label: 'Employee' },
];

export function AssignProject() {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [project, setProject] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [description, setDescription] = useState('');
  const [timeline, setTimeline] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/admin/clients', { params: { per_page: 500 } }).then((r) => setClients(Array.isArray(r.data) ? r.data : (r.data?.data ?? []))),
      api.get('/admin/users').then((r) => setUsers(Array.isArray(r.data) ? r.data : (r.data?.data ?? []))),
      api.get('/admin/freelancers', { params: { per_page: 500 } }).then((r) => setFreelancers(Array.isArray(r.data) ? r.data : (r.data?.data ?? []))),
    ]).catch(() => setError('Failed to load clients, users, or freelancers'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!clientId) {
      setProjects([]);
      setProjectId('');
      return;
    }
    api.get('/admin/projects', { params: { client_id: clientId, per_page: 100 } })
      .then((r) => setProjects(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
      .catch(() => setProjects([]));
    setProjectId('');
  }, [clientId]);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setAssignments([]);
      return;
    }
    api.get(`/admin/projects/${projectId}`)
      .then(({ data }) => setProject(data))
      .catch(() => setProject(null));
    api.get('/admin/project-assignments', { params: { project_id: projectId } })
      .then(({ data }) => setAssignments(Array.isArray(data) ? data : []))
      .catch(() => setAssignments([]));
  }, [projectId]);

  const newRows = assignments.filter((a) => !a.id);
  const existingAssignments = assignments.filter((a) => a.id);

  const addRow = () => {
    setAssignments((prev) => [...prev, { role: 'freelancer', assignable_type: 'freelancer', assignable_id: '', client_requirement_description: description, timeline }]);
  };

  const updateRow = (idx, field, value) => {
    setAssignments((prev) => {
      const updated = prev.map((r, i) => {
        if (i !== idx) return r;
        const next = { ...r, [field]: value };
        if (field === 'role') {
          next.assignable_type = next.role === 'project_manager' || next.role === 'employee' ? 'user' : 'freelancer';
          next.assignable_id = '';
        }
        return next;
      });
      return updated;
    });
  };

  const removeRow = (idx) => {
    const target = assignments[idx];
    if (target?.id) return;
    setAssignments((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!projectId) return;
    const toCreate = newRows.filter((a) => a.assignable_id && a.role).map((a) => ({ ...a, assignable_type: a.role === 'project_manager' || a.role === 'employee' ? 'user' : 'freelancer' }));
    if (toCreate.length === 0) {
      setError('Add at least one assignment with a selected person.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = toCreate.map((a) => ({
        project_id: parseInt(projectId, 10),
        assignable_type: a.role === 'project_manager' || a.role === 'employee' ? 'user' : 'freelancer',
        assignable_id: parseInt(a.assignable_id, 10),
        role: a.role,
        client_requirement_description: a.client_requirement_description || description || null,
        timeline: a.timeline || timeline || null,
      }));
      await api.post('/admin/project-assignments/bulk', { assignments: payload });
      setError(null);
      const { data } = await api.get('/admin/project-assignments', { params: { project_id: projectId } });
      setAssignments(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (err) {
      const d = err.response?.data;
      let msg = d?.message;
      if (!msg && d?.errors) {
        const firstKey = Object.keys(d.errors)[0];
        const firstVal = firstKey ? d.errors[firstKey] : null;
        msg = Array.isArray(firstVal) ? firstVal[0] : firstVal;
      }
      setError(typeof msg === 'string' ? msg : 'Failed to save assignments');
    } finally {
      setSaving(false);
    }
  };

  const deleteAssignment = async (id) => {
    try {
      await api.delete(`/admin/project-assignments/${id}`);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove');
    }
  };


  if (loading) return <div className="p-8 text-center text-text-muted">Loading…</div>;

  return (
    <div>
      <div className="mb-6">
        <Link to="/projects" className="text-sm text-text-muted hover:text-accent mb-1 inline-block">← Projects</Link>
        <h1 className="text-2xl font-bold text-text-primary">Assign Project</h1>
      </div>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}

      <div className="glass-card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Client</label>
            <select className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Project</label>
            <select className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={!clientId}>
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.workflow_status ?? p.status})</option>
              ))}
            </select>
          </div>
        </div>
        {project && (
          <p className="text-sm text-text-muted">Project: <span className="text-text-primary">{project.name}</span> · Workflow: {project.workflow_status}</p>
        )}
      </div>

      {projectId && (
        <div className="glass-card p-6">
          <h2 className="font-semibold text-text-primary mb-4">Assignments</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-muted mb-1">Client requirement (default for all)</label>
            <textarea className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary text-sm" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Description of client requirements" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-muted mb-1">Timeline (default)</label>
            <input type="text" className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary text-sm" value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="e.g. 4 weeks" />
          </div>

          {existingAssignments.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-text-muted mb-2">Current assignments</h3>
              <ul className="space-y-2">
                {existingAssignments.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-sm">
                    <span className="text-text-primary">{a.role}</span>
                    <span className="text-text-muted">—</span>
                    <span>{a.assignable?.name ?? a.assignable_id}</span>
                    <button type="button" onClick={() => deleteAssignment(a.id)} className="text-accent-muted hover:text-accent-bright text-xs">Remove</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h3 className="text-sm font-medium text-text-muted mb-2">Add assignments</h3>
          {newRows.map((row, newIdx) => {
            const gIdx = assignments.indexOf(row);
            return (
            <div key={`new-${newIdx}-${gIdx}`} className="flex flex-wrap gap-2 items-center mb-2 p-2 bg-navy-800/50 rounded-vsparkz">
              <select className="w-40 px-2 py-1.5 bg-navy-800/80 border border-navy-600 rounded text-text-primary text-sm" value={row.role} onChange={(e) => updateRow(gIdx, 'role', e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {(row.role === 'project_manager' || row.role === 'employee') ? (
                <select className="min-w-[160px] px-2 py-1.5 bg-navy-800/80 border border-navy-600 rounded text-text-primary text-sm" value={row.assignable_id} onChange={(e) => updateRow(gIdx, 'assignable_id', e.target.value)}>
                  <option value="">Select user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              ) : (
                <select className="min-w-[160px] px-2 py-1.5 bg-navy-800/80 border border-navy-600 rounded text-text-primary text-sm" value={row.assignable_id} onChange={(e) => updateRow(gIdx, 'assignable_id', e.target.value)}>
                  <option value="">Select freelancer</option>
                  {freelancers.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}
              <input type="text" className="w-28 px-2 py-1.5 bg-navy-800/80 border border-navy-600 rounded text-text-primary text-sm" value={row.timeline || ''} onChange={(e) => updateRow(gIdx, 'timeline', e.target.value)} placeholder="Timeline" />
              <button type="button" onClick={() => removeRow(gIdx)} className="text-accent-muted hover:text-accent-bright text-sm">Remove</button>
            </div>
          );})}
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={addRow} className="btn-primary px-3 py-2 text-sm">+ Add assignment</button>
            <button type="button" onClick={submit} disabled={saving} className="px-4 py-2 rounded-vsparkz bg-green-600 text-white text-sm disabled:opacity-50">Save assignments</button>
          </div>
        </div>
      )}
    </div>
  );
}
