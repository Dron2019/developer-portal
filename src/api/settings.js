import api from './axios'

export const getGithubSettings = () => api.get('/settings/github')
export const updateGithubSettings = (data) => api.put('/settings/github', data)

export const getWebhookSettings = () => api.get('/settings/webhook')
export const updateWebhookSettings = (data) => api.put('/settings/webhook', data)
export const testWebhook = () => api.post('/settings/webhook/test')
