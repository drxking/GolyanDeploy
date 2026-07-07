import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const API_ORIGIN = /^https?:\/\//i.test(API_BASE_URL) ? API_BASE_URL.replace(/\/api.*$/, '') : '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('pgs_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function saveSession(payload) {
  const token = payload.accessToken || payload.token;
  if (token) localStorage.setItem('pgs_token', token);
  if (payload.user) localStorage.setItem('pgs_user', JSON.stringify(payload.user));
  window.dispatchEvent(new Event('pgs-auth-change'));
}

export function clearSession() {
  localStorage.removeItem('pgs_token');
  localStorage.removeItem('pgs_user');
  window.dispatchEvent(new Event('pgs-auth-change'));
}

function cleanMessage(message) {
  if (typeof message !== 'string') return '';
  const normalized = message.trim();
  if (!normalized || normalized.toLowerCase() === 'undefined' || normalized.toLowerCase() === 'null') return '';
  return normalized;
}

export function getApiError(error) {
  const status = error?.response?.status;
  const serverMessage = cleanMessage(error?.response?.data?.message);

  if (serverMessage && status < 500) return serverMessage;
  if (status === 401) return 'Please sign in again to continue.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested information could not be found.';
  if (status >= 500) return 'Something went wrong on our side. Please try again later.';

  const clientMessage = cleanMessage(error?.message);
  if (clientMessage === 'Network Error') return 'Unable to connect to the server. Please check your internet connection and try again.';

  return clientMessage || 'Something went wrong. Please try again.';
}

export function getFileUrl(file) {
  const fileUrl = file?.fileUrl || (file?.filePath ? `/${file.filePath}` : '');
  if (!fileUrl) return '';
  if (/^(https?:)?\/\//i.test(fileUrl) || fileUrl.startsWith('blob:')) return fileUrl;
  return `${API_ORIGIN}${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`;
}

export default apiClient;
