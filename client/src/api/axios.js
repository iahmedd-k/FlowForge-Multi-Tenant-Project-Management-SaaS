import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((item) => (error ? item.reject(error) : item.resolve()));
  failedQueue = [];
};

const isAuthRoute = (url = '') => url.includes('/auth/');
const isRefreshRoute = (url = '') => url.includes('/auth/refresh');
const isPublicPath = (pathname = '') =>
  pathname === '/login' ||
  pathname === '/signup' ||
  pathname === '/auth' ||
  pathname.startsWith('/invite') ||
  pathname.startsWith('/accept-invite') ||
  pathname.startsWith('/auth/invite');

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const url = original.url || '';

    if (
      status !== 401 ||
      original._retry ||
      original.skipAuthRefresh ||
      isRefreshRoute(url) ||
      (isAuthRoute(url) && !url.includes('/auth/me'))
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(original))
        .catch((refreshError) => Promise.reject(refreshError));
    }

    original._retry = true;
    isRefreshing = true;

    try {
      await api.post('/auth/refresh', null, { skipAuthRefresh: true });
      processQueue(null);
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError);
      window.dispatchEvent(new Event('auth:expired'));

      if (!isPublicPath(window.location.pathname)) {
        window.location.replace('/login');
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
