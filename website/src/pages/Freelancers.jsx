import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Freelancers() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/freelancers', { params: { per_page: 24 } })
      .then((r) => setList(r.data?.data ?? r.data ?? []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Hire Freelancers</h1>
        <p className="text-text-muted mb-8">Browse skilled freelancers for your projects.</p>
        {error && <div className="mb-4 p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 text-accent-bright text-sm">{error}</div>}
        {loading ? (
          <div className="shimmer-bg rounded-vsparkz-lg h-24 w-full max-w-md" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.length === 0 ? <p className="text-text-muted col-span-full">No freelancers listed yet.</p> : list.map((f) => (
              <Link key={f.id} to={`/freelancers/${f.id}`} className="block glass-card card-hover p-5 no-underline group">
                <h2 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors">{f.name}</h2>
                {f.skills?.length > 0 && <p className="text-sm text-text-muted mt-1">{f.skills.join(', ')}</p>}
                {f.delivery_days && <p className="text-sm text-text-secondary mt-1">Delivery: {f.delivery_days} days</p>}
                <p className="text-accent text-sm mt-2">View profile →</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
