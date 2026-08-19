import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logoUrl } from '../lib/publicUrl';

const nav = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/dashboard/projects', label: 'Active Projects', end: false },
  { to: '/dashboard/quotations', label: 'Quotations', end: false },
  { to: '/dashboard/invoices', label: 'Invoices', end: false },
  { to: '/dashboard/agreements', label: 'Agreements', end: false },
  { to: '/dashboard/reports', label: 'Campaign Reports', end: false },
  { to: '/dashboard/support', label: 'Support', end: true },
  { to: '/freelancers', label: 'Hire Freelancers', end: true },
  { to: '/tools/seo-analyzer', label: 'Tools', end: false },
];

export default function ClientDashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-dvh flex bg-gradient-navy overflow-x-hidden">
      {open ? (
        <button type="button" className="lg:hidden fixed inset-0 z-40 bg-black/50" aria-label="Close menu" onClick={() => setOpen(false)} />
      ) : null}
      <aside
        className={`w-[min(17rem,88vw)] glass border-r border-surface-border flex flex-col fixed inset-y-0 left-0 z-50 h-full transform transition-transform duration-200 pt-[env(safe-area-inset-top)] ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-surface-border">
          <Link to="/dashboard" className="inline-flex items-center gap-3 no-underline">
            <img src={logoUrl('logo/logo1.png')} alt="V-Sparkz Digital" className="h-10 w-10 sm:h-14 sm:w-14 object-contain shrink-0" />
            <span className="text-base font-semibold text-accent">V-Sparkz</span>
          </Link>
          <p className="text-text-muted text-xs mt-1">Client Portal</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-vsparkz text-sm no-underline transition-all ${
                  isActive ? 'bg-accent/20 text-accent border border-accent/30' : 'text-text-muted hover:bg-navy-700/80 hover:text-text-primary border border-transparent'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-surface-border pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-text-muted text-xs truncate px-2" title={user?.email}>{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 w-full px-3 py-2.5 text-left text-sm text-text-muted hover:bg-navy-700 hover:text-text-primary rounded-vsparkz transition-all"
          >
            Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 w-full lg:ml-64">
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-2 px-3 py-2 border-b border-surface-border bg-[#0E2A3B]/90 backdrop-blur pt-[max(0.5rem,env(safe-area-inset-top))]">
          <button type="button" className="p-2.5" aria-label="Open menu" onClick={() => setOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="font-semibold text-sm">Client Portal</span>
        </header>
        <main className="flex-1 p-3 sm:p-6 w-full max-w-full overflow-x-hidden pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
