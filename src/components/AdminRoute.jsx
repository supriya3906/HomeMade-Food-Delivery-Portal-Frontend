import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Authentication + authorization for admin pages: must be signed in AND have the "admin" role.
// (The API enforces the same rule on every /api/admin request, so hiding the page is only a convenience.)
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, initializing } = useAuth();
  const location = useLocation();
  if (initializing) return null;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace state={{ from: location }} />;
  if (!isAdmin) return <Navigate to="/home" replace />;
  return children;
};

export default AdminRoute;
