import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessPath } from '../config/permissions';

const defaultLogoSrc = '/logo/logo1.png';

function filterGroupsByRole(groups, role, permissions) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessPath(item.to, role, permissions)),
    }))
    .filter((group) => group.items.length > 0);
}

const superAdminMenuGroup = {
  label: 'Super Admin',
  items: [
    { to: '/super-admin', label: 'Overview', end: true },
    { to: '/roles-permissions', label: 'Roles & Permissions', end: true },
  ],
};

const platformAdminMenuGroup = {
  label: 'Platform Admin (SaaS)',
  items: [
    { to: '/platform-admin', label: 'Dashboard', end: true },
    { to: '/platform-admin/tenants', label: 'Tenants', end: true },
    { to: '/platform-admin/plans', label: 'Plans', end: true },
    { to: '/platform-admin/subscriptions', label: 'Subscriptions', end: true },
  ],
};

const menuGroups = [
  {
    label: 'Dashboard',
    items: [{ to: '/', label: 'Dashboard', end: true }],
  },
  {
    label: 'CRM',
    items: [
      { to: '/leads', label: 'Leads', end: false },
      { to: '/clients', label: 'Clients', end: false },
      { to: '/deals', label: 'Deals', end: false },
    ],
  },
  {
    label: 'Marketing OS',
    items: [
      { to: '/campaigns', label: 'Campaigns', end: false },
      { to: '/social-planner', label: 'Social Planner', end: true },
      { to: '/ads', label: 'Ads', end: true },
      { to: '/seo-workspace', label: 'SEO Workspace', end: true },
      { to: '/email-automation', label: 'Email Automation', end: true },
      { to: '/sms-marketing', label: 'SMS Marketing', end: true },
      { to: '/url-shortener', label: 'URL Shortener', end: true },
    ],
  },
  {
    label: 'Projects & Campaigns',
    items: [
      { to: '/projects', label: 'Projects', end: false },
      { to: '/assign-project', label: 'Assign Project', end: true },
      { to: '/requirement-gatherings', label: 'Requirement handling', end: true },
      { to: '/requirement-templates', label: 'Requirement templates', end: true },
    ],
  },
  {
    label: 'Services & Pricing',
    items: [
      { to: '/services', label: 'Services', end: false },
      { to: '/sub-services', label: 'Sub-Services', end: true },
      { to: '/pricing-levels', label: 'Pricing Levels', end: true },
      { to: '/service-prices', label: 'Service Prices', end: true },
      { to: '/combo-packages', label: 'Combo Packages', end: true },
      { to: '/package-generator', label: 'Package Generator', end: true },
    ],
  },
  {
    label: 'Strategy & Reports',
    items: [
      { to: '/seo-analyzer', label: 'SEO Analyzer', end: true },
      { to: '/strategy-reports', label: 'Strategy Reports', end: false },
      { to: '/reports', label: 'Reports', end: false },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/team', label: 'Team', end: true },
      { to: '/freelancers', label: 'Freelancers', end: false },
      { to: '/influencers', label: 'Influencers', end: false },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/pages', label: 'Pages', end: false },
      { to: '/landing-builder', label: 'Landing Builder', end: true },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/workflows', label: 'Workflows (SOP)', end: true },
      { to: '/vendors', label: 'Vendors', end: true },
      { to: '/knowledge-base', label: 'Knowledge Base', end: true },
      { to: '/support-tickets', label: 'Support Tickets', end: false },
      { to: '/service-packages', label: 'Productized Services', end: true },
      { to: '/brands', label: 'Brands', end: true },
      { to: '/onboarding-questionnaires', label: 'Onboarding', end: true },
      { to: '/forms', label: 'Forms', end: true },
      { to: '/ecommerce', label: 'E-Commerce', end: true },
      { to: '/gamification', label: 'Gamification', end: true },
    ],
  },
  {
    label: 'Compliance',
    items: [{ to: '/compliance', label: 'Audit & Compliance', end: true }],
  },
  {
    label: 'Automation',
    items: [{ to: '/automation', label: 'Automation Workflows', end: true }],
  },
  {
    label: 'Reporting',
    items: [
      { to: '/reports', label: 'Reports', end: false },
      { to: '/report-templates', label: 'Report Templates', end: true },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/invoices', label: 'Invoices', end: false },
      { to: '/quotations', label: 'Quotations', end: false },
      { to: '/agreements', label: 'Agreements', end: true },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/settings', label: 'Settings', end: false },
      { to: '/system-settings', label: 'System Config', end: true },
      { to: '/plans', label: 'Plans', end: true },
      { to: '/integrations', label: 'Integrations', end: false },
      { to: '/tasks-hr', label: 'Tasks', end: false },
      { to: '/agencies', label: 'Agencies', end: false },
    ],
  },
];

