import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function DashboardAgreements() {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [action, setAction] = useState(null);
  const [reworkComments, setReworkComments] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAgreements = () => {
    api.get('/client/agreements')
      .then((r) => setAgreements(Array.isArray(r.data) ? r.data : []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  const openDetail = (a) => {
    setDetail(a);
    setAction(null);
    setReworkComments('');
  };

  const downloadPdf = (id, title) => {
    api.get(`/client/agreements/${id}/pdf`, { responseType: 'blob' })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `agreement-${(title || id).replace(/\s+/g, '-')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => setError('Failed to download PDF'));
  };

  const submitAction = async (e) => {
    e.preventDefault();
    if (!detail?.id) return;
    setSaving(true);
    try {
      const payload = action === 'approve' ? { action: 'approve' } : { action, rework_comments: reworkComments };
      const { data } = await api.patch(`/client/agreements/${detail.id}`, payload);
      setDetail(data);
      setAction(null);
      setReworkComments('');
      fetchAgreements();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-4">Agreements</h1>
      {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}
      {loading ? <p className="text-text-muted">Loading…</p> : agreements.length === 0 ? (
        <p className="text-text-muted">No agreements yet.</p>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-800/50 text-left">
                <th className="px-5 py-3 text-text-muted font-medium">Title</th>
                <th className="px-5 py-3 text-text-muted font-medium">Project</th>
                <th className="px-5 py-3 text-text-muted font-medium">Status</th>
                <th className="px-5 py-3 text-text-muted font-medium">Signed at</th>
                <th className="px-5 py-3 text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agreements.map((a) => (
                <tr key={a.id} className="border-t border-navy-600 hover:bg-navy-700/30">
                  <td className="px-5 py-3 font-medium text-text-primary">{a.title}</td>
                  <td className="px-5 py-3 text-text-muted">{a.project?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-text-muted">{a.status}</td>
                  <td className="px-5 py-3 text-text-muted">{a.signed_at ? new Date(a.signed_at).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3">
                    <button type="button" onClick={() => downloadPdf(a.id, a.title)} className="text-accent hover:text-accent-bright mr-2">PDF</button>
                    <button type="button" onClick={() => openDetail(a)} className="text-accent hover:text-accent-bright">View</button>
                    {a.status !== 'signed' && (
                      <button type="button" onClick={() => { openDetail(a); setAction('approve'); }} className="ml-2 text-green-400 hover:underline">Approve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-900 border border-navy-600 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-5 border-b border-navy-600 flex justify-between items-start">
              <h2 className="text-lg font-bold text-text-primary">{detail.title}</h2>
              <button type="button" onClick={() => { setDetail(null); setAction(null); }} className="text-text-muted hover:text-text-primary">×</button>
            </div>
            <div className="p-5 space-y-2 text-sm">
              <p><span className="text-text-muted">Project:</span> {detail.project?.name ?? '—'}</p>
              <p><span className="text-text-muted">Status:</span> {detail.status}</p>
              {detail.signed_at && <p><span className="text-text-muted">Signed:</span> {new Date(detail.signed_at).toLocaleString()}</p>}
            </div>
            <div className="p-5 border-t border-navy-600 flex flex-wrap gap-2">
              <button type="button" onClick={() => downloadPdf(detail.id, detail.title)} className="px-3 py-2 rounded-lg border border-navy-600 text-text-primary hover:bg-navy-700">Download PDF</button>
              {detail.status !== 'signed' && (
                <>
                  <button type="button" onClick={() => setAction('approve')} className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">Approve</button>
                  <button type="button" onClick={() => { setAction('reject'); setReworkComments(''); }} className="px-3 py-2 rounded-lg bg-red-600/80 text-white hover:bg-red-600">Reject</button>
                  <button type="button" onClick={() => { setAction('request_rework'); setReworkComments(''); }} className="px-3 py-2 rounded-lg bg-amber-600/80 text-white hover:bg-amber-600">Request rework</button>
                </>
              )}
            </div>
            {action === 'approve' && (
              <form onSubmit={submitAction} className="p-5 border-t border-navy-600">
                <p className="text-text-primary mb-3">Sign and approve this agreement?</p>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50">Confirm approve</button>
                  <button type="button" onClick={() => setAction(null)} className="px-4 py-2 rounded-lg border border-navy-600 text-text-muted">Cancel</button>
                </div>
              </form>
            )}
            {(action === 'reject' || action === 'request_rework') && (
              <form onSubmit={submitAction} className="p-5 border-t border-navy-600">
                <label className="block text-text-muted text-sm mb-2">Comments</label>
                <textarea value={reworkComments} onChange={(e) => setReworkComments(e.target.value)} className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded-lg text-text-primary text-sm" rows={3} placeholder={action === 'request_rework' ? 'What changes do you need?' : 'Optional reason'} />
                <div className="flex gap-2 mt-3">
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-red-600/80 text-white disabled:opacity-50">Confirm</button>
                  <button type="button" onClick={() => setAction(null)} className="px-4 py-2 rounded-lg border border-navy-600 text-text-muted">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
