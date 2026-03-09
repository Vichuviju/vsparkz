import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';

const TIME_PERIODS = [{ value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }];

export function Quotations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectIdFromUrl = searchParams.get('project_id');
  const [list, setList] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [buildData, setBuildData] = useState(null);
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildLines, setBuildLines] = useState([]);
  const [buildForm, setBuildForm] = useState({ time_period: 'monthly', tax_rate: 18, title: '' });
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ client_id: '', number: '', title: '', subtotal: 0, tax_rate: 18, tax_amount: 0, total: 0, status: 'draft', items: [] });

  useEffect(() => {
    Promise.all([
      api.get('/admin/clients').then(r => setClients(Array.isArray(r.data) ? r.data : (r.data?.data ?? []))),
      api.get('/admin/quotations')
        .then(r => setList(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
        .catch(err => setError(err.response?.data?.message || 'Failed to load'))
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!projectIdFromUrl) return;
    setShowBuildModal(true);
    setBuildLoading(true);
    setError(null);
    api.get('/admin/quotations/build', { params: { project_id: projectIdFromUrl } })
      .then(({ data }) => {
        setBuildData(data);
        const prev = data.previous_quotation;
        const prevLines = prev?.quotation_services ?? prev?.quotationServices ?? [];
        if (prevLines.length) {
          setBuildLines(prevLines.map(s => ({ sub_service_id: s.sub_service_id, freelancer_id: s.freelancer_id || '', quantity: s.quantity ?? 1, time_period: s.time_period || 'monthly' })));
        } else if (data.sub_services?.length) {
          setBuildLines([{ sub_service_id: data.sub_services[0].id, freelancer_id: '', quantity: 1, time_period: 'monthly' }]);
        } else {
          setBuildLines([]);
        }
        setBuildForm({ time_period: prev?.time_period || 'monthly', tax_rate: 18, title: prev?.title || '' });
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load build data'))
      .finally(() => setBuildLoading(false));
  }, [projectIdFromUrl]);

  const getClientName = (id) => clients.find(c => c.id === id)?.company_name ?? id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, client_id: parseInt(form.client_id, 10), number: form.number || (editing ? undefined : `QUO-${Date.now()}`) };
      if (editing) {
        await api.put(`/admin/quotations/${editing.id}`, payload);
      } else {
        await api.post('/admin/quotations', { ...payload, number: payload.number || `QUO-${Date.now()}` });
      }
      setShowModal(false);
      setEditing(null);
      setForm({ client_id: '', number: '', title: '', subtotal: 0, tax_rate: 18, tax_amount: 0, total: 0, status: 'draft', items: [] });
      const { data } = await api.get('/admin/quotations');
      setList(data?.data ?? data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({ client_id: row.client_id, number: row.number ?? '', title: row.title ?? '', subtotal: row.subtotal ?? 0, tax_rate: row.tax_rate ?? 18, tax_amount: row.tax_amount ?? 0, total: row.total ?? 0, status: row.status ?? 'draft', items: Array.isArray(row.items) ? row.items : [] });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this quotation?')) return;
    try {
      await api.delete(`/admin/quotations/${id}`);
      setList(list.filter((it) => it.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleView = async (row) => {
    try {
      const { data } = await api.get(`/admin/quotations/${row.id}`);
      setDetail(data);
      setShowDetailModal(true);
    } catch (err) {
      setError('Failed to load details');
    }
  };

  const addBuildLine = () => {
    const subServices = buildData?.sub_services ?? [];
    const firstId = subServices[0]?.id;
    if (firstId) setBuildLines(prev => [...prev, { sub_service_id: firstId, freelancer_id: '', quantity: 1, time_period: buildForm.time_period }]);
  };

  const updateBuildLine = (idx, field, value) => {
    setBuildLines(prev => prev.map((line, i) => i === idx ? { ...line, [field]: value } : line));
  };

  const removeBuildLine = (idx) => setBuildLines(prev => prev.filter((_, i) => i !== idx));

  const handleBuildSubmit = async (e) => {
    e.preventDefault();
    if (!buildData?.project?.id || !buildData?.client?.id) return;
    if (buildLines.length === 0) { setError('Add at least one line'); return; }
    setError(null);
    try {
      const quotation_services = buildLines.map(l => ({
        sub_service_id: l.sub_service_id,
        freelancer_id: l.freelancer_id ? parseInt(l.freelancer_id, 10) : null,
        quantity: parseFloat(l.quantity) || 1,
        time_period: l.time_period || buildForm.time_period,
      }));
      const { data } = await api.post('/admin/quotations', {
        client_id: buildData.client.id,
        project_id: buildData.project.id,
        title: buildForm.title || `Quotation for ${buildData.project.name}`,
        time_period: buildForm.time_period,
        tax_rate: buildForm.tax_rate,
        status: 'draft',
        quotation_services,
      });
      setShowBuildModal(false);
      setBuildData(null);
      setSearchParams({});
      setList(prev => (Array.isArray(prev) ? [data, ...prev] : [data]));
      navigate(`/quotations/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quotation');
    }
  };

  const handlePdf = async (id) => {
    try {
      const response = await api.get(`/admin/quotations/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotation-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('PDF download error:', err);
      setError('Failed to download PDF. Try opening in a new tab.');
      // Fallback: open in new tab
      window.open(`/admin/quotations/${id}/pdf`, '_blank');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Quotations</h1>
        <button className="btn-primary px-4 py-2" onClick={() => { setForm({ client_id: '', number: `QUO-${Date.now()}`, title: '', subtotal: 0, tax_rate: 18, tax_amount: 0, total: 0, status: 'draft', items: [] }); setShowModal(true); }}>Add Quotation</button>
      </div>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}
      {loading ? <div className="p-8 text-center text-text-muted">Loading…</div> : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800/50 text-left">
                <th className="px-5 py-3 text-text-muted font-medium">Number</th>
                <th className="px-5 py-3 text-text-muted font-medium">Client</th>
                <th className="px-5 py-3 text-text-muted font-medium">Title</th>
                <th className="px-5 py-3 text-text-muted font-medium">Total</th>
                <th className="px-5 py-3 text-text-muted font-medium">Status</th>
                <th className="px-5 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={6} className="px-5 py-8 text-text-muted text-center">No quotations yet.</td></tr> : list.map((row) => (
                <tr key={row.id} className="border-t border-navy-600 hover:bg-navy-700/30">
                  <td className="px-5 py-3 text-text-primary">{row.number}</td>
                  <td className="px-5 py-3 text-text-primary">{getClientName(row.client_id)}</td>
                  <td className="px-5 py-3 text-text-muted">{row.title}</td>
                  <td className="px-5 py-3 text-text-primary">₹{row.total}</td>
                  <td className="px-5 py-3 text-text-muted">{row.status}</td>
                  <td className="px-5 py-3">
                    <Link to={`/quotations/${row.id}`} className="text-accent hover:text-accent-bright mr-2">View</Link>
                    <button className="text-accent hover:text-accent-bright mr-2" onClick={() => handleEdit(row)}>Edit</button>
                    <button className="text-accent hover:text-accent-bright mr-2" onClick={() => handlePdf(row.id)}>PDF</button>
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
            <h2 className="text-xl font-bold text-text-primary mb-4">{editing ? 'Edit' : 'Add'} Quotation</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Number</label>
                <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary font-mono" value={form.number} onChange={e => setForm({...form, number: e.target.value})} placeholder="e.g. QUO-2025-0001" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Client</label>
                <select className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} required>
                  <option value="">Select Client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Title</label>
                <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Subtotal</label>
                  <input type="number" className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.subtotal} onChange={e => setForm({...form, subtotal: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Tax Rate (%)</label>
                  <input type="number" step="0.01" className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.tax_rate} onChange={e => setForm({...form, tax_rate: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1">Status</label>
                <select className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
                <button type="button" className="px-4 py-2 border border-navy-600 rounded-vsparkz text-text-muted hover:text-text-primary" onClick={() => { setShowModal(false); setEditing(null); setForm({ client_id: '', number: '', title: '', subtotal: 0, tax_rate: 18, tax_amount: 0, total: 0, status: 'draft', items: [] }); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Build from project modal */}
      {showBuildModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-text-primary mb-4">Build Quotation from Project</h2>
            {buildLoading ? (
              <div className="py-8 text-center text-text-muted">Loading…</div>
            ) : buildData ? (
              <form onSubmit={handleBuildSubmit}>
                <p className="text-sm text-text-muted mb-4">Project: <span className="text-text-primary">{buildData.project?.name}</span> · Client: <span className="text-text-primary">{buildData.client?.company_name}</span></p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Time period</label>
                    <select className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={buildForm.time_period} onChange={e => setBuildForm(f => ({ ...f, time_period: e.target.value }))}>
                      {TIME_PERIODS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Tax rate (%)</label>
                    <input type="number" step="0.01" className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={buildForm.tax_rate} onChange={e => setBuildForm(f => ({ ...f, tax_rate: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-muted mb-1">Title</label>
                  <input className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={buildForm.title} onChange={e => setBuildForm(f => ({ ...f, title: e.target.value }))} placeholder="Quotation title" />
                </div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-text-muted">Line items</span>
                    <button type="button" onClick={addBuildLine} className="text-accent hover:text-accent-bright text-sm">+ Add line</button>
                  </div>
                  <div className="space-y-2">
                    {buildLines.map((line, idx) => (
                      <div key={idx} className="flex flex-wrap gap-2 items-center p-2 bg-navy-800/50 rounded-vsparkz">
                        <select className="min-w-[140px] px-2 py-1.5 bg-navy-800/80 border border-navy-600 rounded text-text-primary text-sm" value={line.sub_service_id} onChange={e => updateBuildLine(idx, 'sub_service_id', e.target.value)}>
                          {(buildData.sub_services || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select className="min-w-[120px] px-2 py-1.5 bg-navy-800/80 border border-navy-600 rounded text-text-primary text-sm" value={line.freelancer_id} onChange={e => updateBuildLine(idx, 'freelancer_id', e.target.value)}>
                          <option value="">No freelancer</option>
                          {(buildData.freelancers || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                        <select className="w-24 px-2 py-1.5 bg-navy-800/80 border border-navy-600 rounded text-text-primary text-sm" value={line.time_period} onChange={e => updateBuildLine(idx, 'time_period', e.target.value)}>
                          {TIME_PERIODS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <input type="number" min="0.01" step="0.01" className="w-16 px-2 py-1.5 bg-navy-800/80 border border-navy-600 rounded text-text-primary text-sm" value={line.quantity} onChange={e => updateBuildLine(idx, 'quantity', e.target.value)} placeholder="Qty" />
                        <button type="button" onClick={() => removeBuildLine(idx)} className="text-accent-muted hover:text-accent-bright text-sm">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary flex-1" disabled={buildLines.length === 0}>Create Quotation</button>
                  <button type="button" className="px-4 py-2 border border-navy-600 rounded-vsparkz text-text-muted hover:text-text-primary" onClick={() => { setShowBuildModal(false); setBuildData(null); setSearchParams({}); }}>Cancel</button>
                </div>
              </form>
            ) : (
              <p className="text-text-muted">No build data.</p>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-text-primary mb-4">Quotation Details</h2>
            <div className="space-y-3 text-sm">
              <div><span className="font-medium text-text-muted">Number:</span> <span className="text-text-primary">{detail.number}</span></div>
              <div><span className="font-medium text-text-muted">Client:</span> <span className="text-text-primary">{getClientName(detail.client_id)}</span></div>
              <div><span className="font-medium text-text-muted">Title:</span> <span className="text-text-primary">{detail.title}</span></div>
              <div><span className="font-medium text-text-muted">Subtotal:</span> <span className="text-text-primary">₹{detail.subtotal}</span></div>
              <div><span className="font-medium text-text-muted">Tax Rate:</span> <span className="text-text-primary">{detail.tax_rate}%</span></div>
              <div><span className="font-medium text-text-muted">Tax Amount:</span> <span className="text-text-primary">₹{detail.tax_amount}</span></div>
              <div><span className="font-medium text-text-muted">Total:</span> <span className="text-text-primary">₹{detail.total}</span></div>
              <div><span className="font-medium text-text-muted">Status:</span> <span className="text-text-primary">{detail.status}</span></div>
              <div><span className="font-medium text-text-muted">Created:</span> <span className="text-text-primary">{detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'}</span></div>
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
