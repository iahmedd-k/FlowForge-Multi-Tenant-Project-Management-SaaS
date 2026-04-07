import api from './axios';

export const getProjects    = ()        => api.get('/projects');
export const getProject     = (id)      => api.get(`/projects/${id}`);
export const createProject  = (data)    => api.post('/projects', data);
export const updateProject  = (id,data) => api.put(`/projects/${id}`, data);
export const deleteProject  = (id)      => api.delete(`/projects/${id}`);
export const addMember      = (id,data) => api.post(`/projects/${id}/members`, data);
export const removeMember   = (id,uid)  => api.delete(`/projects/${id}/members/${uid}`);