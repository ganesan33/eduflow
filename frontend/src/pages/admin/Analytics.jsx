import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../services/api';
import { Users, BookOpen, TrendingUp, Star, Award } from 'lucide-react';

export default function AdminAnalytics({ user, onLogout }) {
  const [analytics, setAnalytics] = useState(null);
  const [courses, setCourses] = useState([]);

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
    <DashboardLayout user={user} onLogout={onLogout} title="Platform Analytics">
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Analytics</h1>
          <p className="page-subtitle">Comprehensive insights into platform performance</p>
        </div>
      </div>

      {/* Overview Stats */}
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
            <Star size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{Number(analytics?.courses?.averageRating || 0).toFixed(1)}</div>
            <div className="stat-label">Average Rating</div>
          </div>
        </div>
      </div>

      {/* User Distribution */}
      {analytics?.users && (
        <section className="content-section">
          <h2 className="section-title-modern">User Distribution</h2>
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-card-header">
                <Users size={20} />
                <h3>Students</h3>
              </div>
              <div className="analytics-card-value">{analytics.users.students || 0}</div>
              <div className="analytics-card-footer">
                {((analytics.users.students / analytics.users.total) * 100).toFixed(1)}% of total users
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-header">
                <Award size={20} />
                <h3>Instructors</h3>
              </div>
              <div className="analytics-card-value">{analytics.users.instructors || 0}</div>
              <div className="analytics-card-footer">
                {((analytics.users.instructors / analytics.users.total) * 100).toFixed(1)}% of total users
              </div>
            </div>

            <div className="analytics-card">
              <div className="analytics-card-header">
                <Users size={20} />
                <h3>Admins</h3>
              </div>
              <div className="analytics-card-value">{analytics.users.admins || 0}</div>
              <div className="analytics-card-footer">
                {((analytics.users.admins / analytics.users.total) * 100).toFixed(1)}% of total users
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Course Statistics */}
      <section className="content-section">
        <h2 className="section-title-modern">Course Statistics</h2>
        <div className="stats-table">
          <div className="stats-table-row">
            <span className="stats-table-label">Total Courses</span>
            <span className="stats-table-value">{analytics?.courses?.total || 0}</span>
          </div>
          <div className="stats-table-row">
            <span className="stats-table-label">Total Enrollments</span>
            <span className="stats-table-value">{analytics?.courses?.totalEnrollments || 0}</span>
          </div>
          <div className="stats-table-row">
            <span className="stats-table-label">Average Rating</span>
            <span className="stats-table-value">{Number(analytics?.courses?.averageRating || 0).toFixed(2)} ⭐</span>
          </div>
          <div className="stats-table-row">
            <span className="stats-table-label">Total Videos</span>
            <span className="stats-table-value">{totalVideos}</span>
          </div>
          <div className="stats-table-row">
            <span className="stats-table-label">Avg Enrollments per Course</span>
            <span className="stats-table-value">
              {analytics?.courses?.total > 0
                ? Math.round(analytics.courses.totalEnrollments / analytics.courses.total)
                : 0}
            </span>
          </div>
        </div>
      </section>

      {/* Top Courses */}
      <section className="content-section">
        <h2 className="section-title-modern">Most Popular Courses</h2>
        <div className="top-courses-list">
          {courses
            .sort((a, b) => (b.studentsEnrolled?.length || 0) - (a.studentsEnrolled?.length || 0))
            .slice(0, 5)
            .map((course, index) => (
              <div key={course._id} className="top-course-item">
                <span className="top-course-rank">#{index + 1}</span>
                <div className="top-course-info">
                  <h4>{course.title}</h4>
                  <p>by {course.instructor?.email || 'System'}</p>
                </div>
                <div className="top-course-stats">
                  <span className="top-course-stat">
                    <Users size={16} />
                    {course.studentsEnrolled?.length || 0} students
                  </span>
                  <span className="top-course-stat">
                    <Star size={16} />
                    {Number(course.averageRating || 0).toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
