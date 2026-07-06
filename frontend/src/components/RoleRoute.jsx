import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * A routing guard that restricts access based on user roles.
 * Must be wrapped inside <ProtectedRoute> or check authentication first.
 * 
 * @param {Array} allowedRoles - List of authorized roles (e.g. ['admin', 'doctor'])
 * @param {ReactElement} children - Page content to render if authorized
 */
const RoleRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // 1. Show loading spinner while loading session
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4"></div>
      </div>
    );
  }

  // 2. Redirect to Login if not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Redirect to their default dashboard if their role is not authorized
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`Unauthorized access attempt by '${user.role}' to role-restricted route.`);
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Authorized: Render page content
  return children;
};

export default RoleRoute;
