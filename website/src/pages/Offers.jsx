import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../lib/api';

function formatDuration(dur) {
  if (!dur || typeof dur !== 'object') return null;
  return Object.entries(dur)
    .filter(([, v]) => v > 0)
    .map(([u, v]) => `${v} ${u}`)
    .join(', ');
}

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/offers')
      .then(({ data }) => setOffers(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load offers'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 flex justify-center">
        <div className="text-text-muted">Loading offers…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-accent-bright">{error}</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pricing &amp; Offers | V-Sparkz</title>
      </Helmet>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Pricing &amp; Offers</h1>
        <p className="text-text-muted mb-10">Choose a package that fits your needs.</p>

        {offers.length === 0 ? (
          <p className="text-text-muted">No offers available at the moment.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-vsparkz-lg border border-navy-600 bg-navy-800/40 p-6 flex flex-col"
              >
                <h2 className="text-xl font-semibold text-text-primary mb-1">{offer.name}</h2>
                {offer.tagline && (
                  <p className="text-sm text-text-muted mb-3">{offer.tagline}</p>
                )}
                {offer.short_description && (
                  <p className="text-sm text-text-muted mb-4 line-clamp-2">{offer.short_description}</p>
                )}
                <div className="mt-auto">
                  <div className="text-2xl font-bold text-accent mb-1">
                    ₹{Number(offer.total).toLocaleString()}
                    {offer.discount > 0 && (
                      <span className="text-sm font-normal text-text-muted ml-2">
                        (₹{Number(offer.subtotal).toLocaleString()} before discount)
                      </span>
                    )}
                  </div>
                  {formatDuration(offer.total_duration) && (
                    <p className="text-sm text-text-muted mb-4">
                      Est. {formatDuration(offer.total_duration)}
                    </p>
                  )}
                  <Link
                    to={`/offers/${offer.id}`}
                    className="inline-block btn-primary px-4 py-2 text-sm"
                  >
                    View offer
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
