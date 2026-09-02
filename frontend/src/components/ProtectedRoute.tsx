import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean; // New prop to strict-check admin routes
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  let isAdmin = false;
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      isAdmin = user.role === 'admin';
    } catch (e) {}
  }

  // 1. If a normal user tries to access an admin route, kick them to dashboard
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // 2. If an admin tries to access a normal user route, force them back to admin
  if (!requireAdmin && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};