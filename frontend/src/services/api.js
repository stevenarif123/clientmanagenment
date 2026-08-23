import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  checkSetup: () => api.get('/auth/check-setup'),
  setup: (data) => api.post('/auth/setup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify')
}

// Clients API
export const clientsAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getOne: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  getCommunications: (id) => api.get(`/clients/${id}/communications`),
  getFiles: (id) => api.get(`/clients/${id}/files`)
}

// Projects API
export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getBudgetSummary: (id) => api.get(`/projects/${id}/budget-summary`),
  // Expenses
  getExpenses: (id) => api.get(`/projects/${id}/expenses`),
  createExpense: (id, data) => api.post(`/projects/${id}/expenses`, data),
  updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  // Payments
  getPayments: (id) => api.get(`/projects/${id}/payments`),
  createPayment: (id, data) => api.post(`/projects/${id}/payments`, data),
  updatePayment: (id, data) => api.put(`/payments/${id}`, data),
  deletePayment: (id) => api.delete(`/payments/${id}`),
  // Communications
  getCommunications: (id) => api.get(`/projects/${id}/communications`),
  createCommunication: (id, data) => api.post(`/projects/${id}/communications`, data),
  deleteCommunication: (id) => api.delete(`/communications/${id}`),
  // Files
  getFiles: (id) => api.get(`/projects/${id}/files`)
}

// Services API
export const servicesAPI = {
  getAll: () => api.get('/services'),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`)
}

// Submissions API
export const submissionsAPI = {
  getAll: (params) => api.get('/submissions', { params }),
  getOne: (id) => api.get(`/submissions/${id}`),
  update: (id, data) => api.put(`/submissions/${id}`, data),
  delete: (id) => api.delete(`/submissions/${id}`),
  convertToClient: (id, data) => api.post(`/submissions/${id}/convert`, data),
  getDuplicates: (id) => api.get(`/submissions/${id}/duplicates`)
}

// Files API
export const filesAPI = {
  upload: (formData) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/files/${id}`)
}

// Reports API
export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getFinancial: (params) => api.get('/reports/financial', { params }),
  getBudgetOverview: (params) => api.get('/reports/budget-overview', { params }),
  exportClients: (params) => api.get('/reports/export/clients', { params }),
  exportProjects: (params) => api.get('/reports/export/projects', { params }),
  exportProjectDetail: (id, params) => api.get(`/reports/export/project/${id}`, { params })
}

export default api
