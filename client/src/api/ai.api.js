import api from './axios';

export const askAssistant = (data) => api.post('/ai/assistant', data);
