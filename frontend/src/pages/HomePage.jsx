import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const redirects = {
    ADMIN: '/admin',
    FACULTY: '/faculty',
    STUDENT: '/student',
    PARENT: '/parent',
  };

  return <Navigate to={redirects[user.role] || '/login'} replace />;
}
