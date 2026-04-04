import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../services/api';
import { TrendingUp, Users, BookOpen, Star, Award } from 'lucide-react';

export default function InstructorAnalytics({ user, onLogout }) {
  const [analytics, setAnalytics] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [analyticsData, coursesData] = await Promise.all([
          api.getInstructorAnalytics(),
          api.getMyCourses()
        ]);
        setAnalytics(analyticsData.analytics || null);
        setCourses(coursesData.courses || []);
      } catch (error) {
        console.error(error);
      }
    };
    loadData();
  }, []);

  const totalStudents = courses.reduce((sum, c) => sum + (c.studentsEnrolled?.length || 0), 0);
  const totalVideos = courses.reduce((sum, c) => sum + (c.videos?.length || 0), 0);
  const avgRating = courses.length > 0
    ? (courses.reduce((sum, c) => sum + (c.averageRating || 0), 0) / courses.length).toFixed(1)
    : 0;

  return (
    <DashboardLayout user={user} onLogout={onLogout} title="Analytics">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics & Insights</h1>
          <p className="page-subtitle">Track your teaching performance and student engagement</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card-modern">
          <div className="stat-icon purple">
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{courses.length}</div>
            <div className="stat-label">Total Courses</div>
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
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{analytics?.completionRate || 0}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-icon orange">
            <Star size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{avgRating}</div>
            <div className="stat-label">Average Rating</div>
          </div>
        </div>
      </div>

      {/* Top Courses */}
      {analytics?.topCourses && analytics.topCourses.length > 0 && (
        <section className="content-section">
          <h2 className="section-title-modern">Top Performing Courses</h2>
          <div className="analytics-table">
            <div className="analytics-table-header">
              <div>Course</div>
              <div>Students</div>
              <div>Completion</div>
              <div>Rating</div>
            </div>
            {analytics.topCourses.map((course) => (
              <div key={course.courseId} className="analytics-table-row">
                <div className="analytics-course-name">{course.title}</div>
                <div className="analytics-stat">
                  <Users size={16} />
                  {course.enrollments}
                </div>
                <div className="analytics-stat">
                  <TrendingUp size={16} />
                  {course.completionRate}%
                </div>
                <div className="analytics-stat">
                  <Star size={16} />
                  {Number(course.averageRating || 0).toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Courses Performance */}
      <section className="content-section">
        <h2 className="section-title-modern">All Courses Performance</h2>
        <div className="course-performance-grid">
          {courses.map((course) => (
            <div key={course._id} className="performance-card">
              <h3>{course.title}</h3>
              <div className="performance-stats">
                <div className="performance-stat">
                  <span className="performance-label">Students</span>
                  <span className="performance-value">{course.studentsEnrolled?.length || 0}</span>
                </div>
                <div className="performance-stat">
                  <span className="performance-label">Videos</span>
                  <span className="performance-value">{course.videos?.length || 0}</span>
                </div>
                <div className="performance-stat">
                  <span className="performance-label">Rating</span>
                  <span className="performance-value">
                    {Number(course.averageRating || 0).toFixed(1)} ⭐
                  </span>
                </div>
                <div className="performance-stat">
                  <span className="performance-label">Reviews</span>
                  <span className="performance-value">{course.ratingsCount || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
