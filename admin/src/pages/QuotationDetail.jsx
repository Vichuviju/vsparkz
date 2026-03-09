import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';

export function QuotationDetail() {
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/admin/quotations/${id}`)
      .then(({ data }) => setQuotation(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load quotation'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleGeneratePdf = async () => {
    if (!quotation?.id) return;
    try {
      await api.post(`/admin/quotations/${quotation.id}/generate-pdf`);
      const { data } = await api.get(`/admin/quotations/${quotation.id}`);
      setQuotation(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate PDF');
    }
  };

  const handlePdf = async () => {
    if (!quotation?.id) return;
    try {
      const { data } = await api.get(`/admin/quotations/${quotation.id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotation-${quotation.number}.pdf`;
      a.click();
    } catch (err) {
      setError('Failed to download PDF');
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted">Loading…</div>;
  if (error || !quotation) return <div className="p-8"><div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright">{error || 'Quotation not found'}</div><Link to="/quotations" className="text-accent hover:underline">Back to Quotations</Link></div>;

  const items = Array.isArray(quotation.items) ? quotation.items : [];
  const services = quotation.quotation_services || quotation.quotationServices || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/quotations" className="text-sm text-text-muted hover:text-accent mb-1 inline-block">← Quotations</Link>
          <h1 className="text-2xl font-bold text-text-primary font-mono">{quotation.number}</h1>
          <p className="text-text-muted text-sm mt-1">
            Client: <Link to={`/clients/${quotation.client_id}`} className="text-accent hover:underline">{quotation.client?.company_name ?? quotation.client_id}</Link>
            {' · '}Status: <span className="inline-flex px-2 py-0.5 rounded text-xs bg-accent/20 text-accent">{quotation.status}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {(quotation.status === 'draft' || !quotation.file_path) && (
            <button type="button" onClick={handleGeneratePdf} className="btn-primary px-4 py-2">Generate PDF</button>
          )}
          <button type="button" onClick={handlePdf} className="btn-primary px-4 py-2">Download PDF</button>
        </div>
      </div>

      <div className="glass-card p-6 mb-6">
        <h2 className="font-semibold text-text-primary mb-3">Summary</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-text-muted">Title</dt><dd className="text-text-primary">{quotation.title ?? '—'}</dd>
          <dt className="text-text-muted">Subtotal</dt><dd className="text-text-primary">{Number(quotation.subtotal ?? 0).toFixed(2)}</dd>
          <dt className="text-text-muted">Tax rate</dt><dd className="text-text-primary">{Number(quotation.tax_rate ?? 0).toFixed(1)}%</dd>
          <dt className="text-text-muted">Tax amount</dt><dd className="text-text-primary">{Number(quotation.tax_amount ?? 0).toFixed(2)}</dd>
          <dt className="text-text-muted">Total</dt><dd className="text-text-primary font-semibold">{Number(quotation.total ?? 0).toFixed(2)}</dd>
          <dt className="text-text-muted">Valid until</dt><dd className="text-text-primary">{quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString() : '—'}</dd>
        </dl>
      </div>

      {(services.length > 0 || items.length > 0) && (
        <div className="glass-card overflow-hidden">
          <h2 className="px-5 py-3 border-b border-navy-600 font-semibold text-text-primary">Line items</h2>
          <table className="w-full text-sm">
            <thead><tr className="bg-navy-800/50 text-left"><th className="px-5 py-3 text-text-muted font-medium">Description</th><th className="px-5 py-3 text-text-muted font-medium">Time</th><th className="px-5 py-3 text-text-muted font-medium">Freelancer</th><th className="px-5 py-3 text-text-muted font-medium">Qty</th><th className="px-5 py-3 text-text-muted font-medium">Rate</th><th className="px-5 py-3 text-text-muted font-medium">Amount</th></tr></thead>
            <tbody>
              {services.length > 0 ? services.map((line) => (
                <tr key={line.id} className="border-t border-navy-600">
                  <td className="px-5 py-3 text-text-primary">{line.sub_service?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-text-muted">{line.time_period ? String(line.time_period) : '—'}</td>
                  <td className="px-5 py-3 text-text-muted">{line.freelancer?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-text-muted">{line.quantity ?? 1}</td>
                  <td className="px-5 py-3 text-text-muted">{Number(line.unit_price ?? 0).toFixed(2)}</td>
                  <td className="px-5 py-3 text-text-primary">{Number(line.amount ?? 0).toFixed(2)}</td>
                </tr>
              )) : items.map((item, idx) => (
                <tr key={idx} className="border-t border-navy-600">
                  <td className="px-5 py-3 text-text-primary">{item.description ?? '—'}</td>
                  <td colSpan={2} className="px-5 py-3 text-text-muted">—</td>
                  <td className="px-5 py-3 text-text-muted">1</td>
                  <td className="px-5 py-3 text-text-muted">—</td>
                  <td className="px-5 py-3 text-text-muted">{Number(item.amount ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
