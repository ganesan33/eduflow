import React from 'react';
import { Navigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function ProtectedRoute({ user, loading, children }) {
  if (loading) {
    return (
      <div className="loading-screen">
        <BookOpen size={40} style={{ color: 'var(--brand-500)' }} />
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading EduFlow…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

