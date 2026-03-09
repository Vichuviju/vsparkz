import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { api } from '../lib/api';

function formatDuration(dur) {
  if (!dur || typeof dur !== 'object') return null;
  return Object.entries(dur)
    .filter(([, v]) => v > 0)
    .map(([u, v]) => `${v} ${u}`)
    .join(', ');
}

export default function PricingPage() {
  const [offerDoc, setOfferDoc] = useState(null);
  const [offerDocs, setOfferDocs] = useState([]);
  const [services, setServices] = useState([]);
  const [subServices, setSubServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [customSubServiceIds, setCustomSubServiceIds] = useState([]);
  const [pricingType, setPricingType] = useState('average');
  const [customPreview, setCustomPreview] = useState(null);
  const [freelancerSelections, setFreelancerSelections] = useState({});
  const [freelancersBySubService, setFreelancersBySubService] = useState([]);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const offerId = urlParams.get('offer');
  const isPreview = urlParams.get('preview') === '1';

  useEffect(() => {
    const load = async () => {
      try {
        const [servicesRes, subRes] = await Promise.all([
          api.get('/public/services').catch(() => ({ data: [] })),
          api.get('/public/sub-services').catch(() => ({ data: [] })),
        ]);
        setServices(Array.isArray(servicesRes.data) ? servicesRes.data : []);
        setSubServices(Array.isArray(subRes.data) ? subRes.data : []);

        if (offerId) {
          try {
            const singleRes = await api.get(`/offer-documents/${offerId}`, {
              params: isPreview ? { preview: 1 } : {},
            });
            setOfferDoc(singleRes.data);
          } catch {
            const docsRes = await api.get('/offer-documents').catch(() => ({ data: [] }));
            const docs = Array.isArray(docsRes.data) ? docsRes.data : [];
            setOfferDocs(docs);
            const one = docs.find((d) => d.id === parseInt(offerId, 10));
            if (one) setOfferDoc(one);
            else if (docs.length > 0) setOfferDoc(docs[0]);
          }
        } else {
          const docsRes = await api.get('/offer-documents').catch(() => ({ data: [] }));
          const docs = Array.isArray(docsRes.data) ? docsRes.data : [];
          setOfferDocs(docs);
          if (docs.length > 0) setOfferDoc(docs[0]);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [offerId, isPreview]);

  useEffect(() => {
    if (customSubServiceIds.length === 0) {
      setCustomPreview(null);
      return;
    }
    const body = { sub_service_ids: customSubServiceIds, pricing_type: pricingType };
    if (pricingType === 'freelance' && Object.keys(freelancerSelections).length > 0) {
      const selections = {};
      customSubServiceIds.forEach((sid) => {
        if (freelancerSelections[sid]) selections[String(sid)] = freelancerSelections[sid];
      });
      if (Object.keys(selections).length > 0) body.freelancer_selections = selections;
    }
    api
      .post('/custom-package-preview', body)
      .then(({ data }) => setCustomPreview(data))
      .catch(() => setCustomPreview(null));
  }, [customSubServiceIds, pricingType, freelancerSelections]);

  useEffect(() => {
    if (pricingType !== 'freelance' || customSubServiceIds.length === 0) {
      setFreelancersBySubService([]);
      setFreelancerSelections({});
      return;
    }
    api
      .post('/custom-package-freelancers', { sub_service_ids: customSubServiceIds })
      .then(({ data }) => setFreelancersBySubService(data.sub_services || []))
      .catch(() => setFreelancersBySubService([]));
  }, [pricingType, customSubServiceIds]);

  const subServicesByService = services.map((s) => ({
    ...s,
    subServices: subServices.filter((ss) => ss.service_id === s.id),
  })).filter((s) => s.subServices.length > 0);

  const toggleCustomSubService = (id) => {
    setCustomSubServiceIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (!next.includes(id)) {
        setFreelancerSelections((s) => {
          const u = { ...s };
          delete u[id];
          return u;
        });
      }
      return next;
    });
  };

  const setFreelancerForSubService = (subServiceId, freelancerId) => {
    setFreelancerSelections((prev) =>
      freelancerId ? { ...prev, [subServiceId]: freelancerId } : (() => { const u = { ...prev }; delete u[subServiceId]; return u; })()
    );
  };

  const getSubServiceName = (id) => subServices.find((s) => s.id === id)?.name ?? '';

  const getFreelancersForSubService = (subServiceId) =>
    freelancersBySubService.find((r) => r.sub_service_id === subServiceId)?.freelancers ?? [];

  const openQuoteWithPackage = (comboId) => {
    setSelectedPackageId(comboId);
    setCustomSubServiceIds([]);
    setShowQuoteModal(true);
  };

  const openQuoteCustom = () => {
    setSelectedPackageId(null);
    setShowQuoteModal(true);
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    setQuoteSubmitting(true);
    setQuoteSuccess(false);
    try {
      const payload = {
        name: quoteForm.name,
        email: quoteForm.email,
        phone: quoteForm.phone,
        company: quoteForm.company,
        message: quoteForm.message,
        source: 'get_quote',
      };
      if (selectedPackageId) {
        payload.selected_combo_package_id = selectedPackageId;
        payload.pricing_type = 'average';
      } else if (customSubServiceIds.length > 0) {
        payload.custom_package_data = {
          sub_service_ids: customSubServiceIds,
          pricing_type: pricingType,
          ...(pricingType === 'freelance' && Object.keys(freelancerSelections).length > 0
            ? { freelancer_selections: freelancerSelections }
            : {}),
        };
        payload.pricing_type = pricingType;
      }
      await api.post('/leads', payload);
      setQuoteSuccess(true);
      setQuoteForm({ name: '', email: '', phone: '', company: '', message: '' });
      setSelectedPackageId(null);
      setCustomSubServiceIds([]);
      setFreelancerSelections({});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit');
    } finally {
      setQuoteSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-text-muted">Loading…</div>
    );
  }
  if (error && !offerDoc) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-accent-bright">{error}</div>
    );
  }
  if (!offerDoc) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Pricing</h1>
        <p className="text-text-muted">No pricing packages are currently available.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pricing &amp; Packages | V-Sparkz</title>
      </Helmet>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-4 rounded-vsparkz-lg bg-navy-800/60 border border-navy-600 p-6">
            {offerDoc.company_name && (
              <h2 className="text-xl font-bold text-text-primary mb-1">{offerDoc.company_name}</h2>
            )}
            {offerDoc.tagline && (
              <p className="text-sm text-text-muted mb-4">{offerDoc.tagline}</p>
            )}
            <h3 className="text-2xl font-bold text-accent mb-4">{offerDoc.pricing_title || 'PRICING'}</h3>
            {offerDoc.sidebar_features && offerDoc.sidebar_features.length > 0 && (
              <ul className="space-y-2 mb-4">
                {offerDoc.sidebar_features.map((f, i) => (
                  <li key={i} className="text-sm text-text-muted flex items-center gap-2">
                    <span className="text-accent">✓</span> {f}
                  </li>
                ))}
              </ul>
            )}
            {offerDoc.payment_note && (
              <p className="text-xs text-text-muted">{offerDoc.payment_note}</p>
            )}
          </div>

          {/* Package columns */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offerDoc.combos && offerDoc.combos.map((combo, idx) => (
              <div key={combo.id} className="rounded-vsparkz-lg border border-navy-600 bg-navy-800/40 p-6 flex flex-col">
                {idx === 0 && offerDoc.limited_offer_text && (
                  <div className="inline-block px-3 py-1 rounded bg-accent/20 text-accent text-xs font-medium mb-3">
                    {offerDoc.limited_offer_text}
                  </div>
                )}
                <h3 className="text-lg font-bold text-text-primary mb-1">{combo.name}</h3>
                <div className="text-2xl font-bold text-text-primary my-2">
                  ₹{Number(combo.total).toLocaleString()}
                </div>
                <div className="text-sm text-accent mb-3">/Month</div>
                {formatDuration(combo.total_duration) && (
                  <p className="text-sm text-text-muted mb-3">{formatDuration(combo.total_duration)} monthly</p>
                )}
                <ul className="space-y-1 text-sm text-text-muted flex-1 mb-4">
                  {combo.items && combo.items.map((item, i) => (
                    <li key={i}>{item.name}{item.quantity > 1 ? ` × ${item.quantity}` : ''}</li>
                  ))}
                </ul>
                {combo.tagline && (
                  <p className="text-sm font-medium text-text-primary mb-4">{combo.tagline}</p>
                )}
                <button
                  type="button"
                  className="btn-primary w-full py-2 text-sm"
                  onClick={() => openQuoteWithPackage(combo.id)}
                >
                  Select this package
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Custom package */}
        <div className="mt-12 rounded-vsparkz-lg border border-navy-600 bg-navy-800/40 p-6">
          <h3 className="text-lg font-bold text-text-primary mb-2">Build custom package</h3>
          <p className="text-sm text-text-muted mb-4">Select services and choose pricing type (average in-house rate or freelance rate).</p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-muted mb-2">Pricing type</label>
            <select
              className="w-full max-w-xs px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary"
              value={pricingType}
              onChange={(e) => setPricingType(e.target.value)}
            >
              <option value="average">Average (in-house)</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-muted mb-2">Select services</label>
            <div className="flex flex-wrap gap-2">
              {subServicesByService.map((s) => (
                <div key={s.id} className="w-full">
                  <span className="text-xs text-text-muted">{s.title}</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {s.subServices.map((ss) => (
                      <label key={ss.id} className="flex items-center gap-1 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customSubServiceIds.includes(ss.id)}
                          onChange={() => toggleCustomSubService(ss.id)}
                        />
                        <span className="text-text-primary">{ss.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {pricingType === 'freelance' && customSubServiceIds.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-muted mb-2">Select freelancer per service</label>
              <p className="text-xs text-text-muted mb-2">Choose a freelancer for each selected service to see their rate in the total.</p>
              <div className="space-y-3">
                {customSubServiceIds.map((sid) => {
                  const name = getSubServiceName(sid);
                  const freelancers = getFreelancersForSubService(sid);
                  return (
                    <div key={sid} className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-text-primary min-w-[140px]">{name}</span>
                      <select
                        className="flex-1 min-w-[180px] px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary text-sm"
                        value={freelancerSelections[sid] ?? ''}
                        onChange={(e) => setFreelancerForSubService(sid, e.target.value ? parseInt(e.target.value, 10) : null)}
                      >
                        <option value="">Select freelancer</option>
                        {freelancers.map((f) => (
                          <option key={f.freelancer_id} value={f.freelancer_id}>
                            {f.name} — ₹{Number(f.amount).toLocaleString()}/mo
                          </option>
                        ))}
                      </select>
                      {freelancers.length === 0 && (
                        <span className="text-xs text-text-muted">No freelancers mapped</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {customPreview && (
            <div className="mb-4 p-3 rounded bg-navy-800/60 text-sm">
              <span className="text-text-muted">Estimated total: </span>
              <span className="font-bold text-text-primary">₹{Number(customPreview.subtotal).toLocaleString()}</span>
              {formatDuration(customPreview.total_duration) && (
                <span className="text-text-muted ml-2">({formatDuration(customPreview.total_duration)})</span>
              )}
            </div>
          )}
          <button
            type="button"
            className="btn-primary px-4 py-2"
            onClick={openQuoteCustom}
            disabled={customSubServiceIds.length === 0}
          >
            Get quote for custom package
          </button>
        </div>
      </div>

      {/* Quote modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-navy-800 border border-navy-600 rounded-vsparkz-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-text-primary mb-4">Get a quote</h3>
            {quoteSuccess ? (
              <p className="text-accent mb-4">Thank you. We will get back to you soon.</p>
            ) : (
              <form onSubmit={handleQuoteSubmit} className="space-y-4">
                <input type="text" placeholder="Name *" required className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={quoteForm.name} onChange={(e) => setQuoteForm((f) => ({ ...f, name: e.target.value }))} />
                <input type="email" placeholder="Email *" required className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={quoteForm.email} onChange={(e) => setQuoteForm((f) => ({ ...f, email: e.target.value }))} />
                <input type="tel" placeholder="Phone" className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={quoteForm.phone} onChange={(e) => setQuoteForm((f) => ({ ...f, phone: e.target.value }))} />
                <input type="text" placeholder="Company" className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={quoteForm.company} onChange={(e) => setQuoteForm((f) => ({ ...f, company: e.target.value }))} />
                <textarea placeholder="Message" rows={3} className="w-full px-3 py-2 bg-navy-800/80 border border-navy-600 rounded-vsparkz text-text-primary" value={quoteForm.message} onChange={(e) => setQuoteForm((f) => ({ ...f, message: e.target.value }))} />
                <div className="flex gap-3">
                  <button type="submit" disabled={quoteSubmitting} className="btn-primary flex-1">Submit</button>
                  <button type="button" className="px-4 py-2 border border-navy-600 rounded-vsparkz text-text-muted hover:text-text-primary" onClick={() => { setShowQuoteModal(false); setQuoteSuccess(false); }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
