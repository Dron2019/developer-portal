import api from './axios'

export const getProjects = (params) => api.get('/projects', { params })
export const getProject = (id) => api.get(`/projects/${id}`)
export const createProject = (data) => api.post('/projects', data)
export const updateProject = (id, data) => api.put(`/projects/${id}`, data)
export const deleteProject = (id) => api.delete(`/projects/${id}`)

export const getProjectMembers = (projectId) => api.get(`/projects/${projectId}/members`)
export const addProjectMember = (projectId, data) => api.post(`/projects/${projectId}/members`, data)
export const updateProjectMember = (projectId, userId, data) => api.put(`/projects/${projectId}/members/${userId}`, data)
export const removeProjectMember = (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`)

export const getProjectServers = (projectId) => api.get(`/projects/${projectId}/servers`)
export const createProjectServer = (projectId, data) => api.post(`/projects/${projectId}/servers`, data)
export const updateProjectServer = (projectId, serverId, data) => api.put(`/projects/${projectId}/servers/${serverId}`, data)
export const deleteProjectServer = (projectId, serverId) => api.delete(`/projects/${projectId}/servers/${serverId}`)
export const getServerPassword = (projectId, serverId) => api.get(`/projects/${projectId}/servers/${serverId}/password`)

export const getProjectFiles = (projectId) => api.get(`/projects/${projectId}/files`)
export const uploadProjectFile = (projectId, formData) =>
  api.post(`/projects/${projectId}/files`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteProjectFile = (projectId, fileId) => api.delete(`/projects/${projectId}/files/${fileId}`)
export const downloadProjectFile = (projectId, fileId) =>
  api.get(`/projects/${projectId}/files/${fileId}/download`, { responseType: 'blob' })

export const getProjectNotes = (projectId) => api.get(`/projects/${projectId}/notes`)
export const createProjectNote = (projectId, data) => api.post(`/projects/${projectId}/notes`, data)
export const updateProjectNote = (projectId, noteId, data) => api.put(`/projects/${projectId}/notes/${noteId}`, data)
export const deleteProjectNote = (projectId, noteId) => api.delete(`/projects/${projectId}/notes/${noteId}`)

export const unlinkProjectRepository = (projectId, repoId) => api.delete(`/projects/${projectId}/repositories/${repoId}`)

export const getProjectActivity = (projectId) => api.get(`/projects/${projectId}/activity`)
