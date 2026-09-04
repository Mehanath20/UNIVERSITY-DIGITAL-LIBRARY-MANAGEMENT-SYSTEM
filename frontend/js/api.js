/**
 * Centralized API client for DLMS Frontend
 */
const API = {
  baseUrl: window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? ''
    : '',

  getToken() {
    return localStorage.getItem('dlms_token');
  },

  setToken(token) {
    localStorage.setItem('dlms_token', token);
  },

  getUser() {
    const raw = localStorage.getItem('dlms_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem('dlms_user', JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem('dlms_token');
    localStorage.removeItem('dlms_user');
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Handle 401 Unauthorized
        if (response.status === 401) {
          const isLoginPage = window.location.pathname.includes('login.html');
          if (!isLoginPage && !endpoint.includes('/api/auth/login')) {
            this.clearAuth();
            alert('Your session has expired. Please sign in again.');
            window.location.href = '/pages/login.html';
            return { success: false, message: 'Session expired' };
          }
        }

        // Handle 403 Forbidden
        if (response.status === 403) {
          console.warn('[RBAC Forbidden]:', data.message);
        }

        const errorMessage = data.message || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};
