import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../services/api';
import { Upload, Plus, Trash2, AlertCircle } from 'lucide-react';

export default function InstructorCreateCourse({ user, onLogout }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [level, setLevel] = useState('beginner');
  const [thumbnail, setThumbnail] = useState(null);
  const [videos, setVideos] = useState([{ title: '', file: null }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const addVideo = () => {
    setVideos([...videos, { title: '', file: null }]);
  };

  const removeVideo = (index) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const updateVideo = (index, field, value) => {
    const updated = videos.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    setVideos(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !thumbnail) {
      setError('Course title and thumbnail are required');
      return;
    }

    if (videos.some(v => !v.title.trim() || !v.file)) {
      setError('All videos must have a title and file');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('category', category);
    formData.append('level', level);
    formData.append('thumbnail', thumbnail);

    videos.forEach((video, index) => {
      formData.append(`videos[${index}][title]`, video.title.trim());
      formData.append(`videos[${index}][file]`, video.file);
    });

    setSaving(true);
    try {
      await api.createCourse(formData);
      navigate('/dashboard/my-courses');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout user={user} onLogout={onLogout} title="Create Course">
      <div className="page-header">
        <div>
          <h1 className="page-title">Create New Course</h1>
          <p className="page-subtitle">Share your knowledge with students worldwide</p>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-course-form">
        <div className="form-section">
          <h2 className="form-section-title">Course Details</h2>

          <div className="form-group-modern">
            <label>Course Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive course title"
              required
            />
          </div>

          <div className="form-row-modern">
            <div className="form-group-modern">
              <label>Category *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="general">General</option>
                <option value="development">Development</option>
                <option value="design">Design</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div className="form-group-modern">
              <label>Level *</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="form-group-modern">
            <label>Course Thumbnail *</label>
            <div className="file-upload-area">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                id="thumbnail-upload"
                required
              />
              <label htmlFor="thumbnail-upload" className="file-upload-label">
                <Upload size={24} />
                <span>{thumbnail ? thumbnail.name : 'Choose thumbnail image'}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <h2 className="form-section-title">Course Videos</h2>
            <button type="button" className="secondary-btn" onClick={addVideo}>
              <Plus size={16} />
              Add Video
            </button>
          </div>

          <div className="videos-list">
            {videos.map((video, index) => (
              <div key={index} className="video-upload-item">
                <span className="video-number">{index + 1}</span>
                <div className="video-inputs">
                  <input
                    type="text"
                    placeholder="Video title"
                    value={video.title}
                    onChange={(e) => updateVideo(index, 'title', e.target.value)}
                    required
                  />
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => updateVideo(index, 'file', e.target.files?.[0] || null)}
                    required
                  />
                </div>
                {videos.length > 1 && (
                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => removeVideo(index)}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="secondary-btn" onClick={() => navigate('/dashboard/my-courses')}>
            Cancel
          </button>
          <button type="submit" className="primary-btn large" disabled={saving}>
            {saving ? 'Publishing...' : 'Publish Course'}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
