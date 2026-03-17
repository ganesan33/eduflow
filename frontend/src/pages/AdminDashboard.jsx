import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import { BookOpen, Trash2, Play, Search, X, Users, Video } from 'lucide-react';

export default function AdminDashboard({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadCourses = async () => {
    try {
      const data = await api.getAdminCourses();
      setCourses(data.courses || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => { loadCourses(); }, []);

  const filteredCourses = useMemo(() => {
    const q = search.toLowerCase();
    return courses.filter(
      (c) => c.title.toLowerCase().includes(q) || c.instructor?.email?.toLowerCase().includes(q),
    );
  }, [courses, search]);

  const deleteCourse = async (courseId) => {
    if (!window.confirm('Delete this course? This action cannot be undone.')) return;
    try {
      await api.deleteAdminCourse(courseId);
      if (selectedCourse?._id === courseId) setSelectedCourse(null);
      await loadCourses();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const totalStudents = courses.reduce((sum, c) => sum + (c.studentsEnrolled?.length || 0), 0);
  const totalVideos   = courses.reduce((sum, c) => sum + (c.videos?.length || 0), 0);

  return (
    <div className="dashboard-page">
      <Navbar user={user} onLogout={onLogout} />

      <div className="dashboard-content">
        {error && (
          <div className="error-box" style={{ marginBottom: '1.5rem' }}>
            <X size={15} />{error}
          </div>
        )}

        {/* Hero */}
        <div className="hero-section">
          <div className="hero-greeting">Admin Panel</div>
          <h1 className="hero-title">Platform Overview</h1>
          <p className="hero-subtitle">Manage all courses and platform content from one place.</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">{courses.length}</span>
              <span className="hero-stat-label">Courses</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">{totalStudents}</span>
              <span className="hero-stat-label">Enrollments</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">{totalVideos}</span>
              <span className="hero-stat-label">Videos</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-card-icon purple"><BookOpen size={22} /></div>
            <div>
              <div className="stat-card-value">{courses.length}</div>
              <div className="stat-card-label">Total Courses</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon green"><Users size={22} /></div>
            <div>
              <div className="stat-card-value">{totalStudents}</div>
              <div className="stat-card-label">Total Enrollments</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon blue"><Video size={22} /></div>
            <div>
              <div className="stat-card-value">{totalVideos}</div>
              <div className="stat-card-label">Total Videos</div>
            </div>
          </div>
        </div>

        {/* Manage Courses */}
        <div className="section-block">
          <div className="admin-toolbar">
            <h2 className="section-title">Manage Courses</h2>
            <div className="search-bar">
              <Search size={15} className="s-icon" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or instructor..."
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
                {filteredCourses.map((course) => (
                  <div className="course-card" key={course._id}>
                    <div className="course-card-thumb">
                      {course.thumbnailUrl
                        ? <img src={course.thumbnailUrl} alt={course.title} />
                        : <div className="course-card-thumb-placeholder"><BookOpen size={32} /></div>}
                    </div>
                    <div className="course-card-body">
                      <div className="course-card-title">{course.title}</div>
                      <div className="course-card-instructor">by {course.instructor?.email || 'System'}</div>
                      <div className="course-card-meta">
                        <Video size={12} />
                        <span>{course.videos.length} videos</span>
                        <span className="dot" />
                        <Users size={12} />
                        <span>{course.studentsEnrolled?.length || 0} enrolled</span>
                      </div>
                      <div className="course-card-actions">
                        <button
                          className="secondary-btn"
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => setSelectedCourse(course)}
                        >
                          <Play size={13} /> Preview
                        </button>
                        <button
                          className="danger-btn"
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => deleteCourse(course._id)}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {selectedCourse && (
        <div className="modal-backdrop" onClick={() => setSelectedCourse(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{selectedCourse.title}</div>
                <div className="modal-subtitle">
                  Instructor: {selectedCourse.instructor?.email || 'System'} - {selectedCourse.videos.length} videos
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedCourse(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              {selectedCourse.videos.map((video) => (
                <div className="video-item" key={video._id}>
                  <div className="video-header">
                    <div className="video-title">
                      <Play size={14} style={{ color: 'var(--brand-500)' }} />
                      {video.title}
                    </div>
                  </div>
                  <video controls src={video.videoUrl} />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button
                className="danger-btn"
                onClick={() => deleteCourse(selectedCourse._id)}
              >
                <Trash2 size={14} /> Delete Course
              </button>
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
