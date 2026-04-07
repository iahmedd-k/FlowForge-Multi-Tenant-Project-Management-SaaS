import api from './axios';

export const getSummary  = () => api.get('/reports/summary');
export const getWorkload = () => api.get('/reports/workload');
export const getTrend    = () => api.get('/reports/trend');
export const getOverdue  = () => api.get('/reports/overdue');