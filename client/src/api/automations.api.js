import api from './axios';

export const getAutomations = (workspaceId) => api.get('/automations', { params: { workspaceId } });
export const syncAutomations = (data) => api.put('/automations/sync', data);
export const createAutomation = (data) => api.post('/automations', data);
export const updateAutomation = (id, data) => api.patch(`/automations/${id}`, data);
export const deleteAutomation = (id) => api.delete(`/automations/${id}`);
export const toggleAutomation = (id) => api.post(`/automations/${id}/toggle`);
