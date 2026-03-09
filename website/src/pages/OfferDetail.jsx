import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../lib/api';

function formatDuration(dur) {
  if (!dur || typeof dur !== 'object') return null;
  return Object.entries(dur)
    .filter(([, v]) => v > 0)
    .map(([u, v]) => `${v} ${u}`)
    .join(', ');
}

export default function OfferDetail() {
  const { id } = useParams();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/offers/${id}`)
      .then(({ data }) => setOffer(data))
      .catch((err) => setError(err.response?.data?.message || 'Offer not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex justify-center">
        <div className="text-text-muted">Loading…</div>
      </div>
    );
  }
  if (error || !offer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-accent-bright">{error || 'Offer not found'}</p>
        <Link to="/offers" className="text-accent hover:underline mt-4 inline-block">Back to offers</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{offer.name} | V-Sparkz</title>
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link to="/offers" className="text-text-muted hover:text-accent text-sm mb-6 inline-block">
          ← Back to offers
        </Link>

        <div className="rounded-vsparkz-lg border border-navy-600 bg-navy-800/40 p-8">
          <h1 className="text-3xl font-bold text-text-primary mb-1">{offer.name}</h1>
          {offer.tagline && (
            <p className="text-lg text-text-muted mb-4">{offer.tagline}</p>
          )}
          {offer.short_description && (
            <p className="text-text-muted mb-6">{offer.short_description}</p>
          )}

          <div className="grid gap-4 mb-8">
            <h2 className="text-lg font-semibold text-text-primary">Included</h2>
            <ul className="space-y-2">
              {offer.items?.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-text-primary">
                  <span className="text-accent mt-0.5">✓</span>
                  <span>
                    {item.name}
                    {item.quantity > 1 && ` × ${item.quantity}`}
                    {item.duration && (
                      <span className="text-text-muted text-sm ml-2">({item.duration})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-navy-600 pt-6">
            <div className="flex justify-between text-text-muted text-sm mb-1">
              <span>Subtotal</span>
              <span>₹{Number(offer.subtotal).toLocaleString()}</span>
            </div>
            {offer.discount > 0 && (
              <div className="flex justify-between text-text-muted text-sm mb-1">
                <span>Discount ({offer.discount_type === 'percent' ? offer.discount_value + '%' : '₹' + offer.discount_value})</span>
                <span>- ₹{Number(offer.discount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-text-primary mt-2">
              <span>Total</span>
              <span>₹{Number(offer.total).toLocaleString()}</span>
            </div>
            {formatDuration(offer.total_duration) && (
              <p className="text-text-muted text-sm mt-2">Estimated time: {formatDuration(offer.total_duration)}</p>
            )}
          </div>

          <div className="mt-8">
            <Link to="/get-quote" className="btn-primary px-6 py-3 inline-block">
              Get a quote
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
