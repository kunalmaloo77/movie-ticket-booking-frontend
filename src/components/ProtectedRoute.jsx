import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from './Button';

// Waits for the session check, then sends signed-out users away. Admin
// routes are also enforced by the API; this only avoids rendering them.
export default function ProtectedRoute({ children, admin }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center py-24" role="status" aria-label="Loading">
        <Spinner />
      </div>
    );
  }
  if (!user) return <Navigate to={admin ? '/admin/login' : '/'} replace />;
  if (admin && user.role !== 'ADMIN') return <Navigate to="/admin/login" replace />;

  return children ?? <Outlet />;
}
