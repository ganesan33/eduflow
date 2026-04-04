import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../services/api';
import {
  BookOpen, Play, TrendingUp, Award, Clock, ArrowRight, Star
} from 'lucide-react';

function calculateProgress(course) {
  if (!course.videos.length) return 0;
  return Math.round(((course.watchedVideos?.length || 0) / course.videos.length) * 100);
}

export default function StudentDashboard({ user, onLogout }) {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [enrolled, available] = await Promise.all([
          api.getEnrolledCourses(),
          api.getCourses({ sort: 'top-rated' })
        ]);
        setEnrolledCourses(enrolled.courses || []);
        setRecommendedCourses((available.courses || []).slice(0, 4));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const inProgressCourses = enrolledCourses.filter(c => {
    const progress = calculateProgress(c);
    return progress > 0 && progress < 100;
  });

  const completedCount = enrolledCourses.filter(c => calculateProgress(c) === 100).length;

  return (
    <DashboardLayout user={user} onLogout={onLogout} title="Dashboard">
      {/* Welcome Section */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user.email.split('@')[0]}!</h1>
          <p className="page-subtitle">Continue your learning journey</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card-modern">
          <div className="stat-icon purple">
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{enrolledCourses.length}</div>
            <div className="stat-label">Enrolled Courses</div>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-icon blue">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{inProgressCourses.length}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-icon green">
            <Award size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{completedCount}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-icon orange">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{enrolledCourses.reduce((sum, c) => sum + c.videos.length, 0)}</div>
            <div className="stat-label">Total Videos</div>
          </div>
        </div>
      </div>

      {/* Continue Learning */}
      {inProgressCourses.length > 0 && (
        <section className="content-section">
          <div className="section-header-modern">
            <h2 className="section-title-modern">Continue Learning</h2>
            <button 
              className="link-btn"
              onClick={() => navigate('/dashboard/my-courses')}
            >
              View all <ArrowRight size={16} />
            </button>
          </div>

          <div className="course-grid-modern">
            {inProgressCourses.slice(0, 3).map((course) => {
              const progress = calculateProgress(course);
              return (
                <div 
                  key={course._id} 
                  className="course-card-modern"
                  onClick={() => navigate(`/dashboard/course/${course._id}`)}
                >
                  <div className="course-thumbnail">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} />
                    ) : (
                      <div className="course-thumbnail-placeholder">
                        <BookOpen size={40} />
                      </div>
                    )}
                    <div className="course-progress-overlay">
                      <div className="progress-bar-mini">
                        <div className="progress-fill-mini" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="course-card-content">
                    <h3 className="course-title-modern">{course.title}</h3>
                    <p className="course-instructor">{course.instructor?.email || 'EduFlow'}</p>
                    <div className="course-meta-row">
                      <span className="course-meta-item">
                        <Play size={14} />
                        {course.watchedVideos?.length || 0}/{course.videos.length} videos
                      </span>
                    </div>
                    <div className="course-progress-info">
                      <span>{progress}% complete</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recommended Courses */}
      <section className="content-section">
        <div className="section-header-modern">
          <h2 className="section-title-modern">Recommended for You</h2>
          <button 
            className="link-btn"
            onClick={() => navigate('/dashboard/browse')}
          >
            Browse all <ArrowRight size={16} />
          </button>
        </div>

        <div className="course-grid-modern">
          {recommendedCourses.map((course) => (
            <div 
              key={course._id} 
              className="course-card-modern"
              onClick={() => navigate('/dashboard/browse')}
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
                <p className="course-instructor">{course.instructor?.email || 'EduFlow'}</p>
                <div className="course-meta-row">
                  <span className="course-meta-item">
                    <Play size={14} />
                    {course.videos.length} videos
                  </span>
                  <span className="course-meta-item">
                    <Star size={14} />
                    {Number(course.averageRating || 0).toFixed(1)}
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
          <button 
            className="quick-action-card"
            onClick={() => navigate('/dashboard/browse')}
          >
            <BookOpen size={24} />
            <span>Browse Courses</span>
          </button>
          <button 
            className="quick-action-card"
            onClick={() => navigate('/dashboard/my-courses')}
          >
            <Play size={24} />
            <span>My Learning</span>
          </button>
          <button 
            className="quick-action-card"
            onClick={() => navigate('/dashboard/become-instructor')}
          >
            <Award size={24} />
            <span>Become Instructor</span>
          </button>
        </div>
      </section>
    </DashboardLayout>
  );
}
