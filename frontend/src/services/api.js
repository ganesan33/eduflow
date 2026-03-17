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
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  getCourses: () => request('/api/courses'),
  getEnrolledCourses: () => request('/api/courses/enrolled'),
  enrollCourse: (courseId) => request(`/api/courses/enroll/${courseId}`, {
    method: 'POST'
  }),
  markVideoWatched: (courseId, videoId) => request(`/api/courses/${courseId}/videos/${videoId}/watch`, {
    method: 'POST'
  }),
  getMyCourses: () => request('/api/courses/my-courses'),
  createCourse: (formData) => request('/api/courses', {
    method: 'POST',
    body: formData
  }),
  getAdminCourses: () => request('/api/admin/courses'),
  deleteAdminCourse: (courseId) => request(`/api/admin/courses/${courseId}`, {
    method: 'DELETE',
  })
};
