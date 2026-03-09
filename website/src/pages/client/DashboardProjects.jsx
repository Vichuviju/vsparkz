import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const WORKFLOW_LABELS = {
  project_initialized: 'Awaiting your approval',
  requirement_gathering: 'Requirement gathering',
  quotation_processing: 'Quotation in progress',
  quotation_generated: 'Quotation generated',
  quotation_rejected: 'Quotation rejected',
  quotation_resubmitted: 'Quotation resubmitted',
  agreement_generation: 'Agreement in progress',
  agreement_rework: 'Agreement rework',
  work_in_progress: 'Work in progress',
  completed: 'Completed',
  on_hold: 'On hold',
  cancelled: 'Cancelled',
};

export default function DashboardProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionProject, setActionProject] = useState(null);
  const [action, setAction] = useState(null);
  const [meetingScheduledAt, setMeetingScheduledAt] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    api.get('/client/projects')
      .then(({ data }) => setProjects(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load projects'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleApprove = (project) => {
    setActionProject(project);
    setAction('approve');
    setMeetingScheduledAt('');
    setMeetingNotes('');
  };

  const handleReject = (project) => {
    setActionProject(project);
    setAction('reject');
    setRejectReason('');
  };

  const submitAction = async (e) => {
    e.preventDefault();
    if (!actionProject) return;
    setSaving(true);
    const payload = {
      action,
      meeting_scheduled_at: action === 'approve' ? (meetingScheduledAt || null) : undefined,
      meeting_notes: action === 'approve' ? meetingNotes : undefined,
      reject_reason: action === 'reject' ? rejectReason : undefined,
    };
    try {
      await api.patch(`/client/projects/${actionProject.id}`, payload);
      setActionProject(null);
      setAction(null);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setActionProject(null);
    setAction(null);
    setMeetingScheduledAt('');
    setMeetingNotes('');
    setRejectReason('');
  };

  if (loading) return <div className="text-text-muted">Loading projects…</div>;
  if (error && projects.length === 0) return <div className="p-4 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright">{error}</div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Active Projects</h1>
      <p className="text-text-muted mb-6">View and approve projects. Once approved, the project moves to requirement gathering.</p>

      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}

      {projects.length === 0 ? (
        <div className="glass-card p-8 text-center text-text-muted">No projects yet. Projects will appear here when your account is assigned one.</div>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <div key={p.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-text-primary">{p.name}</h2>
                <p className="text-sm text-text-muted mt-1">{WORKFLOW_LABELS[p.workflow_status] ?? p.workflow_status?.replace(/_/g, ' ') ?? '—'}</p>
                {p.meetings?.length > 0 && (
                  <p className="text-xs text-text-muted mt-1">
                    Next meeting: {new Date(p.meetings[0].scheduled_at).toLocaleString()}
                  </p>
                )}
              </div>
              {p.workflow_status === 'project_initialized' && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleApprove(p)} className="rounded-vsparkz px-4 py-2 text-sm font-medium bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors">Approve</button>
                  <button type="button" onClick={() => handleReject(p)} className="rounded-vsparkz px-4 py-2 text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {actionProject && (action === 'approve' || action === 'reject') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{action === 'approve' ? 'Approve project' : 'Reject project'}</h3>
            <p className="text-text-muted text-sm mb-4">{actionProject.name}</p>
            <form onSubmit={submitAction} className="space-y-4">
              {action === 'approve' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Requirement meeting date (optional)</label>
                    <input
                      type="datetime-local"
                      value={meetingScheduledAt}
                      onChange={(e) => setMeetingScheduledAt(e.target.value)}
                      className="w-full rounded-vsparkz border border-surface-border bg-navy-800/80 px-4 py-2 text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Meeting notes (optional)</label>
                    <textarea
                      value={meetingNotes}
                      onChange={(e) => setMeetingNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-vsparkz border border-surface-border bg-navy-800/80 px-4 py-2 text-text-primary"
                    />
                  </div>
                </>
              )}
              {action === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Reason (optional)</label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection"
                    className="w-full rounded-vsparkz border border-surface-border bg-navy-800/80 px-4 py-2 text-text-primary"
                  />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                  {saving ? 'Saving…' : action === 'approve' ? 'Approve' : 'Reject'}
                </button>
                <button type="button" onClick={closeModal} className="rounded-vsparkz px-4 py-2 text-sm border border-surface-border text-text-muted hover:text-text-primary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
