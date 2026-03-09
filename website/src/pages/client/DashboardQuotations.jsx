import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const STATUS_LABELS = { draft: 'Draft', sent: 'Sent', accepted: 'Accepted', rejected: 'Rejected' };

export default function DashboardQuotations() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [action, setAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchList = () => {
    setLoading(true);
    api.get('/client/quotations')
      .then(({ data }) => setList(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load quotations'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const openDetail = (q) => {
    setDetail(q);
    setAction(null);
  };

  const loadDetail = (id) => {
    api.get(`/client/quotations/${id}`)
      .then(({ data }) => setDetail(data))
      .catch(() => setError('Failed to load quotation'));
  };

  const handleApprove = () => setAction('approve');
  const handleReject = () => { setAction('reject'); setRejectionReason(''); };
  const handleEdit = () => setAction('edit');

  const submitAction = async (e) => {
    e.preventDefault();
    if (!detail?.id) return;
    setSaving(true);
    try {
      const payload = action === 'reject' ? { action: 'reject', rejection_reason: rejectionReason } : { action };
      const { data } = await api.patch(`/client/quotations/${detail.id}`, payload);
      setDetail(data);
      setAction(null);
      fetchList();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = (id, number) => {
    api.get(`/client/quotations/${id}/pdf`, { responseType: 'blob' })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `quotation-${number || id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => setError('Failed to download PDF'));
  };

  const canRespond = detail && (detail.status === 'sent') && action !== 'edit';

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Quotations</h1>
      {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
      {loading ? (
        <div className="py-12 text-center text-text-muted">Loading…</div>
      ) : (
        <div className="space-y-4">
          {list.length === 0 ? (
            <p className="text-text-muted">No quotations yet.</p>
          ) : (
            list.map((q) => (
              <div key={q.id} className="p-4 rounded-lg border border-navy-600 bg-navy-800/30 hover:bg-navy-800/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-medium text-text-primary">{q.number}</span>
                    <span className="ml-2 text-text-muted text-sm">{q.project?.name ? ` · ${q.project.name}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${q.status === 'accepted' ? 'bg-green-500/20 text-green-400' : q.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-navy-600 text-text-muted'}`}>
                      {STATUS_LABELS[q.status] ?? q.status}
                    </span>
                    <button type="button" onClick={() => downloadPdf(q.id, q.number)} className="text-sm text-accent hover:underline">PDF</button>
                    <button type="button" onClick={() => openDetail(q)} className="text-sm text-accent hover:underline">View</button>
                  </div>
                </div>
                <p className="text-sm text-text-muted mt-1">Total: ₹{Number(q.total ?? 0).toFixed(2)} · Valid until: {q.valid_until ? new Date(q.valid_until).toLocaleDateString() : '—'}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail + actions modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-900 border border-navy-600 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-5 border-b border-navy-600 flex justify-between items-start">
              <h2 className="text-lg font-bold text-text-primary">{detail.number}</h2>
              <button type="button" onClick={() => { setDetail(null); setAction(null); }} className="text-text-muted hover:text-text-primary">×</button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <p><span className="text-text-muted">Project:</span> {detail.project?.name ?? '—'}</p>
              <p><span className="text-text-muted">Subtotal:</span> ₹{Number(detail.subtotal ?? 0).toFixed(2)} · Tax: {Number(detail.tax_rate ?? 0).toFixed(1)}%</p>
              <p><span className="text-text-muted">Total:</span> <strong>₹{Number(detail.total ?? 0).toFixed(2)}</strong></p>
              <p><span className="text-text-muted">Status:</span> {STATUS_LABELS[detail.status] ?? detail.status}</p>
              {(detail.quotation_services ?? detail.quotationServices ?? []).length > 0 && (
                <div>
                  <span className="text-text-muted block mb-1">Line items</span>
                  <ul className="list-disc list-inside text-text-primary">
                    {(detail.quotation_services ?? detail.quotationServices).map((line) => (
                      <li key={line.id}>{line.sub_service?.name ?? '—'} × {line.quantity ?? 1} — ₹{Number(line.amount ?? 0).toFixed(2)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-navy-600 flex flex-wrap gap-2">
              <button type="button" onClick={() => downloadPdf(detail.id, detail.number)} className="px-3 py-2 rounded-lg border border-navy-600 text-text-primary hover:bg-navy-700">Download PDF</button>
              {detail.status === 'sent' && (
                <>
                  <button type="button" onClick={handleApprove} className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">Approve</button>
                  <button type="button" onClick={handleReject} className="px-3 py-2 rounded-lg bg-red-600/80 text-white hover:bg-red-600">Reject</button>
                </>
              )}
            </div>

            {action === 'approve' && (
              <form onSubmit={submitAction} className="p-5 border-t border-navy-600">
                <p className="text-text-primary mb-3">Approve this quotation and proceed to agreement?</p>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-green-600 text-white disabled:opacity-50">Confirm approve</button>
                  <button type="button" onClick={() => setAction(null)} className="px-4 py-2 rounded-lg border border-navy-600 text-text-muted">Cancel</button>
                </div>
              </form>
            )}
            {action === 'reject' && (
              <form onSubmit={submitAction} className="p-5 border-t border-navy-600">
                <label className="block text-text-muted text-sm mb-2">Rejection reason (optional)</label>
                <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded-lg text-text-primary text-sm" rows={2} placeholder="Reason for rejection" />
                <div className="flex gap-2 mt-3">
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-red-600/80 text-white disabled:opacity-50">Confirm reject</button>
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
