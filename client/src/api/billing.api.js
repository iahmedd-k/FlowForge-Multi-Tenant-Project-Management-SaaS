import api from './axios';

export const getPlans           = ()       => api.get('/billing/plans');
export const getBillingStatus   = ()       => api.get('/billing/status');
export const getWorkspaceUsage  = ()       => api.get('/billing/usage');
export const createCheckout     = (priceId)=> api.post('/billing/checkout', { priceId });
export const openPortal         = ()       => api.post('/billing/portal');