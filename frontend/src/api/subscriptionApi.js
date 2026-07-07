import apiClient from './client';

export const createSubscription = (payload) => apiClient.post('/subscriptions', payload).then((res) => res.data.data);
