import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../services/api';
import { BookOpen, Play, CheckCircle, Filter, Search } from 'lucide-react';

function calculateProgress(course) {
  if (!course.videos.length) return 0;
  return Math.round(((course.watchedVideos?.length || 0) / course.videos.length) * 100);
}

export default function StudentMyCourses({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await api.getEnrolledCourses();
        setCourses(data.courses || []);
      } catch (error) {
        console.error(error);
      }
    };
    loadCourses();
  }, []);

  const filteredCourses = courses.filter(course => {
    const progress = calculateProgress(course);
    const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filter === 'in-progress') return progress > 0 && progress < 100;
    if (filter === 'completed') return progress === 100;
    if (filter === 'not-started') return progress === 0;
    return true;
  });

  return (
    <DashboardLayout user={user} onLogout={onLogout} title="My Learning">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Learning</h1>
          <p className="page-subtitle">Track your progress and continue learning</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-modern">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search your courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Courses ({courses.length})
          </button>
          <button
            className={`filter-tab ${filter === 'in-progress' ? 'active' : ''}`}
            onClick={() => setFilter('in-progress')}
          >
            In Progress ({courses.filter(c => { const p = calculateProgress(c); return p > 0 && p < 100; }).length})
          </button>
          <button
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({courses.filter(c => calculateProgress(c) === 100).length})
          </button>
          <button
            className={`filter-tab ${filter === 'not-started' ? 'active' : ''}`}
            onClick={() => setFilter('not-started')}
          >
            Not Started ({courses.filter(c => calculateProgress(c) === 0).length})
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="empty-state-modern">
          <BookOpen size={48} />
          <h3>No courses found</h3>
          <p>Try adjusting your filters or browse new courses</p>
          <button className="primary-btn" onClick={() => navigate('/dashboard/browse')}>
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="course-grid-modern">
          {filteredCourses.map((course) => {
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
                  {progress === 100 && (
                    <div className="course-badge completed">
                      <CheckCircle size={16} />
                      Completed
                    </div>
                  )}
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
                  <div className="course-progress-section">
                    <div className="progress-info-row">
                      <span className="progress-label">{progress}% complete</span>
                      <span className="progress-percentage">{course.watchedVideos?.length || 0}/{course.videos.length}</span>
                    </div>
                    <div className="progress-bar-full">
                      <div className="progress-fill-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
