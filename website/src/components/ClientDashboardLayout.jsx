import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-gradient-navy">
      <aside className="w-64 glass border-r border-surface-border flex flex-col fixed h-full">
        <div className="p-4 border-b border-surface-border">
          <Link to="/dashboard" className="inline-flex items-center gap-3 no-underline">
            <img src="/logo/logo1.png" alt="V-Sparkz Digital" className="h-20 w-20 object-contain shrink-0" />
            <span className="text-base font-semibold text-accent">V-Sparkz</span>
          </Link>
          <p className="text-text-muted text-xs mt-1">Client Portal</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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
        <div className="p-3 border-t border-surface-border">
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
      <main className="flex-1 ml-64 p-6">
        <Outlet />
      </main>
    </div>
  );
}
