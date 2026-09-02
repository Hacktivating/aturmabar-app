import React from 'react';
import { Navigate } from 'react-router-dom';

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <>{children}</>;

  const userStr = localStorage.getItem('user');
  let destination = '/dashboard';
  if (userStr) {
    try {
      const user = JSON.parse(userStr) as { role?: string };
      if (user.role === 'admin') destination = '/admin';
    } catch {
      // Fall back to the regular dashboard when cached profile data is invalid.
    }
  }

  return <Navigate to={destination} replace />;
};