import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../services/api';
import { BookOpen, Users, Video, TrendingUp, Plus, ArrowRight, Star } from 'lucide-react';

export default function InstructorDashboard({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [coursesData, analyticsData] = await Promise.all([
          api.getMyCourses(),
          api.getInstructorAnalytics()
        ]);
        setCourses(coursesData.courses || []);
        setAnalytics(analyticsData.analytics || null);
      } catch (error) {
        console.error(error);
      }
    };
    loadData();
  }, []);

  const totalStudents = courses.reduce((sum, c) => sum + (c.studentsEnrolled?.length || 0), 0);
  const totalVideos = courses.reduce((sum, c) => sum + (c.videos?.length || 0), 0);

  return (
    <DashboardLayout user={user} onLogout={onLogout} title="Instructor Dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user.email.split('@')[0]}!</h1>
          <p className="page-subtitle">Manage your courses and track your impact</p>
        </div>
        <button className="primary-btn" onClick={() => navigate('/dashboard/create-course')}>
          <Plus size={20} />
          Create New Course
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card-modern">
          <div className="stat-icon purple">
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{courses.length}</div>
            <div className="stat-label">Published Courses</div>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-icon blue">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalStudents}</div>
            <div className="stat-label">Total Students</div>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-icon green">
            <Video size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalVideos}</div>
            <div className="stat-label">Total Videos</div>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-icon orange">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{analytics?.completionRate || 0}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>
      </div>

      {/* Top Courses */}
      {analytics?.topCourses && analytics.topCourses.length > 0 && (
        <section className="content-section">
          <div className="section-header-modern">
            <h2 className="section-title-modern">Top Performing Courses</h2>
            <button className="link-btn" onClick={() => navigate('/dashboard/analytics')}>
              View Analytics <ArrowRight size={16} />
            </button>
          </div>

          <div className="top-courses-grid">
            {analytics.topCourses.slice(0, 3).map((course) => (
              <div key={course.courseId} className="top-course-card">
                <div className="top-course-header">
                  <h3>{course.title}</h3>
                  <span className="course-badge success">{course.completionRate}% completion</span>
                </div>
                <div className="top-course-stats">
                  <div className="top-course-stat">
                    <Users size={18} />
                    <span>{course.enrollments} students</span>
                  </div>
                  <div className="top-course-stat">
                    <Star size={18} />
                    <span>{Number(course.averageRating || 0).toFixed(1)} rating</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Courses */}
      <section className="content-section">
        <div className="section-header-modern">
          <h2 className="section-title-modern">Your Courses</h2>
          <button className="link-btn" onClick={() => navigate('/dashboard/my-courses')}>
            View all <ArrowRight size={16} />
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state-modern">
            <BookOpen size={48} />
            <h3>No courses yet</h3>
            <p>Create your first course to start teaching</p>
            <button className="primary-btn" onClick={() => navigate('/dashboard/create-course')}>
              <Plus size={20} />
              Create Course
            </button>
          </div>
        ) : (
          <div className="course-grid-modern">
            {courses.slice(0, 4).map((course) => (
              <div
                key={course._id}
                className="course-card-modern"
                onClick={() => navigate('/dashboard/my-courses')}
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
                  <div className="course-tags">
                    <span className="course-tag">{course.category || 'General'}</span>
                    <span className="course-tag">{course.level || 'Beginner'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="content-section">
        <h2 className="section-title-modern">Quick Actions</h2>
        <div className="quick-actions-grid">
          <button className="quick-action-card" onClick={() => navigate('/dashboard/create-course')}>
            <Plus size={24} />
            <span>Create Course</span>
          </button>
          <button className="quick-action-card" onClick={() => navigate('/dashboard/my-courses')}>
            <BookOpen size={24} />
            <span>Manage Courses</span>
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
