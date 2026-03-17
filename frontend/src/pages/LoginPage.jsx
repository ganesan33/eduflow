import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { BookOpen, GraduationCap, Presentation, AlertCircle } from 'lucide-react';

export default function LoginPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = { email, password, ...(mode === 'signup' ? { role } : {}) };
      const data = mode === 'signup' ? await api.signup(payload) : await api.login(payload);
      onAuthenticated(data.user);
      navigate('/dashboard');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-split-page">
      {/* Left hero panel */}
      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <BookOpen size={26} color="white" />
            </div>
            <span className="auth-brand-name">EduFlow</span>
          </div>

          <h1>
            Learn <em>essential</em> career<br />and life skills
          </h1>
          <p className="hero-desc">
            Learn practical skills through clear video lessons and keep your
            learning journey organized in one place.
          </p>

          <div className="auth-features">
            {[
              'Find courses that match what you want to learn',
              'Watch lessons anytime and continue where you left off',
              'See your progress clearly as you complete each course',
              'Simple, clean experience for learning and teaching',
            ].map((item) => (
              <div className="auth-feature-item" key={item}>
                <div className="feature-check" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="auth-stats">
            <div className="auth-stat">
              <strong>Learn</strong>
              <span>Step by Step</span>
            </div>
            <div className="auth-stat">
              <strong>Practice</strong>
              <span>At Your Pace</span>
            </div>
            <div className="auth-stat">
              <strong>Grow</strong>
              <span>With Consistency</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <h2>{mode === 'login' ? 'Welcome back!' : 'Create your account'}</h2>
          <p className="subtitle">
            {mode === 'login'
              ? 'Sign in to continue your learning journey.'
              : 'Create your account to start learning or teaching.'}
          </p>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`tab${mode === 'login' ? ' active' : ''}`}
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
            >
              Sign In
            </button>
            <button
              className={`tab${mode === 'signup' ? ' active' : ''}`}
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="ef-email">Email address</label>
              <input
                id="ef-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ef-password">Password</label>
              <input
                id="ef-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
              />
            </div>

            {mode === 'signup' && (
              <>
                <div className="form-group">
                  <label htmlFor="ef-confirm">Confirm Password</label>
                  <input
                    id="ef-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="********"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>I want to</label>
                  <div className="role-cards">
                    <label
                      className={`role-card${role === 'student' ? ' selected' : ''}`}
                      onClick={() => setRole('student')}
                    >
                      <input type="radio" name="role" value="student" readOnly checked={role === 'student'} />
                      <div className="role-card-icon">
                        <GraduationCap size={22} />
                      </div>
                      <div className="role-card-label">Learn</div>
                      <div className="role-card-sub">as Student</div>
                    </label>
                    <label
                      className={`role-card${role === 'instructor' ? ' selected' : ''}`}
                      onClick={() => setRole('instructor')}
                    >
                      <input type="radio" name="role" value="instructor" readOnly checked={role === 'instructor'} />
                      <div className="role-card-icon">
                        <Presentation size={22} />
                      </div>
                      <div className="role-card-label">Teach</div>
                      <div className="role-card-sub">as Instructor</div>
                    </label>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="error-box">
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}

            <button type="submit" className="primary-btn full-width" disabled={submitting}>
              {submitting
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign In to EduFlow'
                : 'Create Free Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


