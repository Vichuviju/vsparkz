import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function FreelancerDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [freelancer, setFreelancer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [callbackSent, setCallbackSent] = useState(false);
  const [assignSent, setAssignSent] = useState(null);
  const [callbackForm, setCallbackForm] = useState({ name: '', email: '', phone: '', work_details: '' });
  const [assignForm, setAssignForm] = useState({ title: '', advance_amount: '' });

  useEffect(() => {
    if (!id) return;
    api.get(`/freelancers/${id}`)
      .then((r) => setFreelancer(r.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const submitCallback = (e) => {
    e.preventDefault();
    setError(null);
    api.post('/freelancers/request-callback', { freelancer_id: freelancer.id, ...callbackForm })
      .then(() => setCallbackSent(true))
      .catch((err) => setError(err.response?.data?.message || 'Request failed'));
  };

  const submitAssign = (e) => {
    e.preventDefault();
    setError(null);
    api.post('/freelancers/assign-with-advance', {
      freelancer_id: freelancer.id,
      title: assignForm.title,
      advance_amount: parseFloat(assignForm.advance_amount) || 0,
    })
      .then((r) => setAssignSent(r.data))
      .catch((err) => setError(err.response?.data?.message || 'Assign failed'));
  };

  if (loading || !freelancer) {
    return (
      <div className="py-12 px-4 min-h-screen">
        <div className="max-w-3xl mx-auto text-text-muted">{loading ? 'Loading…' : error || 'Freelancer not found.'}</div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <Link to="/freelancers" className="text-accent hover:text-accent-bright text-sm mb-4 inline-block">Back to Freelancers</Link>
        <h1 className="text-3xl font-bold text-text-primary mb-2">{freelancer.name}</h1>
        {freelancer.skills?.length > 0 && <p className="text-text-muted mb-2">Skills: {freelancer.skills.join(', ')}</p>}
        {freelancer.delivery_days && <p className="text-text-secondary text-sm">Delivery: {freelancer.delivery_days} days</p>}
        {freelancer.portfolio_links?.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold text-white mb-2">Portfolio</h2>
            <ul className="space-y-1">
              {freelancer.portfolio_links.map((link, i) => (
                <li key={i}>
                  <a href={typeof link === 'string' ? link : link.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-bright">
                    {typeof link === 'string' ? link : link.label || link.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {freelancer.ratings?.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold text-white mb-2">Ratings</h2>
            <ul className="space-y-2 text-text-muted text-sm">
              {freelancer.ratings.slice(0, 5).map((r) => (
                <li key={r.id}>{r.rating != null && '★'.repeat(Math.min(5, r.rating))} {r.comment || '—'}</li>
              ))}
            </ul>
          </div>
        )}

        {error && <div className="mt-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="glass-card p-5">
            <h2 className="font-semibold text-text-primary mb-3">Request callback</h2>
            {callbackSent ? (
              <p className="text-accent-bright text-sm">Request submitted.</p>
            ) : (
              <form onSubmit={submitCallback} className="space-y-3">
                <input type="text" placeholder="Name" value={callbackForm.name} onChange={(e) => setCallbackForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-vsparkz border border-navy-600 bg-navy-800/80 text-text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent/30" required />
                <input type="email" placeholder="Email" value={callbackForm.email} onChange={(e) => setCallbackForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 rounded-vsparkz border border-navy-600 bg-navy-800/80 text-text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent/30" required />
                <input type="text" placeholder="Phone" value={callbackForm.phone} onChange={(e) => setCallbackForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 rounded-vsparkz border border-navy-600 bg-navy-800/80 text-text-primary text-sm" />
                <textarea placeholder="Work details" value={callbackForm.work_details} onChange={(e) => setCallbackForm((f) => ({ ...f, work_details: e.target.value }))} className="w-full px-3 py-2 rounded-vsparkz border border-navy-600 bg-navy-800/80 text-text-primary text-sm" rows={2} />
                <button type="submit" className="btn-primary px-4 py-2 text-sm">Submit</button>
              </form>
            )}
          </div>

          <div className="glass-card p-5">
            <h2 className="font-semibold text-text-primary mb-3">Assign with advance payment</h2>
            {!isAuthenticated ? (
              <p className="text-text-muted text-sm"><Link to="/login" className="text-accent underline">Log in</Link> as a client to create a project and pay an advance.</p>
            ) : assignSent ? (
              <div className="text-sm">
                <p className="text-accent-bright">Project and invoice created.</p>
                <p className="text-text-muted mt-1">Invoice: {assignSent.invoice_number}</p>
                <Link to="/dashboard/invoices" className="text-accent hover:text-accent-bright mt-2 inline-block">View Invoices</Link>
              </div>
            ) : (
              <form onSubmit={submitAssign} className="space-y-3">
                <input type="text" placeholder="Project title" value={assignForm.title} onChange={(e) => setAssignForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-vsparkz border border-navy-600 bg-navy-800/80 text-text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent/30" required />
                <input type="number" step="0.01" min="0.01" placeholder="Advance amount" value={assignForm.advance_amount} onChange={(e) => setAssignForm((f) => ({ ...f, advance_amount: e.target.value }))} className="w-full px-3 py-2 rounded-vsparkz border border-navy-600 bg-navy-800/80 text-text-primary text-sm focus:border-accent focus:ring-1 focus:ring-accent/30" required />
                <button type="submit" className="btn-primary px-4 py-2 text-sm">Create project and invoice</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
