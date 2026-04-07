import api from './axios';

export const getTasks      = (params)    => api.get('/tasks', { params });
export const getTask       = (id)        => api.get(`/tasks/${id}`);
export const createTask    = (data)      => api.post('/tasks', data);
export const updateTask    = (id, data)  => api.put(`/tasks/${id}`, data);
export const uploadTaskAttachment = (data) => api.post('/tasks/upload', data);
export const updateStatus  = (id, status)=> api.patch(`/tasks/${id}/status`, { status });
export const deleteTask    = (id)        => api.delete(`/tasks/${id}`);
export const addComment    = (id, text)  => api.post(`/tasks/${id}/comments`, { text });
export const deleteComment = (id, cId)   => api.delete(`/tasks/${id}/comments/${cId}`);
