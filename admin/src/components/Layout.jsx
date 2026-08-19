import { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessPath } from '../config/permissions';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { SubscriptionExpiredScreen } from './SubscriptionExpiredScreen';
import { logoUrl } from '../lib/publicUrl';

export function Layout() {
  const { user, loading, branding } = useAuth();
  const location = useLocation();
  const path = location.pathname;
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const role = (user?.role ?? user?.effective_role ?? '').toString().trim().toLowerCase();
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const headerLogoSrc = logoUrl(branding?.branding?.logo_path);
  const brandName = branding?.branding?.brand_name ?? 'V-Sparkz Digital';

  useEffect(() => {
    const handler = () => setSubscriptionExpired(true);
    window.addEventListener('subscription-expired', handler);
    return () => window.removeEventListener('subscription-expired', handler);
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [path]);

  const allowed = !!user && canAccessPath(path, role, permissions);

  if (!loading && user && !allowed) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-dvh flex overflow-x-hidden">
      {subscriptionExpired && <SubscriptionExpiredScreen />}
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 w-full lg:ml-64 relative z-30">
        <header className="sticky top-0 z-30 min-h-14 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-2 px-3 sm:px-6 shrink-0 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              className="lg:hidden shrink-0 p-2.5 -ml-1 rounded-xl text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open menu"
              onClick={() => setNavOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <img src={headerLogoSrc} alt="" className="lg:hidden h-8 w-8 object-contain shrink-0" />
            <span className="lg:hidden truncate text-sm font-black text-slate-800 dark:text-white">{brandName}</span>

            <div className="relative hidden sm:block w-full max-w-xs lg:w-80">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="search"
                placeholder="Search anything..."
                className="w-full pl-9 pr-4 py-2 text-sm lg:text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white placeholder-slate-400 border border-slate-100 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <button type="button" className="hidden md:inline-flex p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/10 transition-transform active:scale-95">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
            <button type="button" className="hidden sm:inline-flex p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </button>
            <button type="button" className="hidden sm:inline-flex p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors relative">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l3.076-3.076a48.744 48.744 0 005.952-.369c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </button>
            <button type="button" className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors relative">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
            <div className="hidden sm:block w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1" />
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center uppercase shadow-sm border border-slate-100 dark:border-slate-800">
              {user?.name ? user.name.slice(0, 2) : 'VI'}
            </div>
          </div>
        </header>
        <main className="flex-1 p-3 sm:p-4 lg:p-6 min-h-0 bg-slate-50 dark:bg-slate-950 w-full max-w-full overflow-x-hidden pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
