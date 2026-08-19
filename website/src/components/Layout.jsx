import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { getSiteSettings } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { logoUrl } from '../lib/publicUrl'

const nav = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/services', label: 'Services' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/offers', label: 'Offers' },
  { path: '/influencer-marketing', label: 'Influencer Marketing' },
  { path: '/case-studies', label: 'Case Studies' },
  { path: '/clients', label: 'Clients' },
  { path: '/contact', label: 'Contact' },
]

export default function Layout() {
  const location = useLocation()
  const { isAuthenticated, isClient, logout } = useAuth()
  const [site, setSite] = useState({ site_name: 'V-Sparkz', logo_url: null })
  const [logoError, setLogoError] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    getSiteSettings()
      .then(setSite)
      .catch(() => {})
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  const logoSrc = logoUrl(site.logo_url || 'logo/logo3.png')
  const showLogo = logoSrc && !logoError

  const authLinks = isAuthenticated && isClient ? (
    <>
      <Link to="/dashboard" className="text-sm font-medium text-accent hover:text-accent-bright transition-colors">Dashboard</Link>
      <button type="button" onClick={logout} className="rounded-vsparkz bg-navy-700 hover:bg-navy-600 px-4 py-2 text-sm font-medium text-text-primary border border-surface-border transition-all">Logout</button>
    </>
  ) : (
    <>
      <Link to="/get-quote" className="hidden sm:inline text-sm font-medium text-text-muted hover:text-text-primary transition-colors">Get Quote</Link>
      <Link to="/contact" className="rounded-vsparkz px-3 sm:px-4 py-2 text-sm font-medium text-white bg-gradient-accent hover:shadow-glow transition-all">Contact</Link>
      <Link to="/login" className="hidden sm:inline text-sm font-medium text-text-muted hover:text-accent transition-colors">Login</Link>
    </>
  )

  return (
    <div className="min-h-dvh flex flex-col overflow-x-hidden">
      <header className="glass border-b border-surface-border sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-16 sm:min-h-20 py-2 gap-3">
            <Link to="/" className="flex items-center gap-2 sm:gap-4 text-xl font-bold text-text-primary hover:text-accent transition-colors min-w-0">
              {showLogo ? (
                <img
                  src={logoSrc}
                  alt={site.site_name}
                  className="h-10 w-10 sm:h-16 sm:w-16 lg:h-20 lg:w-20 object-contain shrink-0"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <img src={logoUrl('logo/logo1.png')} alt="V-Sparkz" className="h-10 w-10 sm:h-16 sm:w-16 object-contain shrink-0" />
              )}
              <span className="text-sm sm:text-lg font-semibold truncate">{site.site_name || 'V-Sparkz'}</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {nav.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`text-sm font-medium transition-colors whitespace-nowrap ${
                    location.pathname === path
                      ? 'text-accent'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className="hidden md:flex items-center gap-4">{authLinks}</div>
              <button
                type="button"
                className="lg:hidden p-2.5 rounded-xl text-text-primary hover:bg-white/5"
                aria-label="Open menu"
                onClick={() => setMenuOpen(true)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[min(20rem,88vw)] bg-[#0E2A3B] border-l border-surface-border p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="font-semibold">Menu</span>
              <button type="button" className="p-2" aria-label="Close" onClick={() => setMenuOpen(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {nav.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`px-3 py-3 rounded-xl text-sm font-medium ${
                    location.pathname === path ? 'bg-accent/20 text-accent' : 'text-text-muted'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 flex flex-col gap-3">{authLinks}</div>
          </div>
        </div>
      ) : null}

      <main className="flex-1 min-w-0 w-full overflow-x-hidden"><Outlet /></main>
      <footer className="border-t border-surface-border py-8 sm:py-12 bg-navy-950/80 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <span className="text-text-secondary text-sm flex flex-col sm:flex-row items-center gap-2">
              <img src={logoUrl('logo/logo1.png')} alt="V-Sparkz" className="h-10 w-10 sm:h-14 sm:w-14 object-contain shrink-0" />
              © {new Date().getFullYear()} {site.site_name}. All rights reserved.
            </span>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
              <Link to="/contact" className="text-sm text-text-muted hover:text-text-primary transition-colors">Contact</Link>
              <Link to="/pricing" className="text-sm text-text-muted hover:text-text-primary transition-colors">Pricing</Link>
              <Link to="/get-quote" className="text-sm text-text-muted hover:text-text-primary transition-colors">Get Quote</Link>
              <Link to="/influencer-onboarding" className="text-sm text-text-muted hover:text-text-primary transition-colors">Influencer Sign-up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
