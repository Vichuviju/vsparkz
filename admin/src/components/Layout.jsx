import { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessPath } from '../config/permissions';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { SubscriptionExpiredScreen } from './SubscriptionExpiredScreen';

const defaultLogoSrc = '/logo/logo1.png';

export function Layout() {
  const { user, loading, branding } = useAuth();
  const location = useLocation();
  const path = location.pathname;
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const role = (user?.role ?? user?.effective_role ?? '').toString().trim().toLowerCase();
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const headerLogoSrc = branding?.branding?.logo_path ?? defaultLogoSrc;
  const brandName = branding?.branding?.brand_name ?? 'V-Sparkz Digital';

  useEffect(() => {
    const handler = () => setSubscriptionExpired(true);
    window.addEventListener('subscription-expired', handler);
    return () => window.removeEventListener('subscription-expired', handler);
  }, []);

  const allowed = !!user && canAccessPath(path, role, permissions);

  if (!loading && user && !allowed) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex">
      {subscriptionExpired && <SubscriptionExpiredScreen />}
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 min-w-0">
        <header className="min-h-[4.5rem] py-2 dark:bg-navy-900 bg-white border-b dark:border-navy-700 border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <img src={headerLogoSrc} alt={brandName} className="h-14 w-14 object-contain shrink-0" />
            <span className="text-lg font-semibold dark:text-text-primary text-gray-900">Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-6 min-h-screen dark:bg-gradient-to-br dark:from-navy-950 dark:via-navy-900 dark:to-navy-800 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
