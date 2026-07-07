import apiClient from './client';

export const getAdminDashboard = () => apiClient.get('/admin/dashboard').then((res) => res.data);
export const getApplications = (params) => apiClient.get('/admin/applications', { params }).then((res) => res.data);
export const getApplicationDetail = (id) => apiClient.get(`/admin/applications/${id}`).then((res) => res.data);
export const getSubscriptions = (params) => apiClient.get('/admin/subscriptions', { params }).then((res) => res.data);
export const sendCampaignEmail = (payload) => apiClient.post('/admin/campaigns/send', payload).then((res) => res.data);
export const updateApplicationStatus = (id, payload) => apiClient.patch(`/admin/applications/${id}/status`, payload).then((res) => res.data);
export const requestCorrection = (id, payload) => apiClient.patch(`/admin/applications/${id}/request-correction`, payload).then((res) => res.data);
