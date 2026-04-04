import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../services/api';
import { Users, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

export default function AdminInstructorRequests({ user, onLogout }) {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [reviewNotes, setReviewNotes] = useState({});

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      const data = await api.getAdminInstructorRequests(filter);
      setRequests(data.requests || []);
    } catch (error) {
      console.error(error);
    }
  };

  const reviewRequest = async (requestId, action) => {
    try {
      await api.reviewAdminInstructorRequest(requestId, {
        action,
        reviewNotes: reviewNotes[requestId] || ''
      });
      await loadRequests();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DashboardLayout user={user} onLogout={onLogout} title="Instructor Requests">
      <div className="page-header">
        <div>
          <h1 className="page-title">Instructor Applications</h1>
          <p className="page-subtitle">Review and manage instructor applications</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          <Clock size={16} />
          Pending
        </button>
        <button
          className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          <CheckCircle size={16} />
          Approved
        </button>
        <button
          className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          <XCircle size={16} />
          Rejected
        </button>
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="empty-state-modern">
          <Users size={48} />
          <h3>No applications found</h3>
          <p>Switch filter to view different statuses</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <div className="request-user-info">
                  <h3>{request.user?.email || 'Unknown User'}</h3>
                  <span className={`status-badge ${request.status}`}>
                    {request.status === 'pending' && <Clock size={14} />}
                    {request.status === 'approved' && <CheckCircle size={14} />}
                    {request.status === 'rejected' && <XCircle size={14} />}
                    {request.status}
                  </span>
                </div>
                <div className="request-meta">
                  Applied {new Date(request.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="request-body">
                <div className="request-field">
                  <label>Professional Headline</label>
                  <p>{request.headline}</p>
                </div>

                <div className="request-row">
                  <div className="request-field">
                    <label>Experience</label>
                    <p>{request.experienceYears} years</p>
                  </div>
                  <div className="request-field">
                    <label>Expertise</label>
                    <p>{request.expertise}</p>
                  </div>
                </div>

                {request.portfolioUrl && (
                  <div className="request-field">
                    <label>Portfolio</label>
                    <a href={request.portfolioUrl} target="_blank" rel="noopener noreferrer" className="portfolio-link">
                      {request.portfolioUrl}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                <div className="request-field">
                  <label>Motivation</label>
                  <p className="motivation-text">{request.motivation}</p>
                </div>

                {request.status === 'pending' && (
                  <>
                    <div className="request-field">
                      <label>Review Notes (Optional)</label>
                      <textarea
                        value={reviewNotes[request._id] || ''}
                        onChange={(e) => setReviewNotes({ ...reviewNotes, [request._id]: e.target.value })}
                        placeholder="Add notes for the applicant..."
                        rows={3}
                      />
                    </div>

                    <div className="request-actions">
                      <button
                        className="primary-btn"
                        onClick={() => reviewRequest(request._id, 'approve')}
                      >
                        <CheckCircle size={16} />
                        Approve Application
                      </button>
                      <button
                        className="danger-btn"
                        onClick={() => reviewRequest(request._id, 'reject')}
                      >
                        <XCircle size={16} />
                        Reject Application
                      </button>
                    </div>
                  </>
                )}

                {request.status !== 'pending' && request.reviewNotes && (
                  <div className="request-field">
                    <label>Review Notes</label>
                    <p className="review-notes-text">{request.reviewNotes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
