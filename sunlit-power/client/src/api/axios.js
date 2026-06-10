import axios from 'axios';

let accessToken = '';

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Crucial to send refresh token cookie
});

// Request interceptor to inject JWT
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle 401 token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if response is 401 and request has not been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the error is from the refresh endpoint itself, clear auth and reject
      if (originalRequest.url === '/auth/refresh' || originalRequest.url === '/api/auth/refresh') {
        setAccessToken('');
        localStorage.removeItem('sunlit_user');
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const apiBase = import.meta.env.VITE_API_URL || '/api';
        const refreshUrl = `${apiBase}${apiBase.endsWith('/') ? '' : '/'}auth/refresh`;
        const res = await axios.post(refreshUrl, {}, { withCredentials: true });
        const { accessToken: newToken, user } = res.data;

        setAccessToken(newToken);
        if (user) {
          localStorage.setItem('sunlit_user', JSON.stringify(user));
        }

        isRefreshing = false;
        processQueue(null, newToken);

        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        
        setAccessToken('');
        localStorage.removeItem('sunlit_user');
        window.dispatchEvent(new Event('auth-logout'));

        // Redirect to login if not already on an auth page
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/signup') && 
            !window.location.pathname.includes('/forgot-password') && 
            !window.location.pathname.includes('/reset-password') && 
            window.location.pathname !== '/') {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
