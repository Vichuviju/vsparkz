import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';

// Status badge component
function StatusBadge({ status }) {
  const colors = {
    new: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    hold: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    follow_back: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-300',
    converted: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  };
  return (
    <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-medium ${colors[status] || colors.new}`}>
      {status?.replace('_', ' ') || 'new'}
    </span>
  );
}

export function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [activityType, setActivityType] = useState('comment');
  const [activityContent, setActivityContent] = useState('');
  const [convertNextStep, setConvertNextStep] = useState('');
  const [convertNextStepDate, setConvertNextStepDate] = useState('');

  useEffect(() => {
    api.get(`/admin/leads/${id}`).then(({ data }) => {
      setLead(data);
      setNotes(data.notes ?? '');
      setFollowUpDate(data.follow_up_date ? data.follow_up_date.slice(0, 10) : '');
      setSelectedStatus(data.status ?? 'new');
    }).catch((err) => setError(err.response?.data?.message || 'Failed to load lead')).finally(() => setLoading(false));
    api.get('/admin/users').then(({ data }) => setUsers(Array.isArray(data) ? data : [])).catch(() => setUsers([]));
  }, [id]);

  const handleSaveNotes = async (e) => {
    e.preventDefault();
    setSaving(true);
    api.put(`/admin/leads/${id}`, { notes }).then(({ data }) => setLead(data)).catch(() => setError('Failed to save notes')).finally(() => setSaving(false));
  };

  const applyStatusChange = () => {
    setSaving(true);
    api.put(`/admin/leads/${id}`, { status: selectedStatus, status_note: statusNote || undefined }).then(({ data }) => {
      setLead(data);
      setSelectedStatus(data.status);
      setStatusNote('');
    }).catch(() => setError('Failed to update status')).finally(() => setSaving(false));
  };

  const updateAssignee = (assigned_to) => {
    const val = assigned_to === '' ? null : parseInt(assigned_to, 10);
    setSaving(true);
    api.put(`/admin/leads/${id}`, { assigned_to: val }).then(({ data }) => setLead(data)).catch(() => setError('Failed to update assignee')).finally(() => setSaving(false));
  };

  const updateFollowUp = (e) => {
    const val = e.target.value;
    setFollowUpDate(val);
    setSaving(true);
    api.put(`/admin/leads/${id}`, { follow_up_date: val || null }).then(({ data }) => setLead(data)).catch(() => setError('Failed to update follow-up')).finally(() => setSaving(false));
  };

  const setDoNotCall = (checked) => {
    setSaving(true);
    api.put(`/admin/leads/${id}`, { do_not_call: checked }).then(({ data }) => setLead(data)).catch(() => setError('Failed to update')).finally(() => setSaving(false));
  };

  const handleConvertToClient = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post(`/admin/leads/${id}/convert-to-client`, {
        next_step: convertNextStep || undefined,
        next_step_date: convertNextStepDate || undefined,
      });
      setLead(data.lead);
      if (data.client?.id) {
        navigate('/projects', { state: { clientId: data.client.id } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Convert failed');
    } finally {
      setSaving(false);
    }
  };

  const addActivity = async (e) => {
    e.preventDefault();
    if (!activityContent.trim()) return;
    setSaving(true);
    try {
      await api.post(`/admin/leads/${id}/activities`, { type: activityType, content: activityContent.trim() });
      const { data } = await api.get(`/admin/leads/${id}`);
      setLead(data);
      setActivityContent('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add activity');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-accent/30 border-t-accent" />
        <p className="mt-4 text-sm dark:text-text-muted text-gray-500">Loading lead details…</p>
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-6 text-rose-700 dark:text-rose-300">
            <h3 className="text-lg font-semibold mb-2">Error Loading Lead</h3>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => navigate('/leads')}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/leads')}
          className="group inline-flex items-center gap-2 text-sm dark:text-text-muted text-gray-500 hover:text-accent transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7" />
          </svg>
          Back to Leads
        </button>
        <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">Lead Details</h1>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-4 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="p-1 rounded hover:bg-rose-500/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Main Lead Information Card */}
        <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white shadow-lg dark:shadow-glass shadow-light">
          {/* Header */}
          <div className="border-b dark:border-navy-600 border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-accent">
                    {lead?.name?.charAt(0)?.toUpperCase() || 'L'}
                  </span>
                </div>
                <div>
                  <h1 className="text-xl font-bold dark:text-text-primary text-gray-900">{lead?.name || 'Unknown Lead'}</h1>
                  <div className="flex items-center gap-3 text-sm dark:text-text-muted text-gray-500">
                    <span>ID: #{lead?.id}</span>
                    <span>•</span>
                    <span>{new Date(lead?.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <StatusBadge status={lead?.status} />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-xs uppercase tracking-wider dark:text-text-muted text-gray-500">Contact Information</h3>
                <div className="space-y-3">
                  {lead?.email && (
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 dark:text-text-muted text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm dark:text-text-primary text-gray-900">{lead.email}</span>
                    </div>
                  )}
                  {lead?.phone && (
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 dark:text-text-muted text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-sm dark:text-text-primary text-gray-900">{lead.phone}</span>
                    </div>
                  )}
                  {lead?.company && (
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 dark:text-text-muted text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-sm dark:text-text-primary text-gray-900">{lead.company}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Service & Source */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-xs uppercase tracking-wider dark:text-text-muted text-gray-500">Lead Details</h3>
                <div className="space-y-3">
                  {lead?.service && (
                    <div>
                      <p className="text-xs font-medium dark:text-text-muted text-gray-500 mb-1">Interested Service</p>
                      <span className="inline-flex px-3 py-1.5 rounded-lg text-sm font-medium dark:bg-accent/20 bg-blue-100 dark:text-accent text-blue-700">
                        {lead.service.title}
                      </span>
                    </div>
                  )}
                  {lead?.selected_combo_package_id && (
                    <div>
                      <p className="text-xs font-medium dark:text-text-muted text-gray-500 mb-1">Selected Package</p>
                      <span className="inline-flex px-3 py-1.5 rounded-lg text-sm font-medium dark:bg-navy-700 bg-gray-100 dark:text-text-primary text-gray-800">
                        {lead.selected_combo_package?.name || `Package #${lead.selected_combo_package_id}`}
                      </span>
                      {lead?.pricing_type && <span className="ml-2 text-xs dark:text-text-muted text-gray-500">({lead.pricing_type})</span>}
                    </div>
                  )}
                  {lead?.custom_package_data?.sub_service_ids?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium dark:text-text-muted text-gray-500 mb-1">Custom Package</p>
                      <p className="text-sm dark:text-text-primary text-gray-900">
                        {lead.custom_package_data.sub_service_ids.length} service(s), pricing: {lead.pricing_type || lead.custom_package_data.pricing_type || 'average'}
                      </p>
                    </div>
                  )}
                  {lead?.source && (
                    <div>
                      <p className="text-xs font-medium dark:text-text-muted text-gray-500 mb-1">Lead Source</p>
                      <p className="text-sm dark:text-text-primary text-gray-900">{lead.lead_source || lead.source}</p>
                    </div>
                  )}
                  {lead?.converted_to_client_id && (
                    <div>
                      <p className="text-xs font-medium dark:text-text-muted text-gray-500 mb-1">Converted To</p>
                      <button
                        onClick={() => navigate(`/clients/${lead.converted_to_client_id}`)}
                        className="text-sm text-accent hover:text-accent-bright font-medium hover:underline"
                      >
                        {lead.converted_to_client?.company_name || `Client #${lead.converted_to_client_id}`}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Assignment */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-xs uppercase tracking-wider dark:text-text-muted text-gray-500">Status & Assignment</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium dark:text-text-muted text-gray-500 mb-1">Status</p>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-lg dark:text-text-primary text-gray-900 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="rejected">Rejected</option>
                      <option value="hold">Hold</option>
                      <option value="follow_back">Follow Back</option>
                      <option value="closed">Closed</option>
                      <option value="converted">Converted</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-medium dark:text-text-muted text-gray-500 mb-1">Assigned To</p>
                    <select 
                      value={lead?.assigned_to?.id ?? ''} 
                      onChange={(e) => updateAssignee(e.target.value)} 
                      className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-lg dark:text-text-primary text-gray-900 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-medium dark:text-text-muted text-gray-500 mb-1">Follow-up Date</p>
                    <input 
                      type="date" 
                      value={followUpDate} 
                      onChange={updateFollowUp} 
                      className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-lg dark:text-text-primary text-gray-900 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" 
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={!!lead?.do_not_call} 
                      onChange={(e) => setDoNotCall(e.target.checked)} 
                      className="rounded border-navy-600 border-gray-200 text-accent focus:ring-accent/20" 
                    />
                    <label className="text-sm dark:text-text-muted text-gray-500">Do Not Call</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Update Section */}
            <div className="mt-6 pt-6 border-t dark:border-navy-600 border-gray-200">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={statusNote} 
                  onChange={(e) => setStatusNote(e.target.value)} 
                  placeholder="Add status change note..." 
                  className="flex-1 px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-lg dark:text-text-primary text-gray-900 text-sm placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" 
                />
                <button
                  onClick={applyStatusChange}
                  disabled={saving}
                  className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {saving ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Convert to Client */}
          {!lead?.converted_to_client_id && (
            <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white p-6 shadow-lg dark:shadow-glass shadow-light">
              <h3 className="text-lg font-semibold dark:text-text-primary text-gray-900 mb-4">Convert to Client</h3>
              <form onSubmit={handleConvertToClient} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-2">Next Step</label>
                  <input 
                    type="text" 
                    value={convertNextStep} 
                    onChange={(e) => setConvertNextStep(e.target.value)} 
                    className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-lg dark:text-text-primary text-gray-900 text-sm placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" 
                    placeholder="e.g. Requirement call" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-2">Next Step Date</label>
                  <input 
                    type="date" 
                    value={convertNextStepDate} 
                    onChange={(e) => setConvertNextStepDate(e.target.value)} 
                    className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-lg dark:text-text-primary text-gray-900 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" 
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors font-medium"
                >
                  {saving ? 'Converting...' : 'Convert to Client'}
                </button>
              </form>
            </div>
          )}

          {/* Internal Notes */}
          <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white p-6 shadow-lg dark:shadow-glass shadow-light">
            <h3 className="text-lg font-semibold dark:text-text-primary text-gray-900 mb-4">Internal Notes</h3>
            <form onSubmit={handleSaveNotes} className="space-y-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-lg dark:text-text-primary text-gray-900 text-sm placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
                placeholder="Add internal notes about this lead..."
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors font-medium"
              >
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Timeline Card */}
      <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white p-6 shadow-lg dark:shadow-glass shadow-light">
        <h2 className="text-lg font-semibold dark:text-text-primary text-gray-900 mb-4">Status Timeline</h2>
        {lead?.status_history?.length > 0 ? (
          <div className="space-y-3">
            {lead.status_history.map((h) => (
              <div key={h.id} className="flex gap-3 p-3 rounded-xl dark:bg-navy-800/40 bg-gray-50 border-l-4 border-accent">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium dark:text-text-primary text-gray-900">{h.to_status}</span>
                    <span className="text-xs dark:text-text-muted text-gray-500">
                      {new Date(h.created_at).toLocaleString()}
                      {h.user?.name && ` by ${h.user.name}`}
                    </span>
                  </div>
                  {h.notes && (
                    <p className="text-sm dark:text-text-muted text-gray-500">{h.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm dark:text-text-muted text-gray-500">No status changes yet.</p>
        )}
      </div>

      {/* Activities Card */}
      <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white p-6 shadow-lg dark:shadow-glass shadow-light">
        <h2 className="text-lg font-semibold dark:text-text-primary text-gray-900 mb-4">Activities Log</h2>
        <form onSubmit={addActivity} className="mb-4 flex gap-2">
          <select 
            value={activityType} 
            onChange={(e) => setActivityType(e.target.value)} 
            className="px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-lg dark:text-text-primary text-gray-900 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          >
            <option value="call">Call</option>
            <option value="comment">Comment</option>
            <option value="email">Email</option>
          </select>
          <input 
            type="text" 
            value={activityContent} 
            onChange={(e) => setActivityContent(e.target.value)} 
            placeholder="Add activity note..." 
            className="flex-1 min-w-[200px] px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-lg dark:text-text-primary text-gray-900 placeholder-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" 
          />
          <button 
            type="submit" 
            disabled={saving} 
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors font-medium"
          >
            {saving ? 'Adding...' : 'Add Activity'}
          </button>
        </form>
        
        {lead?.activities?.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {lead.activities.map((a) => (
              <div key={a.id} className="flex gap-3 p-3 rounded-xl dark:bg-navy-800/40 bg-gray-50 border-l-4 border-accent">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex px-2 py-1 rounded text-xs font-medium dark:bg-accent/20 bg-blue-100 dark:text-accent text-blue-700">
                      {a.type}
                    </span>
                    <span className="text-xs dark:text-text-muted text-gray-500">
                      {new Date(a.created_at).toLocaleString()}
                      {a.user?.name && ` by ${a.user.name}`}
                    </span>
                  </div>
                  {a.content && (
                    <p className="text-sm dark:text-text-muted text-gray-500">{a.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm dark:text-text-muted text-gray-500">No activities yet.</p>
        )}
      </div>

      {/* Lead Message Content */}
      {(lead?.subject || lead?.message) && (
        <div className="rounded-2xl border dark:border-navy-600/80 border-gray-200/80 dark:bg-navy-900/60 bg-white p-6 shadow-lg dark:shadow-glass shadow-light">
          <h2 className="text-lg font-semibold dark:text-text-primary text-gray-900 mb-4">Lead Message</h2>
          {lead?.subject && (
            <div className="mb-4">
              <h3 className="font-medium dark:text-text-primary text-gray-900 mb-2">Subject</h3>
              <p className="text-sm dark:text-text-muted text-gray-500">{lead.subject}</p>
            </div>
          )}
          {lead?.message && (
            <div>
              <h3 className="font-medium dark:text-text-primary text-gray-900 mb-2">Message</h3>
              <div className="p-4 rounded-xl dark:bg-navy-800/40 bg-gray-50 border dark:border-navy-600 border-gray-200">
                <p className="text-sm dark:text-text-muted text-gray-500 whitespace-pre-wrap">{lead.message}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
