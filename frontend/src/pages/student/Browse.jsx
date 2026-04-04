import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../services/api';
import { BookOpen, Play, Star, Search, Filter } from 'lucide-react';

export default function StudentBrowse({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadCourses = async () => {
    setLoading(true);
    try {
      const [available, enrolled] = await Promise.all([
        api.getCourses({ q: search, category, level, sort: sortBy }),
        api.getEnrolledCourses()
      ]);
      setCourses(available.courses || []);
      setEnrolledIds(new Set((enrolled.courses || []).map(c => c._id)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [search, category, level, sortBy]);

  const enrollCourse = async (courseId, e) => {
    e.stopPropagation();
    try {
      await api.enrollCourse(courseId);
      await loadCourses();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DashboardLayout user={user} onLogout={onLogout} title="Browse Courses">
      <div className="page-header">
        <div>
          <h1 className="page-title">Browse Courses</h1>
          <p className="page-subtitle">Discover new skills and expand your knowledge</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-input-modern large">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search for courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filters-row">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="filter-select">
            <option value="all">All Categories</option>
            <option value="general">General</option>
            <option value="development">Development</option>
            <option value="design">Design</option>
            <option value="business">Business</option>
          </select>

          <select value={level} onChange={(e) => setLevel(e.target.value)} className="filter-select">
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
            <option value="newest">Newest First</option>
            <option value="top-rated">Top Rated</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="results-header">
        <h2 className="results-count">{courses.length} courses found</h2>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state-modern">
          <BookOpen size={48} />
          <h3>No courses found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="course-grid-modern">
          {courses.map((course) => {
            const isEnrolled = enrolledIds.has(course._id);
            return (
              <div
                key={course._id}
                className="course-card-modern"
                onClick={() => isEnrolled ? navigate(`/dashboard/course/${course._id}`) : null}
              >
                <div className="course-thumbnail">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} />
                  ) : (
                    <div className="course-thumbnail-placeholder">
                      <BookOpen size={40} />
                    </div>
                  )}
                  {isEnrolled && (
                    <div className="course-badge enrolled">
                      Enrolled
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
                      {Number(course.averageRating || 0).toFixed(1)} ({course.ratingsCount || 0})
                    </span>
                  </div>
                  <div className="course-tags">
                    <span className="course-tag">{course.category || 'General'}</span>
                    <span className="course-tag">{course.level || 'Beginner'}</span>
                  </div>
                  {!isEnrolled && (
                    <button
                      className="primary-btn full-width"
                      onClick={(e) => enrollCourse(course._id, e)}
                    >
                      Enroll Free
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
