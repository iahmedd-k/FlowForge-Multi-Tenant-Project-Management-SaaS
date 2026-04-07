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
