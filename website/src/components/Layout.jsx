import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { getSiteSettings } from '../lib/api'
import { useAuth } from '../context/AuthContext'

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

const defaultLogo = '/logo/logo3.png'

export default function Layout() {
  const location = useLocation()
  const { isAuthenticated, isClient, logout } = useAuth()
  const [site, setSite] = useState({ site_name: 'V-Sparkz', logo_url: null })
  const [logoError, setLogoError] = useState(false)

  useEffect(() => {
    getSiteSettings()
      .then(setSite)
      .catch(() => {})
  }, [])

  const logoSrc = site.logo_url || defaultLogo
  const showLogo = logoSrc && !logoError

  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass border-b border-surface-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-24 py-3">
            <Link to="/" className="flex items-center gap-4 text-xl font-bold text-text-primary hover:text-accent transition-colors">
              {showLogo ? (
                <img
                  src={logoSrc}
                  alt={site.site_name}
                  className="h-20 w-20 object-contain shrink-0"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <img src="/logo/logo1.png" alt="V-Sparkz" className="h-20 w-20 object-contain shrink-0" />
              )}
              <span className="text-lg font-semibold">{site.site_name || 'V-Sparkz'}</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              {nav.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === path
                      ? 'text-accent'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              {isAuthenticated && isClient ? (
                <>
                  <Link to="/dashboard" className="text-sm font-medium text-accent hover:text-accent-bright transition-colors">Dashboard</Link>
                  <button type="button" onClick={logout} className="rounded-vsparkz bg-navy-700 hover:bg-navy-600 px-4 py-2 text-sm font-medium text-text-primary border border-surface-border transition-all">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/get-quote" className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">Get Quote</Link>
                  <Link to="/contact" className="rounded-vsparkz px-4 py-2 text-sm font-medium text-white bg-gradient-accent hover:shadow-glow transition-all">Contact</Link>
                  <Link to="/login" className="text-sm font-medium text-text-muted hover:text-accent transition-colors">Login</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t border-surface-border py-12 bg-navy-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-text-secondary text-sm flex items-center gap-2">
              <img src="/logo/logo1.png" alt="V-Sparkz" className="h-14 w-14 object-contain shrink-0" />
              © {new Date().getFullYear()} {site.site_name}. All rights reserved.
            </span>
            <div className="flex gap-8">
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
