import { useEffect, useState } from 'react';
import api from '../lib/api';

export function RequirementGatherings() {
  const [list, setList] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [services, setServices] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ client_id: '', project_id: '', service_ids: [], expectations: '', selected_requirements: [] });
  const [templateId, setTemplateId] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/admin/clients').then(r => setClients(r.data?.data ?? r.data ?? [])),
      api.get('/admin/projects').then(r => setProjects(r.data?.data ?? r.data ?? [])),
      api.get('/admin/services').then(r => setServices(r.data?.data ?? r.data ?? [])),
      api.get('/admin/requirement-templates?active_only=1').then(r => setTemplates(Array.isArray(r.data) ? r.data : (r.data?.data ?? []))).catch(() => setTemplates([])),
      api.get('/admin/requirement-gatherings')
        .then(r => setList(r.data?.data ?? r.data ?? []))
        .catch(err => setError(err.response?.data?.message || 'Failed to load'))
    ]).finally(() => setLoading(false));
  }, []);

  const getClientName = (id) => clients.find(c => c.id === id)?.company_name ?? id;
  const getProjectName = (id) => projects.find(p => p.id === id)?.name ?? id;
  const getServiceNames = (ids) => (Array.isArray(ids) ? ids.map(id => services.find(s => s.id === id)?.title).filter(Boolean).join(', ') : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/admin/requirement-gatherings/${editing.id}`, form);
      } else {
        await api.post('/admin/requirement-gatherings', form);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ client_id: '', project_id: '', service_ids: [], expectations: '', selected_requirements: [] });
      const { data } = await api.get('/admin/requirement-gatherings');
      setList(data?.data ?? data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({ client_id: row.client_id, project_id: row.project_id, service_ids: Array.isArray(row.service_ids) ? row.service_ids : [], expectations: row.expectations || '', selected_requirements: Array.isArray(row.selected_requirements) ? row.selected_requirements : [] });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this requirement gathering?')) return;
    try {
      await api.delete(`/admin/requirement-gatherings/${id}`);
      setList(list.filter((it) => it.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleView = (row) => {
    api.get(`/admin/requirement-gatherings/${row.id}`)
      .then(r => { setDetail(r.data); setShowDetailModal(true); })
      .catch(err => setError(err.response?.data?.message || 'Failed to load'));
  };

  const selectedTemplate = templateId ? templates.find(t => t.id === parseInt(templateId, 10)) : null;
  const templateItems = selectedTemplate?.items && Array.isArray(selectedTemplate.items) ? selectedTemplate.items : [];

  const applyTemplate = (tid) => {
    setTemplateId(tid);
    if (!tid) return;
    const t = templates.find(x => x.id === parseInt(tid, 10));
    if (t?.items && Array.isArray(t.items)) {
      const labels = t.items.map(it => (typeof it === 'string' ? it : it?.label)).filter(Boolean);
      setForm(f => ({ ...f, selected_requirements: labels }));
    }
  };

  const toggleRequirement = (label) => {
    setForm(f => ({
      ...f,
      selected_requirements: f.selected_requirements.includes(label)
        ? f.selected_requirements.filter(x => x !== label)
        : [...f.selected_requirements, label],
    }));
  };

  const handleUploadDocument = async (e) => {
    if (!detail?.id || !e.target.files?.length) return;
    const file = e.target.files[0];
    setUploadingDoc(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/admin/requirement-gatherings/${detail.id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const { data } = await api.get(`/admin/requirement-gatherings/${detail.id}`);
      setDetail(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!detail?.id || !confirm('Remove this file?')) return;
    try {
      await api.delete(`/admin/requirement-gatherings/${detail.id}/documents/${docId}`);
      const { data } = await api.get(`/admin/requirement-gatherings/${detail.id}`);
      setDetail(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Requirement Gatherings</h1>
        <button className="btn-primary px-4 py-2" onClick={() => setShowModal(true)}>Add Gathering</button>
      </div>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}
      {loading ? <div className="p-8 text-center text-text-muted">Loading…</div> : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800/50 text-left">
                <th className="px-5 py-3 text-text-muted font-medium">Client</th>
                <th className="px-5 py-3 text-text-muted font-medium">Project</th>
                <th className="px-5 py-3 text-text-muted font-medium">Services</th>
                <th className="px-5 py-3 text-text-muted font-medium">Date</th>
                <th className="px-5 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-text-muted text-center">No requirement gatherings yet.</td></tr>
              ) : list.map((row) => (
                <tr key={row.id} className="border-t border-navy-600 hover:bg-navy-700/30">
                  <td className="px-5 py-3 text-text-primary">{getClientName(row.client_id)}</td>
                  <td className="px-5 py-3 text-text-muted">{getProjectName(row.project_id) || '—'}</td>
                  <td className="px-5 py-3 text-text-muted">{getServiceNames(row.service_ids)}</td>
                  <td className="px-5 py-3 text-text-muted">{row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3">
                    <button className="text-accent hover:text-accent-bright mr-2" onClick={() => handleView(row)}>View</button>
                    <button className="text-accent hover:text-accent-bright mr-2" onClick={() => handleEdit(row)}>Edit</button>
                    <button className="text-accent-muted hover:text-accent-bright" onClick={() => handleDelete(row.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-text-primary mb-4">{editing ? 'Edit' : 'Add'} Requirement Gathering</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Client</label>
                <select className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} required>
                  <option value="">Select Client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Project</label>
                <select className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})}>
                  <option value="">Select Project (optional)</option>
                  {projects.filter(p => !form.client_id || p.client_id == form.client_id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Template (predefined requirements)</label>
                <select className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" value={templateId} onChange={e => applyTemplate(e.target.value)}>
                  <option value="">— None —</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              {templateItems.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Select requirements</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto dark:bg-navy-800/40 bg-gray-50 border dark:border-navy-600 border-gray-200 rounded-vsparkz p-2">
                    {templateItems.map((it, idx) => {
                      const label = typeof it === 'string' ? it : (it?.label ?? `Item ${idx + 1}`);
                      return (
                        <label key={idx} className="flex items-center gap-2 dark:text-text-muted text-gray-600 cursor-pointer">
                          <input type="checkbox" checked={form.selected_requirements.includes(label)} onChange={() => toggleRequirement(label)} />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Services</label>
                <div className="space-y-1 max-h-32 overflow-y-auto dark:bg-navy-800/40 bg-gray-50 border dark:border-navy-600 border-gray-200 rounded-vsparkz p-2">
                  {services.map(s => (
                    <label key={s.id} className="flex items-center gap-2 dark:text-text-muted text-gray-600">
                      <input type="checkbox" checked={form.service_ids.includes(s.id)} onChange={e => {
                        if (e.target.checked) setForm({...form, service_ids: [...form.service_ids, s.id]});
                        else setForm({...form, service_ids: form.service_ids.filter(id => id !== s.id)});
                      }} />
                      {s.title}
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Expectations</label>
                <textarea className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900" rows={3} value={form.expectations} onChange={e => setForm({...form, expectations: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                <button type="button" className="px-4 py-2 border border-navy-600 rounded-vsparkz text-text-muted hover:text-text-primary" onClick={() => { setShowModal(false); setEditing(null); setForm({ client_id: '', project_id: '', service_ids: [], expectations: '', selected_requirements: [] }); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold dark:text-text-primary text-gray-900 mb-4">Requirement Gathering Details</h2>
            <div className="space-y-3 text-sm">
              <div><span className="font-medium dark:text-text-muted text-gray-500">Client:</span> <span className="dark:text-text-primary text-gray-900">{getClientName(detail.client_id)}</span></div>
              <div><span className="font-medium dark:text-text-muted text-gray-500">Project:</span> <span className="dark:text-text-primary text-gray-900">{getProjectName(detail.project_id) || '—'}</span></div>
              <div><span className="font-medium dark:text-text-muted text-gray-500">Services:</span> <span className="dark:text-text-primary text-gray-900">{getServiceNames(detail.service_ids)}</span></div>
              <div><span className="font-medium dark:text-text-muted text-gray-500">Expectations:</span> <span className="dark:text-text-primary text-gray-900">{detail.expectations || '—'}</span></div>
              <div><span className="font-medium dark:text-text-muted text-gray-500">Selected Requirements:</span> <span className="dark:text-text-primary text-gray-900">{Array.isArray(detail.selected_requirements) ? detail.selected_requirements.join(', ') : '—'}</span></div>
              <div><span className="font-medium dark:text-text-muted text-gray-500">Created:</span> <span className="dark:text-text-primary text-gray-900">{detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'}</span></div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold dark:text-text-primary text-gray-900 mb-2">Documents / Files</h3>
              {(detail.documents && detail.documents.length > 0) ? (
                <ul className="space-y-1 text-sm">
                  {detail.documents.map(d => (
                    <li key={d.id} className="flex items-center justify-between dark:bg-navy-800/40 bg-gray-50 px-2 py-1.5 rounded">
                      <span className="dark:text-text-primary text-gray-900 truncate">{d.original_name || d.file_path || 'File'}</span>
                      <button type="button" onClick={() => handleDeleteDocument(d.id)} className="text-red-600 hover:underline text-xs">Remove</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm dark:text-text-muted text-gray-500">No files uploaded.</p>
              )}
              <label className="mt-2 inline-block">
                <span className="btn-primary px-3 py-2 text-sm cursor-pointer inline-block disabled:opacity-50">{uploadingDoc ? 'Uploading…' : 'Upload file'}</span>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleUploadDocument} disabled={uploadingDoc} />
              </label>
            </div>
            <div className="mt-6">
              <button className="btn-primary w-full" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
