import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5173';

/** Protects portal (assigned projects): requires auth and role freelancer, employee, or project_manager. */
export default function PortalRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const role = (user?.role ?? user?.effective_role ?? '').toString().trim().toLowerCase();
  const isPortalRole = ['freelancer', 'employee', 'project_manager'].includes(role);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role === 'client') {
    return <Navigate to="/dashboard" replace />;
  }

  if (!isPortalRole) {
    window.location.href = ADMIN_URL;
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <p className="text-gray-400">Redirecting...</p>
      </div>
    );
  }

  return children;
}
