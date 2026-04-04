import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { ArrowLeft, CheckCircle, Play, Star, X } from 'lucide-react';

export default function StudentCoursePlayer({ user, onLogout }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

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
    try {
      await api.submitCourseReview(courseId, { rating, comment: review });
      setReview('');
      alert('Review submitted successfully!');
    } catch (error) {
      console.error(error);
    }
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

  return (
    <div className="course-player-layout">
      {/* Header */}
      <div className="player-header">
        <button className="back-btn" onClick={() => navigate('/dashboard/my-courses')}>
          <ArrowLeft size={20} />
          Back to My Courses
        </button>
        <div className="player-header-info">
          <h1 className="player-course-title">{course.title}</h1>
          <span className="player-progress">{progress}% Complete</span>
        </div>
      </div>

      <div className="player-content">
        {/* Video Player */}
        <div className="player-main">
          {activeVideo && (
            <>
              <div className="video-container">
                <video
                  key={activeVideoId}
                  controls
                  controlsList="nodownload"
                  src={activeVideo.videoUrl}
                  data-watched={isVideoWatched(activeVideoId) ? 'true' : 'false'}
                  onTimeUpdate={(e) => markVideoWatched(activeVideoId, e)}
                />
              </div>
              <div className="video-info">
                <div className="video-title-row">
                  <h2 className="video-title">{activeVideo.title}</h2>
                  {isVideoWatched(activeVideoId) && (
                    <span className="watched-badge-large">
                      <CheckCircle size={18} />
                      Completed
                    </span>
                  )}
                </div>
                <p className="video-instructor">Instructor: {course.instructor?.email || 'EduFlow'}</p>
              </div>

              {/* Review Section */}
              <div className="review-section">
                <h3 className="review-title">Rate this course</h3>
                <div className="review-form">
                  <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="review-select">
                    <option value={5}>⭐⭐⭐⭐⭐ Excellent</option>
                    <option value={4}>⭐⭐⭐⭐ Good</option>
                    <option value={3}>⭐⭐⭐ Average</option>
                    <option value={2}>⭐⭐ Below Average</option>
                    <option value={1}>⭐ Poor</option>
                  </select>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your thoughts about this course..."
                    className="review-textarea"
                    rows={3}
                  />
                  <button className="primary-btn" onClick={submitReview}>
                    Submit Review
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Playlist Sidebar */}
        <div className="player-sidebar">
          <div className="playlist-header">
            <h3>Course Content</h3>
            <span className="playlist-count">{course.videos.length} videos</span>
          </div>
          <div className="playlist-progress">
            <div className="progress-bar-full">
              <div className="progress-fill-full" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-text">{course.watchedVideos?.length || 0} of {course.videos.length} completed</span>
          </div>
          <div className="playlist-items">
            {course.videos.map((video, index) => {
              const watched = isVideoWatched(video._id);
              const isActive = video._id === activeVideoId;
              return (
                <button
                  key={video._id}
                  className={`playlist-item ${isActive ? 'active' : ''} ${watched ? 'watched' : ''}`}
                  onClick={() => setActiveVideoId(video._id)}
                >
                  <div className="playlist-item-number">{index + 1}</div>
                  <div className="playlist-item-content">
                    <div className="playlist-item-title">{video.title}</div>
                    <div className="playlist-item-status">
                      {watched ? (
                        <span className="status-completed">
                          <CheckCircle size={14} />
                          Completed
                        </span>
                      ) : (
                        <span className="status-pending">Not watched</span>
                      )}
                    </div>
                  </div>
                  {isActive && <Play size={16} className="playlist-play-icon" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
