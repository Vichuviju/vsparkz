import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5173';

/**
 * Protects client dashboard: requires auth and role === 'client'.
 * If not logged in -> /login. If logged in but not client -> redirect to admin.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, isClient } = useAuth();
  const location = useLocation();

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

  if (!isClient) {
    window.location.href = ADMIN_URL;
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <p className="text-gray-400">Redirecting to admin panel...</p>
      </div>
    );
  }

  return children;
}
