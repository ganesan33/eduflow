import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../services/api';
import { Award, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

export default function StudentBecomeInstructor({ user, onLogout }) {
  const [request, setRequest] = useState(null);
  const [application, setApplication] = useState({
    headline: '',
    experienceYears: 0,
    expertise: '',
    motivation: '',
    portfolioUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRequest = async () => {
      try {
        const data = await api.getMyInstructorRequest();
        setRequest(data.request || null);
      } catch (err) {
        console.error(err);
      }
    };
    loadRequest();
  }, []);

  const submitApplication = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.createInstructorRequest(application);
      setApplication({
        headline: '',
        experienceYears: 0,
        expertise: '',
        motivation: '',
        portfolioUrl: ''
      });
      const data = await api.getMyInstructorRequest();
      setRequest(data.request || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const status = request?.status || 'not-requested';

  return (
    <DashboardLayout user={user} onLogout={onLogout} title="Become an Instructor">
      <div className="page-header">
        <div>
          <h1 className="page-title">Become an Instructor</h1>
          <p className="page-subtitle">Share your knowledge and teach on EduFlow</p>
        </div>
      </div>

      {/* Status Banner */}
      {status !== 'not-requested' && (
        <div className={`status-banner ${status}`}>
          {status === 'pending' && (
            <>
              <Clock size={24} />
              <div>
                <h3>Application Under Review</h3>
                <p>We're reviewing your application. You'll hear from us soon!</p>
              </div>
            </>
          )}
          {status === 'approved' && (
            <>
              <CheckCircle size={24} />
              <div>
                <h3>Application Approved!</h3>
                <p>Congratulations! Please sign out and sign back in to access your Instructor Dashboard.</p>
              </div>
            </>
          )}
          {status === 'rejected' && (
            <>
              <XCircle size={24} />
              <div>
                <h3>Application Not Approved</h3>
                <p>Unfortunately, your application was not approved at this time. You can reapply below.</p>
                {request?.reviewNotes && (
                  <p className="review-notes"><strong>Feedback:</strong> {request.reviewNotes}</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Benefits Section */}
      <div className="benefits-section">
        <h2 className="section-title-modern">Why Teach on EduFlow?</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon purple">
              <Award size={24} />
            </div>
            <h3>Share Your Expertise</h3>
            <p>Help students around the world learn new skills and advance their careers</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon blue">
              <Award size={24} />
            </div>
            <h3>Build Your Brand</h3>
            <p>Establish yourself as an expert in your field and grow your professional network</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon green">
              <Award size={24} />
            </div>
            <h3>Flexible Schedule</h3>
            <p>Create and publish courses on your own time, at your own pace</p>
          </div>
        </div>
      </div>

      {/* Application Form */}
      {status !== 'approved' && (
        <div className="application-form-section">
          <h2 className="section-title-modern">
            {status === 'rejected' ? 'Reapply to Become an Instructor' : 'Apply to Become an Instructor'}
          </h2>
          
          {error && (
            <div className="error-banner">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <form onSubmit={submitApplication} className="application-form">
            <div className="form-group-modern">
              <label>Professional Headline *</label>
              <input
                type="text"
                value={application.headline}
                onChange={(e) => setApplication({ ...application, headline: e.target.value })}
                placeholder="e.g., Senior JavaScript Developer & Educator"
                required
                disabled={status === 'pending'}
              />
              <span className="form-hint">How would you describe yourself professionally?</span>
            </div>

            <div className="form-row-modern">
              <div className="form-group-modern">
                <label>Years of Experience *</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={application.experienceYears}
                  onChange={(e) => setApplication({ ...application, experienceYears: Number(e.target.value) })}
                  required
                  disabled={status === 'pending'}
                />
              </div>

              <div className="form-group-modern">
                <label>Portfolio URL</label>
                <input
                  type="url"
                  value={application.portfolioUrl}
                  onChange={(e) => setApplication({ ...application, portfolioUrl: e.target.value })}
                  placeholder="https://yourportfolio.com"
                  disabled={status === 'pending'}
                />
              </div>
            </div>

            <div className="form-group-modern">
              <label>Areas of Expertise *</label>
              <input
                type="text"
                value={application.expertise}
                onChange={(e) => setApplication({ ...application, expertise: e.target.value })}
                placeholder="e.g., JavaScript, React, Node.js, Web Development"
                required
                disabled={status === 'pending'}
              />
              <span className="form-hint">List your main skills and topics you can teach</span>
            </div>

            <div className="form-group-modern">
              <label>Why do you want to teach on EduFlow? *</label>
              <textarea
                value={application.motivation}
                onChange={(e) => setApplication({ ...application, motivation: e.target.value })}
                placeholder="Tell us about your teaching experience and what motivates you to share your knowledge..."
                rows={6}
                required
                disabled={status === 'pending'}
              />
              <span className="form-hint">Minimum 100 characters</span>
            </div>

            <button
              type="submit"
              className="primary-btn large"
              disabled={loading || status === 'pending'}
            >
              {loading ? 'Submitting...' : status === 'pending' ? 'Application Pending' : 'Submit Application'}
            </button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
