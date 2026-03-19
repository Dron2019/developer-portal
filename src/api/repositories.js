import api from './axios'

export const getRepositories = (params) => api.get('/repositories', { params })
export const getRepository = (id) => api.get(`/repositories/${id}`)
export const syncRepositories = () => api.post('/repositories/sync')
export const deleteRepository = (id) => api.delete(`/repositories/${id}`)
export const getRepositoryMembers = (id) => api.get(`/repositories/${id}/members`)
export const removeRepositoryCollaborator = (id, username) => api.delete(`/repositories/${id}/collaborators/${username}`)
export const getRepositoryRequests = (params) => api.get('/repository-requests', { params })
export const createRepositoryRequest = (data) => api.post('/repository-requests', data)
export const updateRepositoryRequest = (id, data) => api.put(`/repository-requests/${id}`, data)
export const deleteRepositoryRequest = (id) => api.delete(`/repository-requests/${id}`)
export const getNotifications = () => api.get('/notifications')
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`)
