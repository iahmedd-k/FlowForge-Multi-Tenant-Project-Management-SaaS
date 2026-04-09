import api from './axios';

const authConfig = { skipAuthRefresh: true };

export const registerApi = (data) => api.post('/auth/register', data, authConfig);

export const loginApi = (data) => api.post('/auth/login', data, authConfig);

export const logoutApi = () => api.post('/auth/logout', null, authConfig);

export const getMeApi = () => api.get('/auth/me');
export const updateProfileApi = (data) => api.put('/auth/profile', data);
export const changePasswordApi = (data) => api.put('/auth/password', data);

export const refreshApi = () => api.post('/auth/refresh', null, authConfig);

export const previewInviteApi = (token) => api.get(`/auth/invite/preview?token=${encodeURIComponent(token)}`, authConfig);

export const declineInviteApi = (token) => api.post('/auth/invite/decline', { token }, authConfig);

export const acceptInviteApi = (data) => api.post('/auth/invite/accept', data, authConfig);

// Google OAuth
export const getGoogleAuthUrl = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/google-callback`;
  const scope = 'profile email';
  const responseType = 'code';
  
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}`;
};

export const googleSignupApi = (data) => api.post('/auth/google/callback', data, authConfig);
