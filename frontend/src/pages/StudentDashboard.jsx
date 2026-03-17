import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import {
  BookOpen, Play, CheckCircle, Search, X, Award, TrendingUp,
} from 'lucide-react';

function calculateProgress(course) {
  if (!course.videos.length) return 0;
  return Math.round(((course.watchedVideos?.length || 0) / course.videos.length) * 100);
}

export default function StudentDashboard({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setError('');
      const [available, enrolled] = await Promise.all([api.getCourses(), api.getEnrolledCourses()]);
      setCourses(available.courses || []);
      setEnrolledCourses(enrolled.courses || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => { loadData(); }, []);

  const enrolledCourseIds = useMemo(
    () => new Set(enrolledCourses.map((c) => c._id)),
    [enrolledCourses],
  );

  const filteredCourses = useMemo(() => {
    const q = search.toLowerCase();
    return courses.filter(
      (c) => c.title.toLowerCase().includes(q) || c.instructor?.email?.toLowerCase().includes(q),
    );
  }, [courses, search]);

  const completedCount = enrolledCourses.filter((c) => calculateProgress(c) === 100).length;

  const enrollCourse = async (courseId) => {
    try {
      await api.enrollCourse(courseId);
      await loadData();
    } catch (e) {
      setError(e.message);
    }
  };

  const markVideoWatched = async (courseId, videoId, event) => {
    const video = event.currentTarget;
    if (!video.duration || video.dataset.watched === 'true') return;
    if (video.currentTime < video.duration * 0.8) return;
    video.dataset.watched = 'true';
    try {
      await api.markVideoWatched(courseId, videoId);
      const refreshed = await api.getEnrolledCourses();
      setEnrolledCourses(refreshed.courses || []);
      const updated = (refreshed.courses || []).find((c) => c._id === courseId);
      if (updated) setSelectedCourse(updated);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="dashboard-page">
      <Navbar user={user} onLogout={onLogout} />

      <div className="dashboard-content">
        {error && <div className="error-box" style={{ marginBottom: '1.5rem' }}><X size={15} />{error}</div>}

        {/* Hero */}
        <div className="hero-section">
          <div className="hero-greeting">Student Dashboard</div>
          <h1 className="hero-title">Welcome back, {user.email.split('@')[0]}!</h1>
          <p className="hero-subtitle">Continue your learning journey. Keep up the great work!</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">{enrolledCourses.length}</span>
              <span className="hero-stat-label">Enrolled</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">{completedCount}</span>
              <span className="hero-stat-label">Completed</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">{courses.length}</span>
              <span className="hero-stat-label">Available</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-card-icon purple"><BookOpen size={22} /></div>
            <div>
              <div className="stat-card-value">{enrolledCourses.length}</div>
              <div className="stat-card-label">Courses Enrolled</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon green"><Award size={22} /></div>
            <div>
              <div className="stat-card-value">{completedCount}</div>
              <div className="stat-card-label">Completed</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon blue"><TrendingUp size={22} /></div>
            <div>
              <div className="stat-card-value">{courses.length}</div>
              <div className="stat-card-label">Courses Available</div>
            </div>
          </div>
        </div>

        {/* Continue Learning */}
        {enrolledCourses.length > 0 && (
          <div className="section-block">
            <div className="section-header">
              <h2 className="section-title">Continue Learning</h2>
              <span className="pill green">{enrolledCourses.length} Enrolled</span>
            </div>
            <div className="section-body">
              <div className="course-grid">
                {enrolledCourses.map((course) => {
                  const progress = calculateProgress(course);
                  return (
                    <div className="course-card" key={course._id}>
                      <div className="course-card-thumb">
                        {course.thumbnailUrl
                          ? <img src={course.thumbnailUrl} alt={course.title} />
                          : <div className="course-card-thumb-placeholder"><BookOpen size={32} /></div>}
                        {progress === 100 && <span className="enrolled-badge">Done</span>}
                      </div>
                      <div className="course-card-body">
                        <div className="course-card-title">{course.title}</div>
                        <div className="course-card-instructor">
                          {course.instructor?.email || 'EduFlow'}
                        </div>
                        <div className="course-card-meta">
                          <Play size={12} />
                          <span>{course.watchedVideos?.length || 0} / {course.videos.length} videos</span>
                        </div>
                        <div className="course-card-progress">
                          <div className="progress-label">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                        <button
                          className="primary-btn"
                          style={{ width: '100%', height: '38px', fontSize: '0.85rem' }}
                          onClick={() => setSelectedCourse(course)}
                        >
                          <Play size={14} />
                          {progress > 0 ? 'Continue' : 'Start Learning'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Browse / Explore */}
        <div className="section-block">
          <div className="section-header">
            <h2 className="section-title">Explore Courses</h2>
            <div className="search-bar">
              <Search size={15} className="s-icon" />
              <input
                type="text"
                  placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="section-body">
            {filteredCourses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><BookOpen size={28} /></div>
                <h4>No courses found</h4>
                <p>Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="course-grid">
                {filteredCourses.map((course) => {
                  const isEnrolled = enrolledCourseIds.has(course._id);
                  return (
                    <div className="course-card" key={course._id}>
                      <div className="course-card-thumb">
                        {course.thumbnailUrl
                          ? <img src={course.thumbnailUrl} alt={course.title} />
                          : <div className="course-card-thumb-placeholder"><BookOpen size={32} /></div>}
                        {isEnrolled && <span className="enrolled-badge">Enrolled</span>}
                      </div>
                      <div className="course-card-body">
                        <div className="course-card-title">{course.title}</div>
                        <div className="course-card-instructor">by {course.instructor?.email || 'EduFlow'}</div>
                        <div className="course-card-meta">
                          <Play size={12} />
                          <span>{course.videos.length} {course.videos.length === 1 ? 'video' : 'videos'}</span>
                        </div>
                        <div className="course-card-actions">
                          <button
                            className="secondary-btn"
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={() => setSelectedCourse(course)}
                          >
                            Preview
                          </button>
                          <button
                            className={isEnrolled ? 'secondary-btn' : 'primary-btn'}
                            style={{ flex: 1, height: '38px', fontSize: '0.85rem', justifyContent: 'center' }}
                            disabled={isEnrolled}
                            onClick={() => !isEnrolled && enrollCourse(course._id)}
                          >
                            {isEnrolled ? 'Enrolled' : 'Enroll Free'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course modal */}
      {selectedCourse && (
        <div className="modal-backdrop" onClick={() => setSelectedCourse(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{selectedCourse.title}</div>
                <div className="modal-subtitle">
                  {enrolledCourseIds.has(selectedCourse._id)
                    ? `${calculateProgress(selectedCourse)}% complete - ${selectedCourse.watchedVideos?.length || 0}/${selectedCourse.videos.length} videos watched`
                    : `${selectedCourse.videos.length} videos - Enroll to watch`}
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedCourse(null)}>
                <X size={16} />
              </button>
            </div>

            {enrolledCourseIds.has(selectedCourse._id) && (
              <div style={{ padding: '0.75rem 1.5rem', background: 'var(--gray-50)', borderBottom: '1px solid var(--border-color)' }}>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${calculateProgress(selectedCourse)}%` }} />
                </div>
              </div>
            )}

            <div className="modal-body">
              {selectedCourse.videos.map((video) => {
                const watched = selectedCourse.watchedVideos?.some(
                  (item) => item.videoId === video._id || item.videoId?._id === video._id,
                );
                return (
                  <div className="video-item" key={video._id}>
                    <div className="video-header">
                      <div className="video-title">
                        <Play size={14} style={{ color: 'var(--brand-500)' }} />
                        {video.title}
                      </div>
                      {watched && (
                        <span className="watched-badge">
                          <CheckCircle size={10} /> Watched
                        </span>
                      )}
                    </div>
                    {enrolledCourseIds.has(selectedCourse._id) ? (
                      <video
                        controls
                        src={video.videoUrl}
                        data-watched={watched ? 'true' : 'false'}
                        onTimeUpdate={(e) => markVideoWatched(selectedCourse._id, video._id, e)}
                      />
                    ) : (
                      <div style={{
                        padding: '2rem', textAlign: 'center',
                        color: 'var(--text-muted)', background: 'var(--gray-50)', fontSize: '0.875rem',
                      }}>
                        Enroll to watch this video
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="modal-footer">
              {!enrolledCourseIds.has(selectedCourse._id) && (
                <button className="primary-btn" onClick={() => enrollCourse(selectedCourse._id)}>
                  Enroll Now - Free
                </button>
              )}
              <button className="secondary-btn" onClick={() => setSelectedCourse(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
