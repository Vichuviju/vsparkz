import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, requireSubscription = true }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireSubscription) {
    const isSuperAdmin = user?.role === 'super_admin' || user?.is_super_admin === true || user?.is_super_admin === 1;
    // Check if subscription is valid, OR if they have requested VIP
    const isSubscribed = user?.subscription_status === 'active' || user?.subscription_status === 'vip_active';
    
    // Prevent infinite loop if they are already on select-plan
    if (!isSuperAdmin && !isSubscribed && location.pathname !== '/select-plan') {
      return <Navigate to="/select-plan" replace />;
    }
  }

  return children;
}
