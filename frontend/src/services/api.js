import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Memory API
export const memoriesApi = {
  getAll: (params) => api.get('/memories', { params }),
  getById: (id) => api.get(`/memories/${id}`),
  create: (data) => api.post('/memories', data),
  update: (id, data) => api.put(`/memories/${id}`, data),
  delete: (id) => api.delete(`/memories/${id}`),
  getRecent: (limit = 10) => api.get('/memories/recent', { params: { limit } }),
  getStats: () => api.get('/memories/stats')
}

// Search API
export const searchApi = {
  semantic: (data) => api.post('/search/semantic', data),
  text: (params) => api.get('/search', { params }),
  suggestions: () => api.get('/search/suggestions')
}

// Chat API
export const chatApi = {
  sendMessage: (data) => api.post('/chat/sessions/' + (data.sessionId || '').replace(/^\//, '') + '/messages', data),
  getSessions: () => api.get('/chat/sessions'),
  getSession: (sessionId) => api.get(`/chat/sessions/${sessionId}`),
  createSession: (title) => api.post('/chat/sessions', { title }),
  deleteSession: (sessionId) => api.delete(`/chat/sessions/${sessionId}`),
  quickQuestion: (question) => api.post('/chat/quick', { question })
}

// Categories API
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
}

// LLM Settings API
export const llmSettingsApi = {
  getSettings: () => api.get('/llm-settings'),
  updateSettings: (data) => api.put('/llm-settings', data),
  getAvailableModels: () => api.get('/llm-settings/models'),
  getOllamaStatus: () => api.get('/llm-settings/ollama/status'),
  pullOllamaModel: (modelName) => api.post('/llm-settings/ollama/pull', { modelName }),
  deleteOllamaModel: (modelName) => api.delete(`/llm-settings/ollama/models/${modelName}`)
}

// Analytics API
export const analyticsApi = {
  getTimeline: (params) => api.get('/analytics/timeline', { params }),
  getCategoryDistribution: (params) => api.get('/analytics/categories', { params }),
  getBusiestTimes: (params) => api.get('/analytics/busiest', { params }),
  getDueDateStats: () => api.get('/analytics/duedates'),
  getSummaryStats: () => api.get('/analytics/summary')
}

// Cleanup API
export const cleanupApi = {
  getAllJobs: () => api.get('/cleanup/jobs'),
  getJob: (id) => api.get(`/cleanup/jobs/${id}`),
  createJob: (data) => api.post('/cleanup/jobs', data),
  updateJob: (id, data) => api.put(`/cleanup/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/cleanup/jobs/${id}`),
  runJob: (id) => api.post(`/cleanup/jobs/${id}/run`),
  previewJob: (data) => api.post('/cleanup/preview', data),
  getJobLogs: (id, params) => api.get(`/cleanup/jobs/${id}/logs`, { params })
}

export default api
