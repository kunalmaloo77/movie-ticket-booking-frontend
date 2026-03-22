import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, admin }) {
  const { user, token } = useAuth();

  if (!token) return <Navigate to={admin ? "/admin/login" : "/login"} />;
  if (admin && user?.role !== "ADMIN") return <Navigate to="/admin/login" />;

  return children ?? <Outlet />;
}
