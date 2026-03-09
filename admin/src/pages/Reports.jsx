import { useEffect, useState } from 'react';
import api from '../lib/api';

const REPORT_TYPES = [{ value: 'seo', label: 'SEO' }, { value: 'influencer', label: 'Influencer' }, { value: 'campaign', label: 'Campaign' }, { value: 'client', label: 'Client' }];

function ReportPreview({ payload }) {
  if (!payload || typeof payload !== 'object') {
    return <p className="text-text-muted text-sm">No report data.</p>;
  }
  const sections = Array.isArray(payload.sections) ? payload.sections : [];
  const summary = payload.summary && typeof payload.summary === 'object' ? payload.summary : null;
  const tables = Array.isArray(payload.tables) ? payload.tables : (payload.data && Array.isArray(payload.data) ? [{ rows: payload.data, columns: Object.keys(payload.data[0] || {}) }] : null);

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(summary).map(([key, value]) => (
            <div key={key} className="p-3 rounded-lg dark:bg-navy-800/50 bg-gray-50">
              <div className="text-xs font-medium text-text-muted uppercase tracking-wide">{String(key).replace(/_/g, ' ')}</div>
              <div className="text-lg font-semibold text-text-primary mt-1">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</div>
            </div>
          ))}
        </div>
      )}
      {sections.length > 0 && sections.map((section, i) => (
        <div key={i} className="border-b dark:border-navy-600 pb-4 last:border-0">
          {section.title && <h4 className="text-sm font-semibold text-text-primary mb-2">{section.title}</h4>}
          {section.content && <p className="text-sm text-text-muted whitespace-pre-wrap">{section.content}</p>}
          {section.metrics && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {Object.entries(section.metrics).map(([k, v]) => (
                <div key={k}><span className="text-text-muted text-sm">{k}:</span> <span className="font-medium text-text-primary">{String(v)}</span></div>
              ))}
            </div>
          )}
        </div>
      ))}
      {tables && tables.length > 0 && tables.map((tbl, i) => (
        <div key={i} className="overflow-x-auto">
          <table className="w-full text-sm border dark:border-navy-600 rounded-lg overflow-hidden">
            <thead className="dark:bg-navy-800/50 bg-gray-50">
              <tr>
                {(tbl.columns || Object.keys(tbl.rows?.[0] || {})).map((col) => (
                  <th key={col} className="text-left px-3 py-2 font-medium text-text-primary">{String(col)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-navy-600">
              {(tbl.rows || []).map((row, ri) => (
                <tr key={ri} className="dark:hover:bg-navy-800/30">
                  {(tbl.columns || Object.keys(row)).map((col) => (
                    <td key={col} className="px-3 py-2 text-text-muted">{row[col] != null ? String(row[col]) : '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {!summary && sections.length === 0 && (!tables || tables.length === 0) && (
        <pre className="text-xs dark:bg-navy-800/50 bg-gray-50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap text-text-muted">{JSON.stringify(payload, null, 2)}</pre>
      )}
    </div>
  );
}

export function Reports() {
  const [list, setList] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ type: 'seo', reference_id: '', title: '', from_date: '', to_date: '' });
  const [generating, setGenerating] = useState(false);
  const [viewReport, setViewReport] = useState(null);

  const fetchList = () => {
    setLoading(true);
    api.get('/admin/reports').then(({ data }) => setList(data.data ?? data ?? [])).catch((err) => setError(err.response?.data?.message || 'Failed to load')).finally(() => setLoading(false));
  };
  useEffect(() => { fetchList(); }, []);
  useEffect(() => {
    api.get('/admin/clients', { params: { per_page: 200 } }).then(({ data }) => setClients(data.data ?? data ?? [])).catch(() => setClients([]));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    const payload = { ...form, reference_id: form.reference_id ? parseInt(form.reference_id, 10) : null, from_date: form.from_date || null, to_date: form.to_date || null };
    try {
      const { data } = await api.post('/admin/reports', payload);
      fetchList();
      setViewReport(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this report?')) return;
    try {
      await api.delete(`/admin/reports/${id}`);
      fetchList();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handlePdf = async (id) => {
    try {
      const response = await api.get(`/admin/reports/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      setError('Failed to download PDF. Try opening in a new tab.');
      window.open(`/admin/reports/${id}/pdf`, '_blank');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">Reports</h1>
      </div>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 dark:text-accent-bright text-cyan-800 text-sm">{error}</div>}
      <form onSubmit={handleGenerate} className="glass-card p-6 mb-6 space-y-4 max-w-xl">
        <h2 className="font-semibold dark:text-text-primary text-gray-900">Generate report</h2>
        <div>
          <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Type</label>
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent">
            {REPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        {(form.type === 'client' || form.type === 'campaign') && (
          <div>
            <label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Client (optional)</label>
            <select value={form.reference_id} onChange={(e) => setForm((f) => ({ ...f, reference_id: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent">
              <option value="">—</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">From date</label><input type="date" value={form.from_date} onChange={(e) => setForm((f) => ({ ...f, from_date: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent" /></div>
          <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">To date</label><input type="date" value={form.to_date} onChange={(e) => setForm((f) => ({ ...f, to_date: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent" /></div>
        </div>
        <div><label className="block text-sm font-medium dark:text-text-muted text-gray-500 mb-1">Title (optional)</label><input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 focus:border-accent" /></div>
        <button type="submit" disabled={generating} className="btn-primary px-4 py-2 disabled:opacity-50">Generate</button>
      </form>
      <div className="glass-card overflow-hidden">
        <h2 className="px-5 py-3 border-b dark:border-navy-600 border-gray-200 font-semibold dark:text-text-primary text-gray-900">Recent reports</h2>
        {loading ? <div className="p-8 text-center dark:text-text-muted text-gray-500">Loading…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="dark:bg-navy-800/50 bg-gray-50 text-left"><th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Type</th><th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Title</th><th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Created</th><th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Actions</th></tr></thead>
              <tbody>
                {list.length === 0 ? <tr><td colSpan={4} className="px-5 py-8 dark:text-text-muted text-gray-500 text-center">No reports yet. Generate one above.</td></tr> : list.map((r) => (
                  <tr key={r.id} className="border-t dark:border-navy-600 border-gray-100 dark:hover:bg-navy-700/30 hover:bg-gray-50">
                    <td className="px-5 py-3 dark:text-text-primary text-gray-900">{r.type}</td>
                    <td className="px-5 py-3 dark:text-text-muted text-gray-500">{r.title ?? '—'}</td>
                    <td className="px-5 py-3 dark:text-text-muted text-gray-500">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <button type="button" onClick={() => setViewReport(r)} className="text-accent hover:text-accent-bright mr-2">View</button>
                      <button type="button" onClick={() => handlePdf(r.id)} className="text-accent hover:text-accent-bright mr-2">PDF</button>
                      <button type="button" onClick={() => handleDelete(r.id)} className="text-accent-muted hover:text-accent-bright">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {viewReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-card max-w-3xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto border dark:border-navy-600 border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-text-primary text-gray-900">{viewReport.title || viewReport.type} Report</h3>
              <button type="button" onClick={() => setViewReport(null)} className="dark:text-text-muted text-gray-500 dark:hover:text-text-primary hover:text-gray-900 text-2xl leading-none">×</button>
            </div>
            <ReportPreview payload={viewReport.payload ?? {}} />
          </div>
        </div>
      )}
    </div>
  );
}
