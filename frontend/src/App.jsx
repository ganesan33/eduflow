import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { api } from './services/api';

function DashboardRouter({ user, onLogout }) {
  if (user.role === 'student') {
    return <StudentDashboard user={user} onLogout={onLogout} />;
  }

  if (user.role === 'instructor') {
    return <InstructorDashboard user={user} onLogout={onLogout} />;
  }

  return <AdminDashboard user={user} onLogout={onLogout} />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await api.getMe();
        setUser(data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      // Ignore server logout failure and clear client state anyway.
    }
    setUser(null);
    navigate('/login');
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage
              onAuthenticated={(authenticatedUser) => {
                setUser(authenticatedUser);
              }}
            />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <DashboardRouter user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
}
