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

export default api
