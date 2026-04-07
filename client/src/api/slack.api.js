import api from './axios';

// Slack Integration APIs
export const saveSlackWebhook = (webhookUrl) =>
  api.post('/integrations/slack/save', { webhookUrl });

export const removeSlackWebhook = () =>
  api.delete('/integrations/slack/remove');

export const testSlackWebhook = () =>
  api.post('/integrations/slack/test');

export const getSlackStatus = () =>
  api.get('/integrations/slack/status');
