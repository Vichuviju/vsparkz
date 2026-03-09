import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';

export function AgreementDetail() {
  const { id } = useParams();
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleDownloadPdf = async () => {
    try {
      const response = await api.get(`/admin/agreements/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agreement-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      window.open(`${api.defaults.baseURL}/admin/agreements/${id}/pdf`, '_blank');
    }
  };

  useEffect(() => {
    if (!id) return;
    api.get(`/admin/agreements/${id}`)
      .then(({ data }) => setAgreement(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load agreement'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-text-muted">Loading…</div>;
  if (error || !agreement) return <div className="p-8"><div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright">{error || 'Agreement not found'}</div><Link to="/agreements" className="text-accent hover:underline">Back to Agreements</Link></div>;

  return (
    <div>
      <div className="mb-6">
        <Link to="/agreements" className="text-sm text-text-muted hover:text-accent mb-1 inline-block">← Agreements</Link>
        <h1 className="text-2xl font-bold text-text-primary">{agreement.title}</h1>
        <p className="text-text-muted text-sm mt-1">
          Client: <Link to={`/clients/${agreement.client_id}`} className="text-accent hover:underline">{agreement.client?.company_name ?? agreement.client_id}</Link>
          {agreement.project_id && <> · Project: <Link to={`/projects/${agreement.project_id}`} className="text-accent hover:underline">{agreement.project?.name ?? agreement.project_id}</Link></>}
          {' · '}Status: <span className="inline-flex px-2 py-0.5 rounded text-xs bg-accent/20 text-accent">{agreement.status}</span>
        </p>
      </div>

      <div className="mb-4">
        <button type="button" className="btn-primary px-4 py-2" onClick={handleDownloadPdf}>Download PDF</button>
      </div>
      <div className="glass-card p-6">
        <dl className="space-y-3 text-sm">
          <div><dt className="text-text-muted font-medium">Scope</dt><dd className="text-text-primary mt-1 whitespace-pre-wrap">{agreement.scope ?? '—'}</dd></div>
          <div><dt className="text-text-muted font-medium">Timeline</dt><dd className="text-text-primary mt-1">{agreement.timeline ?? '—'}</dd></div>
          <div><dt className="text-text-muted font-medium">Payment terms</dt><dd className="text-text-primary mt-1">{agreement.payment_terms ?? '—'}</dd></div>
          <div><dt className="text-text-muted font-medium">Signed at</dt><dd className="text-text-primary mt-1">{agreement.signed_at ? new Date(agreement.signed_at).toLocaleString() : '—'}</dd></div>
          <div><dt className="text-text-muted font-medium">Created</dt><dd className="text-text-primary mt-1">{agreement.created_at ? new Date(agreement.created_at).toLocaleString() : '—'}</dd></div>
        </dl>
      </div>
    </div>
  );
}
