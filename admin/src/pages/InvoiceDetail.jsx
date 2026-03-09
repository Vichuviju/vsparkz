import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';

export function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handlePdf = async () => {
    try {
      const response = await api.get(`/admin/invoices/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('PDF download error:', err);
      setError('Failed to download PDF. Try opening in a new tab.');
      window.open(`/admin/invoices/${id}/pdf`, '_blank');
    }
  };

  useEffect(() => {
    if (!id) return;
    api.get(`/admin/invoices/${id}`)
      .then(({ data }) => setInvoice(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load invoice'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center dark:text-text-muted text-gray-500">Loading…</div>;
  if (error || !invoice) return <div className="p-8"><div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 dark:text-accent-bright text-cyan-800">{error || 'Invoice not found'}</div><Link to="/invoices" className="text-accent hover:underline">Back to Invoices</Link></div>;

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const payments = invoice.payments || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/invoices" className="text-sm dark:text-text-muted text-gray-500 hover:text-accent mb-1 inline-block">← Invoices</Link>
          <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900 font-mono">{invoice.number}</h1>
          <p className="dark:text-text-muted text-gray-500 text-sm mt-1">
            Client: <Link to={`/clients/${invoice.client_id}`} className="text-accent hover:underline">{invoice.client?.company_name ?? invoice.client_id}</Link>
            {' · '}Status: <span className="inline-flex px-2 py-0.5 rounded text-xs bg-accent/20 text-accent">{invoice.status}</span>
          </p>
        </div>
        <button className="btn-primary px-4 py-2" onClick={handlePdf}>Download PDF</button>
      </div>

      <div className="glass-card p-6 mb-6">
        <h2 className="font-semibold dark:text-text-primary text-gray-900 mb-3">Summary</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="dark:text-text-muted text-gray-500">Subtotal</dt><dd className="dark:text-text-primary text-gray-900">{Number(invoice.subtotal ?? 0).toFixed(2)}</dd>
          <dt className="dark:text-text-muted text-gray-500">Tax rate</dt><dd className="dark:text-text-primary text-gray-900">{Number(invoice.tax_rate ?? 0).toFixed(1)}%</dd>
          <dt className="dark:text-text-muted text-gray-500">Tax amount</dt><dd className="dark:text-text-primary text-gray-900">{Number(invoice.tax_amount ?? 0).toFixed(2)}</dd>
          <dt className="dark:text-text-muted text-gray-500">Total</dt><dd className="dark:text-text-primary text-gray-900 font-semibold">{Number(invoice.total ?? 0).toFixed(2)}</dd>
          <dt className="dark:text-text-muted text-gray-500">Due date</dt><dd className="dark:text-text-primary text-gray-900">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}</dd>
        </dl>
      </div>

      <div className="glass-card overflow-hidden mb-6">
        <h2 className="px-5 py-3 border-b dark:border-navy-600 border-gray-200 font-semibold dark:text-text-primary text-gray-900">Line items</h2>
        {items.length === 0 ? (
          <p className="px-5 py-4 dark:text-text-muted text-gray-500 text-sm">No line items.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="dark:bg-navy-800/50 bg-gray-50 text-left"><th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Description</th><th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Amount</th></tr></thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-t dark:border-navy-600 border-gray-100">
                  <td className="px-5 py-3 dark:text-text-primary text-gray-900">{item.description ?? '—'}</td>
                  <td className="px-5 py-3 dark:text-text-muted text-gray-500">{Number(item.amount ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <h2 className="px-5 py-3 border-b dark:border-navy-600 border-gray-200 font-semibold dark:text-text-primary text-gray-900">Payments</h2>
        {payments.length === 0 ? (
          <p className="px-5 py-4 dark:text-text-muted text-gray-500 text-sm">No payments yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="dark:bg-navy-800/50 bg-gray-50 text-left"><th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Amount</th><th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Method</th><th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Date</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t dark:border-navy-600 border-gray-100">
                  <td className="px-5 py-3 dark:text-text-primary text-gray-900">{Number(p.amount).toFixed(2)}</td>
                  <td className="px-5 py-3 dark:text-text-muted text-gray-500">{p.method ?? '—'}</td>
                  <td className="px-5 py-3 dark:text-text-muted text-gray-500">{p.paid_at ? new Date(p.paid_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
