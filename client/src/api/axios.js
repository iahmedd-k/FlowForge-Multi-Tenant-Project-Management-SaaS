import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  withCredentials: false, // No cookies, using Bearer tokens instead
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    console.log('[Axios] Adding token to request:', config.url);
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log('[Axios] No token found in localStorage for:', config.url);
  }
  return config;
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
  (response) => {
    // Store token if returned in response (from login/register)
    if (response.data?.data?.accessToken) {
      console.log('[Axios] Saving token from response');
      localStorage.setItem('accessToken', response.data.data.accessToken);
    }
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    console.log('[Axios] Response error:', status);

    if (status === 401) {
      // Clear token and redirect to login
      console.log('[Axios] 401 error - clearing token and redirecting to login');
      localStorage.removeItem('accessToken');
      window.dispatchEvent(new Event('auth:expired'));

      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