function NavItem({ to, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-vsparkz text-sm no-underline transition-all ml-1 border ${
          isActive
            ? 'bg-accent/20 text-accent border-accent/30 dark:text-accent text-blue-600'
            : 'dark:text-text-muted text-gray-600 dark:hover:bg-navy-700/80 dark:hover:text-text-primary hover:bg-gray-200 hover:text-gray-900 border-transparent'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export function Sidebar() {
  const { user, logout, branding } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const role = (user?.role ?? user?.effective_role ?? '').toString().trim().toLowerCase();
  const permissions = user?.permissions ?? [];
  const isSuperAdmin = role === 'super_admin';
  const rawGroups = isSuperAdmin ? [platformAdminMenuGroup, superAdminMenuGroup, ...menuGroups] : menuGroups;
  const allGroups = filterGroupsByRole(rawGroups, role, permissions);
  const logoSrc = branding?.branding?.logo_path ?? defaultLogoSrc;

  const [openGroups, setOpenGroups] = useState(() => {
    const open = {};
    allGroups.forEach((g, i) => {
      const hasActive = g.items.some((it) => (it.to === '/' ? path === '/' : path === it.to || path.startsWith(it.to + '/')));
      open[i] = hasActive;
    });
    return open;
  });

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      allGroups.forEach((g, i) => {
        const hasActive = g.items.some((it) => (it.to === '/' ? path === '/' : path === it.to || path.startsWith(it.to + '/')));
        if (hasActive) next[i] = true;
      });
      return next;
    });
  }, [path, role]);

  const toggleGroup = (i) => {
    setOpenGroups((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 flex flex-col fixed h-full bg-white dark:bg-navy-900 border-r border-gray-200 dark:border-navy-700 shadow-none dark:shadow-[4px_0_24px_rgba(0,0,0,0.15)]">
      <div className="px-4 py-6 border-b border-gray-200 dark:border-navy-700 shrink-0 dark:bg-navy-900 overflow-visible">
        <Link to="/" className="flex items-center gap-4 no-underline">
          <div className="flex shrink-0 items-center justify-center overflow-visible" style={{ minHeight: 72 }}>
            <img
              src={logoSrc}
              alt="V-Sparkz Digital"
              className="h-20 w-20 object-contain object-center"
            />
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-base font-semibold dark:text-text-primary text-gray-900 leading-tight">V-Sparkz</p>
            <p className="dark:text-text-muted text-gray-500 text-xs mt-0.5 leading-tight">Admin Panel</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-2 overflow-y-auto space-y-0.5 dark:bg-navy-900">
        {allGroups.map((group, i) => {
          const isOpen = openGroups[i] !== false;
          const hasActive = group.items.some((it) => path === it.to || (it.to !== '/' && path.startsWith(it.to + '/')));
          return (
            <div key={group.label} className="rounded-vsparkz border border-transparent">
              <button
                type="button"
                onClick={() => toggleGroup(i)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm font-medium rounded-vsparkz transition-all ${
                  hasActive
                    ? 'dark:text-accent text-blue-600 dark:bg-navy-700 bg-gray-100'
                    : 'dark:text-text-primary text-gray-700 dark:hover:bg-navy-700 hover:bg-gray-100'
                }`}
              >
                <span>{group.label}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="pb-1 pt-0.5 space-y-0.5 dark:bg-navy-800/50 bg-gray-50 rounded-lg mx-1 px-1 border border-transparent dark:border-navy-700/50 border-gray-200/80">
                  {group.items.map((item) => (
                    <NavItem key={item.to} to={item.to} label={item.label} end={item.end} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-200 dark:border-navy-700 shrink-0 dark:bg-navy-900">
        <p className="dark:text-text-muted text-gray-600 text-xs truncate px-2" title={user?.email}>{user?.email}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 w-full px-3 py-2.5 text-left text-sm dark:text-text-muted text-gray-600 dark:hover:bg-navy-700 hover:bg-gray-100 hover:text-gray-900 rounded-vsparkz transition-all"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
