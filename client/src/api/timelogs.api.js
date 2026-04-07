import api from './axios';

export const startTimeLog = (data) => api.post('/timelogs/start', data);
export const stopTimeLog = (id) => api.post(`/timelogs/stop/${id}`);
export const getActiveTimeLog = (workspaceId) => api.get('/timelogs/active', { params: { workspaceId } });
export const getTaskTimeLogs = (taskId) => api.get(`/timelogs/task/${taskId}`);
export const getUserTimeLogs = (params) => api.get('/timelogs/user', { params });
