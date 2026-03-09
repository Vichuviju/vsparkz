import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function DefaultLanding() {
  const [plans, setPlans] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    api.get('/plans').then((r) => setPlans(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    api.get('/testimonials').then((r) => setTestimonials(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const features = [
    { title: 'AI-Powered Strategy', desc: 'Data-driven campaigns with intelligent recommendations.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { title: 'Unified Dashboard', desc: 'SEO, ads, influencer, and reports in one place.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { title: 'Agency-Grade Tools', desc: 'Lead CRM, projects, quotations, and agreements.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  return (
    <div className="landing-page">
      {/* Hero */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-navy" />
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-muted/10 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4 animate-fade-in">
            AI-Powered Digital Marketing
            <span className="block text-accent mt-2">All-in-One Platform</span>
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto mb-10 animate-slide-up">
            Scale brands with intelligent campaigns. SEO, ads, influencer marketing, and analytics in one trusted platform.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/get-quote" className="btn-primary px-8 py-3.5 text-base inline-flex items-center gap-2">
              Get a quote
            </Link>
            <Link to="/contact" className="rounded-vsparkz border border-surface-border bg-navy-800/60 px-8 py-3.5 text-base font-medium text-text-primary hover:bg-navy-700 hover:border-accent/20 transition-all">
              Contact us
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-surface-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-4">Built for modern agencies</h2>
          <p className="text-text-muted text-center max-w-2xl mx-auto mb-12">Everything you need to run and scale digital marketing.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="glass-card card-hover p-6">
                <div className="w-12 h-12 rounded-vsparkz-lg bg-accent/20 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                  </svg>
                </div>
                <h3 className="font-semibold text-text-primary text-lg mb-2">{f.title}</h3>
                <p className="text-text-muted text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      {plans.length > 0 && (
        <section className="py-20 px-4 border-t border-surface-border bg-navy-950/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-text-primary text-center mb-4">Simple pricing</h2>
            <p className="text-text-muted text-center mb-12">Choose a plan that fits your needs.</p>
            <div className="grid md:grid-cols-3 gap-6">
              {plans.slice(0, 3).map((plan) => (
                <div key={plan.id} className="glass-card card-hover p-6 rounded-vsparkz-lg">
                  <h3 className="font-semibold text-text-primary text-lg">{plan.name}</h3>
                  <p className="mt-2 text-2xl font-bold text-accent">
                    {plan.currency === 'INR' && '₹'}
                    {plan.price}
                    <span className="text-sm font-normal text-text-muted">/{plan.duration_days ? `${plan.duration_days} days` : 'mo'}</span>
                  </p>
                  <Link to="/get-quote" className="mt-4 inline-block rounded-vsparkz border border-accent/50 bg-accent/10 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/20 transition-all">
                    Get started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-20 px-4 border-t border-surface-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-text-primary text-center mb-12">What clients say</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {testimonials.slice(0, 4).map((t) => (
                <div key={t.id} className="glass-card p-5">
                  <p className="text-text-primary text-sm mb-4">&ldquo;{t.content}&rdquo;</p>
                  <p className="font-medium text-accent">{t.client_name}</p>
                  {t.company && <p className="text-text-muted text-xs">{t.company}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 px-4 border-t border-surface-border">
        <div className="max-w-3xl mx-auto text-center glass-card p-10">
          <h2 className="text-2xl font-bold text-text-primary mb-2">Ready to grow?</h2>
          <p className="text-text-muted mb-6">Get a custom quote or start with our free tools.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/get-quote" className="btn-primary px-6 py-3">Get a quote</Link>
            <Link to="/tools/seo-analyzer" className="rounded-vsparkz border border-surface-border bg-navy-800/60 px-6 py-3 text-text-primary hover:bg-navy-700 transition-all">Free SEO tool</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
