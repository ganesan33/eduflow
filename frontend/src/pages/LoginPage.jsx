import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  BookOpen, AlertCircle, MailCheck, KeyRound,
} from 'lucide-react';

export default function LoginPage({ onAuthenticated }) {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialMode = params.get('mode') || 'login';

  const [mode, setMode] = useState(['login', 'signup', 'verify', 'reset'].includes(initialMode) ? initialMode : 'login');
  const [email, setEmail] = useState(params.get('email') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState(params.get('token') || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const effectiveEmail = email || params.get('email') || '';
  const isCodeFlow = mode === 'verify' || mode === 'reset';

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'signup' || mode === 'reset') {
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
      if (mode === 'login') {
        const data = await api.login({ email, password });
        onAuthenticated(data.user);
        navigate('/dashboard');
      } else if (mode === 'signup') {
        const data = await api.signup({ email, password });
        setMode('verify');
        setSuccess(data.message || 'Account created. Please verify your email.');
      } else if (mode === 'verify') {
        const data = await api.confirmEmailVerification({ email: effectiveEmail, token });
        onAuthenticated(data.user);
        navigate('/dashboard');
      } else if (mode === 'reset') {
        const data = await api.confirmPasswordReset({
          email: effectiveEmail,
          token,
          newPassword: password
        });
        setSuccess(data.message || 'Password reset successful. Please sign in.');
        switchMode('login');
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const requestEmailVerification = async () => {
    try {
      setError('');
      setSuccess('');
      setSubmitting(true);
      const data = await api.requestEmailVerification({ email: effectiveEmail });
      setSuccess(data.message || 'Verification email sent if account exists.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const requestPasswordReset = async () => {
    try {
      setError('');
      setSuccess('');
      setSubmitting(true);
      const data = await api.requestPasswordReset({ email });
      setMode('reset');
      setSuccess(data.message || 'Reset email sent if account exists.');
    } catch (requestError) {
      setError(requestError.message);
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
          <h2>
            {mode === 'login' && 'Welcome back!'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'verify' && 'Verify your email'}
            {mode === 'reset' && 'Reset password'}
          </h2>
          <p className="subtitle">
            {mode === 'login' && 'Sign in to continue your learning journey.'}
            {mode === 'signup' && 'Create your account and verify your email to continue.'}
            {mode === 'verify' && 'Enter the verification code sent to your email.'}
            {mode === 'reset' && 'Enter the reset code sent to your email and set a new password.'}
          </p>

          {!isCodeFlow && (
            <div className="auth-tabs">
              <button
                className={`tab${mode === 'login' ? ' active' : ''}`}
                type="button"
                onClick={() => switchMode('login')}
              >
                Sign In
              </button>
              <button
                className={`tab${mode === 'signup' ? ' active' : ''}`}
                type="button"
                onClick={() => switchMode('signup')}
              >
                Sign Up
              </button>
            </div>
          )}

          {isCodeFlow && (
            <button
              type="button"
              className="secondary-btn"
              onClick={() => switchMode('login')}
              style={{ marginBottom: '1rem', width: '100%', justifyContent: 'center' }}
            >
              Back to Sign In
            </button>
          )}

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

            {mode !== 'verify' && (
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
            )}

            {mode === 'verify' || mode === 'reset' ? (
              <div className="form-group">
                <label htmlFor="ef-token">{mode === 'verify' ? 'Verification code' : 'Reset code'}</label>
                <input
                  id="ef-token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={mode === 'verify' ? 'Enter verification code' : 'Enter reset code'}
                  required
                />
              </div>
            ) : null}

            {(mode === 'signup' || mode === 'reset') && (
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
            )}

            {mode === 'verify' && (
              <button type="button" className="secondary-btn" onClick={requestEmailVerification} disabled={submitting}>
                <MailCheck size={14} /> Resend Verification Email
              </button>
            )}

            {mode === 'login' && (
              <button type="button" className="secondary-btn" onClick={requestPasswordReset} disabled={submitting}>
                <KeyRound size={14} /> Forgot Password
              </button>
            )}

            {error && (
              <div className="error-box">
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}

            {success && <div className="success-box">{success}</div>}

            <button type="submit" className="primary-btn full-width" disabled={submitting}>
              {submitting
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign In to EduFlow'
                : mode === 'signup'
                ? 'Create Account'
                : mode === 'verify'
                ? 'Verify Email'
                : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


