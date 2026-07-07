import apiClient from './client';

export const getMyApplication = () => apiClient.get('/application/me').then((res) => res.data.data);
export const getScholarshipCourses = (educationLevel) => apiClient.get('/application/scholarships', { params: { educationLevel } }).then((res) => res.data.data);
export const checkScholarshipAvailability = (payload) => apiClient.post('/application/scholarships/check', payload).then((res) => res.data.data);
export const saveAccountStep = () => apiClient.patch('/application/account').then((res) => res.data.data);
export const savePersonalInfo = (payload) => apiClient.patch('/application/personal-info', payload).then((res) => res.data.data);
export const saveAcademic = (payload) => apiClient.patch('/application/academic', payload).then((res) => res.data.data);
export const uploadDocument = (documentType, file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('documentType', documentType);
  formData.append('file', file);
  return apiClient
    .post('/application/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    .then((res) => res.data.data);
};
export const deleteDocument = (documentType) => apiClient.delete(`/application/documents/${documentType}`).then((res) => res.data.data);
export const submitApplication = (payload) => apiClient.post('/application/submit', payload).then((res) => res.data.data);
