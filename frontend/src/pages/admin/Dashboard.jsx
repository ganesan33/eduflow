import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../services/api';
import { BookOpen, Users, Video, TrendingUp, ArrowRight } from 'lucide-react';

export default function AdminDashboard({ user, onLogout }) {
  const [analytics, setAnalytics] = useState(null);
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [analyticsData, coursesData] = await Promise.all([
          api.getAdminAnalytics(),
          api.getAdminCourses()
        ]);
        setAnalytics(analyticsData.analytics || null);
        setCourses(coursesData.courses || []);
      } catch (error) {
        console.error(error);
      }
    };
    loadData();
  }, []);

  const totalVideos = courses.reduce((sum, c) => sum + (c.videos?.length || 0), 0);

  return (
    <DashboardLayout user={user} onLogout={onLogout} title="Admin Dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Overview</h1>
          <p className="page-subtitle">Monitor and manage your learning platform</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card-modern">
          <div className="stat-icon purple">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{analytics?.users?.total || 0}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-icon blue">
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{analytics?.courses?.total || 0}</div>
            <div className="stat-label">Total Courses</div>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-icon green">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{analytics?.courses?.totalEnrollments || 0}</div>
            <div className="stat-label">Total Enrollments</div>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-icon orange">
            <Video size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalVideos}</div>
            <div className="stat-label">Total Videos</div>
          </div>
        </div>
      </div>

      {/* User Breakdown */}
      {analytics?.users && (
        <section className="content-section">
          <h2 className="section-title-modern">User Distribution</h2>
          <div className="user-breakdown-grid">
            <div className="breakdown-card">
              <div className="breakdown-icon student">
                <Users size={24} />
              </div>
              <div className="breakdown-content">
                <div className="breakdown-value">{analytics.users.students || 0}</div>
                <div className="breakdown-label">Students</div>
              </div>
            </div>
            <div className="breakdown-card">
              <div className="breakdown-icon instructor">
                <Users size={24} />
              </div>
              <div className="breakdown-content">
                <div className="breakdown-value">{analytics.users.instructors || 0}</div>
                <div className="breakdown-label">Instructors</div>
              </div>
            </div>
            <div className="breakdown-card">
              <div className="breakdown-icon admin">
                <Users size={24} />
              </div>
              <div className="breakdown-content">
                <div className="breakdown-value">{analytics.users.admins || 0}</div>
                <div className="breakdown-label">Admins</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Courses */}
      <section className="content-section">
        <div className="section-header-modern">
          <h2 className="section-title-modern">Recent Courses</h2>
          <button className="link-btn" onClick={() => navigate('/dashboard/courses')}>
            View all <ArrowRight size={16} />
          </button>
        </div>

        <div className="course-grid-modern">
          {courses.slice(0, 4).map((course) => (
            <div
              key={course._id}
              className="course-card-modern"
              onClick={() => navigate('/dashboard/courses')}
            >
              <div className="course-thumbnail">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} />
                ) : (
                  <div className="course-thumbnail-placeholder">
                    <BookOpen size={40} />
                  </div>
                )}
              </div>
              <div className="course-card-content">
                <h3 className="course-title-modern">{course.title}</h3>
                <p className="course-instructor">{course.instructor?.email || 'System'}</p>
                <div className="course-meta-row">
                  <span className="course-meta-item">
                    <Video size={14} />
                    {course.videos.length} videos
                  </span>
                  <span className="course-meta-item">
                    <Users size={14} />
                    {course.studentsEnrolled?.length || 0} students
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="content-section">
        <h2 className="section-title-modern">Quick Actions</h2>
        <div className="quick-actions-grid">
          <button className="quick-action-card" onClick={() => navigate('/dashboard/courses')}>
            <BookOpen size={24} />
            <span>Manage Courses</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate('/dashboard/instructor-requests')}>
            <Users size={24} />
            <span>Review Requests</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate('/dashboard/analytics')}>
            <TrendingUp size={24} />
            <span>View Analytics</span>
          </button>
        </div>
      </section>
    </DashboardLayout>
  );
}
