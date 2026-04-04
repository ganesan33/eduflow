import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../services/api';
import { BookOpen, Users, Video, Edit, X } from 'lucide-react';

export default function InstructorMyCourses({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editableCourse, setEditableCourse] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await api.getMyCourses();
      setCourses(data.courses || []);
    } catch (error) {
      console.error(error);
    }
  };

  const openEditModal = (course) => {
    setSelectedCourse(course);
    setEditableCourse({
      ...course,
      videos: [...course.videos].sort((a, b) => (a.order || 0) - (b.order || 0))
    });
  };

  const moveVideo = (index, direction) => {
    if (!editableCourse) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= editableCourse.videos.length) return;

    const videos = [...editableCourse.videos];
    [videos[index], videos[targetIndex]] = [videos[targetIndex], videos[index]];
    setEditableCourse({ ...editableCourse, videos });
  };

  const saveCourseEdits = async () => {
    if (!editableCourse) return;

    try {
      setSaving(true);
      await api.updateCourse(editableCourse._id, {
        title: editableCourse.title,
        category: editableCourse.category,
        level: editableCourse.level,
        videos: editableCourse.videos.map((video) => ({ _id: video._id, title: video.title }))
      });
      setSelectedCourse(null);
      setEditableCourse(null);
      await loadCourses();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout user={user} onLogout={onLogout} title="My Courses">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Courses</h1>
          <p className="page-subtitle">Manage and edit your published courses</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state-modern">
          <BookOpen size={48} />
          <h3>No courses yet</h3>
          <p>Create your first course to start teaching</p>
          <button className="primary-btn" onClick={() => navigate('/dashboard/create-course')}>
            Create Course
          </button>
        </div>
      ) : (
        <div className="course-grid-modern">
          {courses.map((course) => (
            <div key={course._id} className="course-card-modern">
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
                <button
                  className="secondary-btn full-width"
                  onClick={() => openEditModal(course)}
                >
                  <Edit size={16} />
                  Edit Course
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {selectedCourse && editableCourse && (
        <div className="modal-overlay" onClick={() => { setSelectedCourse(null); setEditableCourse(null); }}>
          <div className="modal-modern large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-modern">
              <h2>Edit Course</h2>
              <button className="modal-close-btn" onClick={() => { setSelectedCourse(null); setEditableCourse(null); }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-modern">
              <div className="form-group-modern">
                <label>Course Title</label>
                <input
                  value={editableCourse.title}
                  onChange={(e) => setEditableCourse({ ...editableCourse, title: e.target.value })}
                />
              </div>

              <div className="form-row-modern">
                <div className="form-group-modern">
                  <label>Category</label>
                  <select
                    value={editableCourse.category || 'general'}
                    onChange={(e) => setEditableCourse({ ...editableCourse, category: e.target.value })}
                  >
                    <option value="general">General</option>
                    <option value="development">Development</option>
                    <option value="design">Design</option>
                    <option value="business">Business</option>
                  </select>
                </div>

                <div className="form-group-modern">
                  <label>Level</label>
                  <select
                    value={editableCourse.level || 'beginner'}
                    onChange={(e) => setEditableCourse({ ...editableCourse, level: e.target.value })}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="video-list-section">
                <h3>Course Videos</h3>
                {editableCourse.videos.map((video, index) => (
                  <div key={video._id} className="video-edit-item">
                    <span className="video-number">{index + 1}</span>
                    <input
                      value={video.title}
                      onChange={(e) => {
                        const updatedVideos = editableCourse.videos.map((v, i) =>
                          i === index ? { ...v, title: e.target.value } : v
                        );
                        setEditableCourse({ ...editableCourse, videos: updatedVideos });
                      }}
                    />
                    <div className="video-reorder-btns">
                      <button
                        className="icon-btn"
                        onClick={() => moveVideo(index, -1)}
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => moveVideo(index, 1)}
                        disabled={index === editableCourse.videos.length - 1}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer-modern">
              <button className="secondary-btn" onClick={() => { setSelectedCourse(null); setEditableCourse(null); }}>
                Cancel
              </button>
              <button className="primary-btn" onClick={saveCourseEdits} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
