import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import { BookOpen, Trash2, Play, Search, X, Users, Video } from 'lucide-react';

export default function AdminDashboard({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [instructorRequests, setInstructorRequests] = useState([]);
  const [requestStatusFilter, setRequestStatusFilter] = useState('pending');
  const [reviewNotesById, setReviewNotesById] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadCourses = async () => {
    try {
      const [data, analyticsData, requestData] = await Promise.all([
        api.getAdminCourses(),
        api.getAdminAnalytics(),
        api.getAdminInstructorRequests(requestStatusFilter)
      ]);
      setCourses(data.courses || []);
      setAnalytics(analyticsData.analytics || null);
      setInstructorRequests(requestData.requests || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => { loadCourses(); }, [requestStatusFilter]);

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

  const reviewInstructorRequest = async (requestId, action) => {
    try {
      await api.reviewAdminInstructorRequest(requestId, {
        action,
        reviewNotes: reviewNotesById[requestId] || ''
      });

      await loadCourses();
    } catch (reviewError) {
      setError(reviewError.message);
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
          <div className="stat-card">
            <div className="stat-card-icon yellow"><Users size={22} /></div>
            <div>
              <div className="stat-card-value">{analytics?.users?.total || 0}</div>
              <div className="stat-card-label">Total Users</div>
            </div>
          </div>
        </div>

        <div className="dashboard-main-layout">
          <div className="dashboard-main-column">
            <div className="section-block">
              <div className="admin-toolbar">
                <h2 className="section-title">Instructor Applications</h2>
                <select value={requestStatusFilter} onChange={(e) => setRequestStatusFilter(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All</option>
                </select>
              </div>
              <div className="section-body">
                {instructorRequests.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><Users size={28} /></div>
                    <h4>No applications found</h4>
                    <p>Switch filter to view a different status</p>
                  </div>
                ) : (
                  <div className="application-list">
                    {instructorRequests.map((request) => (
                      <div key={request._id} className="application-card">
                        <div className="application-head">
                          <strong>{request.user?.email || 'Unknown user'}</strong>
                          <span className={`pill ${request.status === 'approved' ? 'green' : request.status === 'rejected' ? 'purple' : 'yellow'}`}>
                            {request.status}
                          </span>
                        </div>
                        <div className="application-meta">{request.headline} - {request.experienceYears} years experience</div>
                        <div className="application-meta">Expertise: {request.expertise}</div>
                        <p className="application-text">{request.motivation}</p>
                        {request.portfolioUrl && (
                          <a href={request.portfolioUrl} target="_blank" rel="noreferrer" className="application-link">Portfolio</a>
                        )}

                        <textarea
                          className="app-textarea"
                          placeholder="Review notes (optional)"
                          value={reviewNotesById[request._id] || ''}
                          onChange={(e) => setReviewNotesById((prev) => ({ ...prev, [request._id]: e.target.value }))}
                          disabled={request.status !== 'pending'}
                        />

                        {request.status === 'pending' && (
                          <div className="course-card-actions">
                            <button className="primary-btn" onClick={() => reviewInstructorRequest(request._id, 'approve')}>
                              Approve
                            </button>
                            <button className="danger-btn" onClick={() => reviewInstructorRequest(request._id, 'reject')}>
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

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

          <aside className="dashboard-side-column">
            {analytics && (
              <div className="section-block compact">
                <div className="section-header">
                  <h2 className="section-title">Platform Analytics</h2>
                </div>
                <div className="section-body">
                  <div className="mini-stat-list">
                    <div className="mini-stat-item"><span>Total Users</span><strong>{analytics.users.total}</strong></div>
                    <div className="mini-stat-item"><span>Total Courses</span><strong>{analytics.courses.total}</strong></div>
                    <div className="mini-stat-item"><span>Enrollments</span><strong>{analytics.courses.totalEnrollments}</strong></div>
                    <div className="mini-stat-item"><span>Average Rating</span><strong>{Number(analytics.courses.averageRating || 0).toFixed(1)}</strong></div>
                  </div>
                </div>
              </div>
            )}

            <div className="section-block compact">
              <div className="section-header">
                <h2 className="section-title">Moderation Notes</h2>
              </div>
              <div className="section-body">
                <div className="note-list">
                  <div className="note-item">Review pending instructor requests daily for faster onboarding.</div>
                  <div className="note-item">Use search first before deleting duplicated courses.</div>
                  <div className="note-item">Reject requests with clear notes so users can reapply better.</div>
                </div>
              </div>
            </div>
          </aside>
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
