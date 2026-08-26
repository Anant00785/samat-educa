import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading HyperCampus AI...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const roleRedirects = {
      ADMIN: '/admin',
      FACULTY: '/faculty',
      STUDENT: '/student',
      PARENT: '/parent',
    };
    return <Navigate to={roleRedirects[user.role] || '/login'} replace />;
  }

  return children;
}
