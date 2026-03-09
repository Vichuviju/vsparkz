import { Link } from 'react-router-dom';

const cards = [
  { to: '/dashboard/projects', title: 'Active Projects', desc: 'View and approve your projects', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { to: '/dashboard/quotations', title: 'Quotations', desc: 'Review and approve quotations', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to: '/dashboard/invoices', title: 'Invoices', desc: 'View and pay invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to: '/dashboard/agreements', title: 'Agreements', desc: 'Sign and manage agreements', icon: 'M9 12h6m-6 4h6m-6-8h6M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z' },
  { to: '/dashboard/reports', title: 'Campaign Reports', desc: 'Download your campaign reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { to: '/freelancers', title: 'Hire Freelancers', desc: 'Browse and hire for your projects', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { to: '/tools/seo-analyzer', title: 'Tools', desc: 'SEO, Meta Analyzer, Strategy Planner', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
];

export default function DashboardHome() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Client Dashboard</h1>
      <p className="text-text-muted mb-8">Welcome. Use the cards below or the sidebar to access reports, invoices, and tools.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map(({ to, title, desc, icon }) => (
          <Link
            key={to}
            to={to}
            className="glass-card card-hover p-5 block no-underline group"
          >
            <div className="w-10 h-10 rounded-vsparkz bg-accent/20 flex items-center justify-center mb-3 group-hover:bg-accent/30 transition-colors">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
            </div>
            <h2 className="font-semibold text-text-primary group-hover:text-accent transition-colors">{title}</h2>
            <p className="text-sm text-text-muted mt-1">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
