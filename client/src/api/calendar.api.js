import api from './axios';

// Calendar Integration APIs
export const generateCalendarFeedToken = () =>
  api.post('/integrations/calendar/generate-feed-token');

export const revokeFeedToken = () =>
  api.delete('/integrations/calendar/revoke-feed-token');

export const getTokenStatus = () =>
  api.get('/integrations/calendar/token-status');

export const exportTaskToCalendar = (taskId) =>
  api.get(`/integrations/calendar/export/task/${taskId}`, { responseType: 'blob' });

export const exportProjectToCalendar = (projectId) =>
  api.get(`/integrations/calendar/export/project/${projectId}`, { responseType: 'blob' });

// Get the full feed URL for a given token
export const getCalendarFeedUrl = (token) => {
  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
  return `${baseUrl}/api/integrations/calendar/feed/${token}`;
};
