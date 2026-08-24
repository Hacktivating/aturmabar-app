import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    // Redirect unauthenticated users to the login interface
    return <Navigate to="/login" replace />;
  }

  // Render the requested component if the token exists
  return <>{children}</>;
};