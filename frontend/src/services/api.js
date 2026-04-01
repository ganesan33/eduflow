let refreshInFlight = null;

async function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    }).finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

async function request(url, options = {}, retryOn401 = true) {
  const response = await fetch(url, {
    credentials: 'include',
    ...options
  });

  const isRefreshRoute = url.includes('/api/auth/refresh');
  const isLoginOrSignup = url.includes('/api/auth/login') || url.includes('/api/auth/signup');
  const canRefresh = retryOn401 && response.status === 401 && !isRefreshRoute && !isLoginOrSignup;
  if (canRefresh) {
    const refreshResponse = await refreshSession();
    if (refreshResponse.ok) {
      return request(url, options, false);
    }
  }

  return handleResponse(response);
}

async function handleResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const fallbackMessage = response.status >= 500
      ? 'Server error'
      : 'Request failed';

    throw new Error(data?.message || fallbackMessage);
  }

  if (!data) {
    throw new Error('Server returned an empty response');
  }

  if (data.success === false) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const api = {
  getMe: () => request('/api/auth/me'),
  login: (payload) => request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  signup: (payload) => request('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  requestEmailVerification: (payload) => request('/api/auth/verify-email/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  confirmEmailVerification: (payload) => request('/api/auth/verify-email/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  requestPasswordReset: (payload) => request('/api/auth/password-reset/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  confirmPasswordReset: (payload) => request('/api/auth/password-reset/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  getMyInstructorRequest: () => request('/api/instructor-requests/me'),
  createInstructorRequest: (payload) => request('/api/instructor-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  getCourses: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params.set(key, String(value));
      }
    });

    const query = params.toString();
    return request(query ? `/api/courses?${query}` : '/api/courses');
  },
  getEnrolledCourses: () => request('/api/courses/enrolled'),
  enrollCourse: (courseId) => request(`/api/courses/enroll/${courseId}`, {
    method: 'POST'
  }),
  markVideoWatched: (courseId, videoId) => request(`/api/courses/${courseId}/videos/${videoId}/watch`, {
    method: 'POST'
  }),
  savePlaybackPosition: (courseId, videoId, payload) => request(`/api/courses/${courseId}/videos/${videoId}/playback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  submitCourseReview: (courseId, payload) => request(`/api/courses/${courseId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  getMyCourses: () => request('/api/courses/my-courses'),
  getInstructorAnalytics: () => request('/api/courses/my-courses/analytics'),
  createCourse: (formData) => request('/api/courses', {
    method: 'POST',
    body: formData
  }),
  updateCourse: (courseId, payload) => request(`/api/courses/${courseId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  getAdminCourses: () => request('/api/admin/courses'),
  getAdminAnalytics: () => request('/api/admin/analytics'),
  getAdminInstructorRequests: (status = 'pending') => request(`/api/admin/instructor-requests?status=${encodeURIComponent(status)}`),
  reviewAdminInstructorRequest: (requestId, payload) => request(`/api/admin/instructor-requests/${requestId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  deleteAdminCourse: (courseId) => request(`/api/admin/courses/${courseId}`, {
    method: 'DELETE',
  })
};
