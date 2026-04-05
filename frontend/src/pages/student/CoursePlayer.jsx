import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { ArrowLeft, CheckCircle, Play, Star, Clock, BookOpen } from 'lucide-react';

export default function StudentCoursePlayer({ user, onLogout }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [videoLoading, setVideoLoading] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const enrolled = await api.getEnrolledCourses();
        const foundCourse = (enrolled.courses || []).find(c => c._id === courseId);
        if (foundCourse) {
          setCourse(foundCourse);
          if (foundCourse.videos.length > 0) {
            setActiveVideoId(foundCourse.videos[0]._id);
          }
        }
      } catch (error) {
        console.error(error);
      }
    };
    loadCourse();
  }, [courseId]);

  const isVideoWatched = (videoId) => {
    return course?.watchedVideos?.some(
      (item) => item.videoId === videoId || item.videoId?._id === videoId
    );
  };

  const markVideoWatched = async (videoId, event) => {
    const video = event.currentTarget;
    if (!video.duration || video.dataset.watched === 'true') return;
    if (video.currentTime < video.duration * 0.8) return;
    
    video.dataset.watched = 'true';
    try {
      await api.markVideoWatched(courseId, videoId);
      const refreshed = await api.getEnrolledCourses();
      const updated = (refreshed.courses || []).find(c => c._id === courseId);
      if (updated) setCourse(updated);
    } catch (error) {
      console.error(error);
    }
  };

  const submitReview = async () => {
    if (!review.trim()) {
      alert('Please write a review');
      return;
    }
    try {
      await api.submitCourseReview(courseId, { rating, comment: review });
      setReview('');
      alert('Review submitted successfully!');
    } catch (error) {
      alert(error.message || 'Failed to submit review');
    }
  };

  const handleVideoChange = (videoId) => {
    setVideoLoading(true);
    setActiveVideoId(videoId);
  };

  if (!course) {
    return (
      <div className="player-loading">
        <div className="spinner-large" />
        <p>Loading course...</p>
      </div>
    );
  }

  const activeVideo = course.videos.find(v => v._id === activeVideoId);
  const progress = Math.round(((course.watchedVideos?.length || 0) / course.videos.length) * 100);
  const currentVideoIndex = course.videos.findIndex(v => v._id === activeVideoId);

  return (
    <div className="course-player-layout-modern">
      {/* Header */}
      <header className="player-header-modern">
        <button className="back-btn-modern" onClick={() => navigate('/dashboard/my-courses')}>
          <ArrowLeft size={20} />
          <span>Back to My Courses</span>
        </button>
        <div className="player-header-info-modern">
          <h1 className="player-course-title-modern">{course.title}</h1>
          <div className="player-progress-badge">
            <span className="progress-text">{progress}% Complete</span>
            <div className="progress-bar-mini">
              <div className="progress-fill-mini" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </header>

      <div className="player-content-modern">
        {/* Video Player */}
        <div className="player-main-modern">
          {activeVideo ? (
            <>
              <div className="video-container-modern">
                {videoLoading && (
                  <div className="video-loading-overlay">
                    <div className="spinner-large" />
                    <p>Loading video...</p>
                  </div>
                )}
                <video
                  ref={videoRef}
                  key={activeVideoId}
                  controls
                  controlsList="nodownload"
                  preload="auto"
                  playsInline
                  autoPlay
                  src={activeVideo.videoUrl}
                  data-watched={isVideoWatched(activeVideoId) ? 'true' : 'false'}
                  onTimeUpdate={(e) => markVideoWatched(activeVideoId, e)}
                  onLoadStart={() => setVideoLoading(true)}
                  onLoadedData={() => setVideoLoading(false)}
                  onCanPlay={() => setVideoLoading(false)}
                  className="video-player-modern"
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="video-info-modern">
                <div className="video-header-row">
                  <div>
                    <h2 className="video-title-modern">{activeVideo.title}</h2>
                    <p className="video-meta">
                      <BookOpen size={16} />
                      Lesson {currentVideoIndex + 1} of {course.videos.length}
                    </p>
                  </div>
                  {isVideoWatched(activeVideoId) && (
                    <span className="watched-badge-modern">
                      <CheckCircle size={18} />
                      Completed
                    </span>
                  )}
                </div>
                <p className="video-instructor-modern">
                  Instructor: {course.instructor?.email?.split('@')[0] || 'EduFlow'}
                </p>
              </div>

              {/* Review Section */}
              <div className="review-section-modern">
                <h3 className="review-title-modern">
                  <Star size={20} />
                  Rate this course
                </h3>
                <div className="review-form-modern">
                  <div className="rating-selector">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${rating === star ? 'active' : ''}`}
                        onClick={() => setRating(star)}
                      >
                        {'⭐'.repeat(star)}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your experience with this course..."
                    className="review-textarea-modern"
                    rows={4}
                  />
                  <button className="primary-btn" onClick={submitReview}>
                    <Star size={16} />
                    Submit Review
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-video-state">
              <Play size={48} />
              <p>No video selected</p>
            </div>
          )}
        </div>

        {/* Playlist Sidebar */}
        <aside className="player-sidebar-modern">
          <div className="playlist-header-modern">
            <h3>Course Content</h3>
            <span className="playlist-count-badge">{course.videos.length} videos</span>
          </div>
          
          <div className="playlist-progress-modern">
            <div className="progress-stats">
              <span>{course.watchedVideos?.length || 0} / {course.videos.length} completed</span>
              <span className="progress-percentage">{progress}%</span>
            </div>
            <div className="progress-bar-full">
              <div className="progress-fill-full" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="playlist-items-modern">
            {course.videos.map((video, index) => {
              const watched = isVideoWatched(video._id);
              const isActive = video._id === activeVideoId;
              return (
                <button
                  key={video._id}
                  className={`playlist-item-modern ${isActive ? 'active' : ''} ${watched ? 'watched' : ''}`}
                  onClick={() => handleVideoChange(video._id)}
                >
                  <div className="playlist-item-left">
                    <div className="playlist-item-number-modern">{index + 1}</div>
                    <div className="playlist-item-content-modern">
                      <div className="playlist-item-title-modern">{video.title}</div>
                      <div className="playlist-item-status-modern">
                        {watched ? (
                          <span className="status-completed-modern">
                            <CheckCircle size={12} />
                            Completed
                          </span>
                        ) : (
                          <span className="status-pending-modern">Not watched</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <div className="playlist-play-indicator">
                      <Play size={14} fill="currentColor" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
