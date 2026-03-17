import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import {
  BookOpen, Plus, Trash2, Upload, Play, X, Users, Video,
} from 'lucide-react';

function emptyVideo() {
  return { title: '', file: null };
}

export default function InstructorDashboard({ user, onLogout }) {
  const [title, setTitle] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [videos, setVideos] = useState([emptyVideo()]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCourses = async () => {
    try {
      const data = await api.getMyCourses();
      setCourses(data.courses || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => { loadCourses(); }, []);

  const updateVideo = (index, updates) =>
    setVideos((prev) => prev.map((v, i) => (i === index ? { ...v, ...updates } : v)));

  const addVideo = () => setVideos((prev) => [...prev, emptyVideo()]);
  const removeVideo = (index) => setVideos((prev) => prev.filter((_, i) => i !== index));

  const submitCourse = async (event) => {
    event.preventDefault();
    setError('');

    if (!title.trim() || !thumbnail) {
      setError('Course title and thumbnail are required');
      return;
    }
    if (!videos.length || videos.some((v) => !v.title.trim() || !v.file)) {
      setError('Each video requires a title and a file');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('thumbnail', thumbnail);
    videos.forEach((video, index) => {
      formData.append(`videos[${index}][title]`, video.title.trim());
      formData.append(`videos[${index}][file]`, video.file);
    });

    setSaving(true);
    try {
      await api.createCourse(formData);
      setTitle('');
      setThumbnail(null);
      setVideos([emptyVideo()]);
      await loadCourses();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
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
          <div className="hero-greeting">Instructor Dashboard</div>
          <h1 className="hero-title">Hello, {user.email.split('@')[0]}!</h1>
          <p className="hero-subtitle">Create and manage your courses for enrolled students.</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">{courses.length}</span>
              <span className="hero-stat-label">Courses</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">{totalStudents}</span>
              <span className="hero-stat-label">Students</span>
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
              <div className="stat-card-label">Total Students</div>
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

        {/* Create Course */}
        <div className="section-block">
          <div className="section-header">
            <h2 className="section-title">Create New Course</h2>
            <span className="pill blue">New</span>
          </div>
          <div className="section-body">
            <form className="stack-form" onSubmit={submitCourse}>
              <div className="form-group">
                <label>Course Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a course title..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Thumbnail Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                  required
                />
              </div>

              {/* Videos section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Course Videos
                  </label>
                  <button type="button" className="secondary-btn" onClick={addVideo}>
                    <Plus size={14} /> Add Video
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {videos.map((video, index) => (
                    <div className="video-list-entry" key={index}>
                      <div className="video-number">{index + 1}</div>
                      <input
                        placeholder="Video title"
                        value={video.title}
                        onChange={(e) => updateVideo(index, { title: e.target.value })}
                        required
                      />
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => updateVideo(index, { file: e.target.files?.[0] || null })}
                        required
                      />
                      {videos.length > 1 && (
                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() => removeVideo(index)}
                          style={{ height: '36px', width: '36px', padding: 0, justifyContent: 'center', flexShrink: 0 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ paddingTop: '0.5rem' }}>
                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? (
                    <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Publishing...</>
                  ) : (
                    <><Upload size={15} /> Publish Course</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* My Courses */}
        <div className="section-block">
          <div className="section-header">
            <h2 className="section-title">My Courses</h2>
            <span className="pill purple">{courses.length} Total</span>
          </div>
          <div className="section-body">
            {courses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><BookOpen size={28} /></div>
                <h4>No courses yet</h4>
                <p>Create your first course above to get started</p>
              </div>
            ) : (
              <div className="course-grid">
                {courses.map((course) => (
                  <div className="course-card" key={course._id}>
                    <div className="course-card-thumb">
                      {course.thumbnailUrl
                        ? <img src={course.thumbnailUrl} alt={course.title} />
                        : <div className="course-card-thumb-placeholder"><BookOpen size={32} /></div>}
                    </div>
                    <div className="course-card-body">
                      <div className="course-card-title">{course.title}</div>
                      <div className="course-card-meta">
                        <Video size={12} />
                        <span>{course.videos.length} videos</span>
                        <span className="dot" />
                        <Users size={12} />
                        <span>{course.studentsEnrolled.length} students</span>
                      </div>
                      <button
                        className="secondary-btn"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => setSelectedCourse(course)}
                      >
                        <Play size={14} /> View Videos
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course preview modal */}
      {selectedCourse && (
        <div className="modal-backdrop" onClick={() => setSelectedCourse(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{selectedCourse.title}</div>
                <div className="modal-subtitle">
                  {selectedCourse.videos.length} videos - {selectedCourse.studentsEnrolled?.length || 0} students enrolled
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
              <button className="secondary-btn" onClick={() => setSelectedCourse(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


