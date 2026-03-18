import api from './axios'

export const getGithubSettings = () => api.get('/settings/github')
export const updateGithubSettings = (data) => api.put('/settings/github', data)
