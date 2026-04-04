import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import StudentMyCourses from './pages/student/MyCourses';
import StudentBrowse from './pages/student/Browse';
import StudentCoursePlayer from './pages/student/CoursePlayer';
import StudentBecomeInstructor from './pages/student/BecomeInstructor';

// Instructor pages
import InstructorDashboard from './pages/instructor/Dashboard';
import InstructorMyCourses from './pages/instructor/MyCourses';
import InstructorCreateCourse from './pages/instructor/CreateCourse';
import InstructorAnalytics from './pages/instructor/Analytics';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminCourses from './pages/admin/Courses';
import AdminInstructorRequests from './pages/admin/InstructorRequests';
import AdminAnalytics from './pages/admin/Analytics';

import { api } from './services/api';

function StudentRouter({ user, onLogout }) {
  return (
    <Routes>
      <Route path="/" element={<StudentDashboard user={user} onLogout={onLogout} />} />
      <Route path="/my-courses" element={<StudentMyCourses user={user} onLogout={onLogout} />} />
      <Route path="/browse" element={<StudentBrowse user={user} onLogout={onLogout} />} />
      <Route path="/course/:courseId" element={<StudentCoursePlayer user={user} onLogout={onLogout} />} />
      <Route path="/become-instructor" element={<StudentBecomeInstructor user={user} onLogout={onLogout} />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function InstructorRouter({ user, onLogout }) {
  return (
    <Routes>
      <Route path="/" element={<InstructorDashboard user={user} onLogout={onLogout} />} />
      <Route path="/my-courses" element={<InstructorMyCourses user={user} onLogout={onLogout} />} />
      <Route path="/create-course" element={<InstructorCreateCourse user={user} onLogout={onLogout} />} />
      <Route path="/analytics" element={<InstructorAnalytics user={user} onLogout={onLogout} />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function AdminRouter({ user, onLogout }) {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard user={user} onLogout={onLogout} />} />
      <Route path="/courses" element={<AdminCourses user={user} onLogout={onLogout} />} />
      <Route path="/instructor-requests" element={<AdminInstructorRequests user={user} onLogout={onLogout} />} />
      <Route path="/analytics" element={<AdminAnalytics user={user} onLogout={onLogout} />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function DashboardRouter({ user, onLogout }) {
  if (user.role === 'student') {
    return <StudentRouter user={user} onLogout={onLogout} />;
  }

  if (user.role === 'instructor') {
    return <InstructorRouter user={user} onLogout={onLogout} />;
  }

  return <AdminRouter user={user} onLogout={onLogout} />;
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
        path="/dashboard/*"
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
