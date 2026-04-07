import api from './axios';

export const getWorkspace    = ()        => api.get('/workspace');
export const listWorkspaces  = ()        => api.get('/workspace/list');
export const createWorkspace = (data)    => api.post('/workspace/create', data);
export const switchWorkspace = (data)    => api.post('/workspace/switch', data);
export const updateWorkspace = (data)    => api.put('/workspace', data);
export const getMembers      = ()        => api.get('/workspace/members');
export const getInvitations  = ()        => api.get('/workspace/invitations');
export const inviteUser      = (data)    => api.post('/workspace/invite', data);
export const updateRole      = (id,data) => api.put(`/workspace/members/${id}`, data);
export const removeMember    = (id)      => api.delete(`/workspace/members/${id}`);
export const cancelInvitation = (id)     => api.delete(`/workspace/invitations/${id}`);
