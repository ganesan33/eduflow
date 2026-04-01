import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import {
  BookOpen, Play, CheckCircle, Search, X, Award, TrendingUp, Star,
} from 'lucide-react';

function calculateProgress(course) {
  if (!course.videos.length) return 0;
  return Math.round(((course.watchedVideos?.length || 0) / course.videos.length) * 100);
}

export default function StudentDashboard({ user, onLogout }) {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [instructorRequest, setInstructorRequest] = useState(null);
  const [application, setApplication] = useState({
    headline: '',
    experienceYears: 0,
    expertise: '',
    motivation: '',
    portfolioUrl: ''
  });
  const [applicationSaving, setApplicationSaving] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [reviewInput, setReviewInput] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setError('');
      const [available, enrolled] = await Promise.all([
        api.getCourses({
          q: search,
          category: categoryFilter,
          level: levelFilter,
          minRating: ratingFilter,
          sort: sortBy
        }),
        api.getEnrolledCourses()
      ]);
      setCourses(available.courses || []);
      setEnrolledCourses(enrolled.courses || []);

      const requestData = await api.getMyInstructorRequest();
      setInstructorRequest(requestData.request || null);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => { loadData(); }, [search, categoryFilter, levelFilter, ratingFilter, sortBy]);

  const enrolledCourseIds = useMemo(
    () => new Set(enrolledCourses.map((c) => c._id)),
    [enrolledCourses],
  );

  const filteredCourses = useMemo(() => courses, [courses]);

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

  const persistPlayback = async (courseId, videoId, event) => {
    const video = event.currentTarget;
    const currentSeconds = Math.floor(video.currentTime || 0);
    if (!currentSeconds || currentSeconds % 10 !== 0) {
      return;
    }

    try {
      await api.savePlaybackPosition(courseId, videoId, {
        positionSeconds: currentSeconds,
        durationSeconds: Math.floor(video.duration || 0)
      });
    } catch (e) {
      // Skip surfacing noisy playback sync errors while video continues.
    }
  };

  const restorePlayback = (course, videoId, event) => {
    const entry = course.playbackPositions?.find(
      (item) => item.videoId === videoId || item.videoId?._id === videoId,
    );

    if (entry?.positionSeconds && event.currentTarget.duration) {
      const maxSeek = Math.max(0, event.currentTarget.duration - 5);
      event.currentTarget.currentTime = Math.min(entry.positionSeconds, maxSeek);
    }
  };

  const submitReview = async () => {
    if (!selectedCourse) {
      return;
    }

    try {
      await api.submitCourseReview(selectedCourse._id, {
        rating: ratingInput,
        comment: reviewInput
      });
      await loadData();
      setReviewInput('');
      setRatingInput(5);
    } catch (e) {
      setError(e.message);
    }
  };

  const submitInstructorApplication = async (event) => {
    event.preventDefault();
    setError('');
    setApplicationSaving(true);

    try {
      await api.createInstructorRequest(application);
      setApplication({
        headline: '',
        experienceYears: 0,
        expertise: '',
        motivation: '',
        portfolioUrl: ''
      });
      await loadData();
    } catch (e) {
      setError(e.message);
    } finally {
      setApplicationSaving(false);
    }
  };

  const requestStatus = instructorRequest?.status || 'not-requested';

  const isVideoWatched = (course, videoId) =>
    course?.watchedVideos?.some(
      (item) => item.videoId === videoId || item.videoId?._id === videoId,
    );

  useEffect(() => {
    if (!selectedCourse?.videos?.length) {
      setActiveVideoId(null);
      return;
    }

    if (!activeVideoId || !selectedCourse.videos.some((video) => video._id === activeVideoId)) {
      setActiveVideoId(selectedCourse.videos[0]._id);
    }
  }, [selectedCourse, activeVideoId]);

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

        <div className="dashboard-main-layout">
          <div className="dashboard-main-column">
            <div className="section-block">
              <div className="section-header">
                <h2 className="section-title">Become an Instructor</h2>
                <span className={`pill ${requestStatus === 'approved' ? 'green' : requestStatus === 'pending' ? 'yellow' : requestStatus === 'rejected' ? 'purple' : 'blue'}`}>
                  {requestStatus === 'not-requested' ? 'Not Requested' : requestStatus}
                </span>
              </div>
              <div className="section-body">
                {requestStatus === 'approved' ? (
                  <div className="success-box">Your application was approved. Please sign out and sign in again to access Instructor Dashboard.</div>
                ) : (
                  <form className="stack-form" onSubmit={submitInstructorApplication}>
                    <div className="form-group">
                      <label>Professional Headline *</label>
                      <input
                        value={application.headline}
                        onChange={(e) => setApplication((prev) => ({ ...prev, headline: e.target.value }))}
                        placeholder="Example: Senior JavaScript Instructor"
                        required
                        disabled={requestStatus === 'pending'}
                      />
                    </div>

                    <div className="form-row-3">
                      <div className="form-group">
                        <label>Years of Experience *</label>
                        <input
                          type="number"
                          min={0}
                          max={60}
                          value={application.experienceYears}
                          onChange={(e) => setApplication((prev) => ({ ...prev, experienceYears: Number(e.target.value) }))}
                          placeholder="0"
                          required
                          disabled={requestStatus === 'pending'}
                        />
                      </div>
                      <div className="form-group">
                        <label>Core Expertise Areas *</label>
                        <input
                          value={application.expertise}
                          onChange={(e) => setApplication((prev) => ({ ...prev, expertise: e.target.value }))}
                          placeholder="JavaScript, React, Web Development"
                          required
                          disabled={requestStatus === 'pending'}
                        />
                      </div>
                      <div className="form-group">
                        <label>Portfolio URL</label>
                        <input
                          value={application.portfolioUrl}
                          onChange={(e) => setApplication((prev) => ({ ...prev, portfolioUrl: e.target.value }))}
                          placeholder="https://your-portfolio.com"
                          disabled={requestStatus === 'pending'}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Why do you want to teach on EduFlow? *</label>
                      <textarea
                        className="app-textarea"
                        value={application.motivation}
                        onChange={(e) => setApplication((prev) => ({ ...prev, motivation: e.target.value }))}
                        placeholder="Share your teaching motivation and value for students"
                        required
                        disabled={requestStatus === 'pending'}
                      />
                    </div>
                    {requestStatus === 'rejected' && instructorRequest?.reviewNotes && (
                      <div className="error-box">Previous review notes: {instructorRequest.reviewNotes}</div>
                    )}
                    <button className="primary-btn" type="submit" disabled={applicationSaving || requestStatus === 'pending'}>
                      {requestStatus === 'pending' ? 'Application Pending Review' : applicationSaving ? 'Submitting...' : 'Submit Instructor Application'}
                    </button>
                  </form>
                )}
              </div>
            </div>

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

            <div className="section-block">
              <div className="section-header">
                <h2 className="section-title">Explore Courses</h2>
                <div className="search-filter-row">
                  <div className="search-bar">
                  <Search size={15} className="s-icon" />
                  <input
                    type="text"
                      placeholder="Search courses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="all">All Categories</option>
                    <option value="general">General</option>
                    <option value="development">Development</option>
                    <option value="design">Design</option>
                    <option value="business">Business</option>
                  </select>
                  <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
                    <option value="all">Any Rating</option>
                    <option value="4">4+ stars</option>
                    <option value="3">3+ stars</option>
                  </select>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="newest">Newest</option>
                    <option value="top-rated">Top Rated</option>
                    <option value="popular">Most Popular</option>
                  </select>
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
                            <div className="course-rating-row">
                              <Star size={12} />
                              <span>{Number(course.averageRating || 0).toFixed(1)} ({course.ratingsCount || 0})</span>
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

          <aside className="dashboard-side-column">
            <div className="section-block compact">
              <div className="section-header">
                <h2 className="section-title">Learning Snapshot</h2>
              </div>
              <div className="section-body">
                <div className="mini-stat-list">
                  <div className="mini-stat-item"><span>Active Enrollments</span><strong>{enrolledCourses.length}</strong></div>
                  <div className="mini-stat-item"><span>Completed Courses</span><strong>{completedCount}</strong></div>
                  <div className="mini-stat-item"><span>Catalog Courses</span><strong>{courses.length}</strong></div>
                </div>
              </div>
            </div>

            <div className="section-block compact">
              <div className="section-header">
                <h2 className="section-title">Learning Tips</h2>
              </div>
              <div className="section-body">
                <div className="note-list">
                  <div className="note-item">Use Preview before enrolling to compare course quality.</div>
                  <div className="note-item">Watch until at least 80% to count a lesson as complete.</div>
                  <div className="note-item">Submit quick reviews to help improve course rankings.</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Course modal */}
      {selectedCourse && (
        <div className="modal-backdrop" onClick={() => setSelectedCourse(null)}>
          <div className="modal-card learning-modal" onClick={(e) => e.stopPropagation()}>
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
              <div className="learning-modal-layout">
                <div className="learning-player-panel">
                  {activeVideoId && (
                    <>
                      <div className="learning-player-title-row">
                        <h3>{selectedCourse.videos.find((video) => video._id === activeVideoId)?.title}</h3>
                        {isVideoWatched(selectedCourse, activeVideoId) && (
                          <span className="watched-badge">
                            <CheckCircle size={10} /> Watched
                          </span>
                        )}
                      </div>
                      {enrolledCourseIds.has(selectedCourse._id) ? (
                        <video
                          controls
                          src={selectedCourse.videos.find((video) => video._id === activeVideoId)?.videoUrl}
                          data-watched={isVideoWatched(selectedCourse, activeVideoId) ? 'true' : 'false'}
                          onLoadedMetadata={(e) => restorePlayback(selectedCourse, activeVideoId, e)}
                          onTimeUpdate={(e) => {
                            markVideoWatched(selectedCourse._id, activeVideoId, e);
                            persistPlayback(selectedCourse._id, activeVideoId, e);
                          }}
                        />
                      ) : (
                        <div className="learning-video-locked">Enroll to watch this video.</div>
                      )}
                    </>
                  )}
                </div>

                <aside className="learning-playlist-panel">
                  <div className="learning-playlist-header">Course Playlist</div>
                  <div className="learning-playlist-scroll">
                    {selectedCourse.videos.map((video, index) => {
                      const watched = isVideoWatched(selectedCourse, video._id);
                      return (
                        <button
                          type="button"
                          key={video._id}
                          className={`playlist-item${activeVideoId === video._id ? ' active' : ''}`}
                          onClick={() => setActiveVideoId(video._id)}
                        >
                          <span className="playlist-index">{index + 1}</span>
                          <span className="playlist-text">
                            <span className="playlist-title">{video.title}</span>
                            <span className="playlist-meta">{watched ? 'Completed' : 'Not watched yet'}</span>
                          </span>
                          {watched && <CheckCircle size={14} className="playlist-check" />}
                        </button>
                      );
                    })}
                  </div>
                </aside>
              </div>
            </div>

            <div className="modal-footer">
              {enrolledCourseIds.has(selectedCourse._id) && (
                <div className="review-inline">
                  <select value={ratingInput} onChange={(e) => setRatingInput(Number(e.target.value))}>
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                  <input
                    value={reviewInput}
                    onChange={(e) => setReviewInput(e.target.value)}
                    placeholder="Write a short review"
                  />
                  <button className="secondary-btn" onClick={submitReview}>Submit Review</button>
                </div>
              )}
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
