import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../services/api';
import { BookOpen, Search, Trash2, Users, Video, Play, X } from 'lucide-react';

export default function AdminCourses({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await api.getAdminCourses();
      setCourses(data.courses || []);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteCourse = async (courseId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this course? This action cannot be undone.')) return;

    try {
      await api.deleteAdminCourse(courseId);
      if (selectedCourse?._id === courseId) setSelectedCourse(null);
      await loadCourses();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(search.toLowerCase()) ||
    course.instructor?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout user={user} onLogout={onLogout} title="Manage Courses">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Courses</h1>
          <p className="page-subtitle">Manage all courses on the platform</p>
        </div>
      </div>

      {/* Search */}
      <div className="search-input-modern large">
        <Search size={20} />
        <input
          type="text"
          placeholder="Search by course title or instructor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Results */}
      <div className="results-header">
        <h2 className="results-count">{filteredCourses.length} courses found</h2>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="empty-state-modern">
          <BookOpen size={48} />
          <h3>No courses found</h3>
          <p>Try adjusting your search</p>
        </div>
      ) : (
        <div className="course-grid-modern">
          {filteredCourses.map((course) => (
            <div
              key={course._id}
              className="course-card-modern"
              onClick={() => setSelectedCourse(course)}
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
                <button
                  className="danger-btn full-width"
                  onClick={(e) => deleteCourse(course._id, e)}
                >
                  <Trash2 size={16} />
                  Delete Course
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {selectedCourse && (
        <div className="modal-overlay" onClick={() => setSelectedCourse(null)}>
          <div className="modal-modern large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-modern">
              <div>
                <h2>{selectedCourse.title}</h2>
                <p className="modal-subtitle">
                  By {selectedCourse.instructor?.email || 'System'} • {selectedCourse.videos.length} videos
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedCourse(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-modern">
              <div className="video-preview-list">
                {selectedCourse.videos.map((video, index) => (
                  <div key={video._id} className="video-preview-item">
                    <span className="video-number">{index + 1}</span>
                    <div className="video-preview-info">
                      <h4>{video.title}</h4>
                      <video controls src={video.videoUrl} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer-modern">
              <button className="danger-btn" onClick={(e) => deleteCourse(selectedCourse._id, e)}>
                <Trash2 size={16} />
                Delete Course
              </button>
              <button className="secondary-btn" onClick={() => setSelectedCourse(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
