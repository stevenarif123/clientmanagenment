/**
 * Unified API Client for Client Management System
 */

// Dynamically resolve API base path based on current URL path (supports subdomains, subfolders, and root)
const getApiBase = () => {
  const path = window.location.pathname.replace(/\/index\.html$/i, '');
  const dir = path.endsWith('/') ? path.slice(0, -1) : path;
  return `${dir}/api`;
};
window.getApiBase = getApiBase;

const apiClient = axios.create({
  baseURL: getApiBase(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.Auth && typeof window.Auth.clearAuth === 'function') {
        window.Auth.clearAuth();
      } else {
        localStorage.removeItem('auth_token');
      }
      if (window.location.hash !== '#/login' && window.location.hash !== '#/setup') {
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);


window.API = {
  // Auth API
  auth: {
    checkSetup: () => apiClient.get('/auth/check-setup'),
    setup: (data) => apiClient.post('/auth/setup', data),
    login: (data) => apiClient.post('/auth/login', data),
    logout: () => apiClient.post('/auth/logout'),
    verify: () => apiClient.get('/auth/verify'),
    updateProfile: (data) => apiClient.put('/auth/profile', data),
    changePassword: (data) => apiClient.put('/auth/change-password', data)
  },

  // Clients API
  clients: {
    getAll: (params) => apiClient.get('/clients', { params }),
    getOne: (id) => apiClient.get(`/clients/${id}`),
    create: (data) => apiClient.post('/clients', data),
    update: (id, data) => apiClient.put(`/clients/${id}`, data),
    delete: (id) => apiClient.delete(`/clients/${id}`),
    getCommunications: (id) => apiClient.get(`/clients/${id}/communications`),
    getFiles: (id) => apiClient.get(`/clients/${id}/files`)
  },

  // Projects API
  projects: {
    getAll: (params) => apiClient.get('/projects', { params }),
    getOne: (id) => apiClient.get(`/projects/${id}`),
    create: (data) => apiClient.post('/projects', data),
    update: (id, data) => apiClient.put(`/projects/${id}`, data),
    delete: (id) => apiClient.delete(`/projects/${id}`),
    getBudgetSummary: (id) => apiClient.get(`/projects/${id}/budget-summary`),
    
    // Expenses
    getExpenses: (id) => apiClient.get(`/projects/${id}/expenses`),
    createExpense: (id, data) => apiClient.post(`/projects/${id}/expenses`, data),
    updateExpense: (id, data) => apiClient.put(`/expenses/${id}`, data),
    deleteExpense: (id) => apiClient.delete(`/expenses/${id}`),
    
    // Payments
    getPayments: (id) => apiClient.get(`/projects/${id}/payments`),
    createPayment: (id, data) => apiClient.post(`/projects/${id}/payments`, data),
    updatePayment: (id, data) => apiClient.put(`/payments/${id}`, data),
    deletePayment: (id) => apiClient.delete(`/payments/${id}`),
    
    // Communications
    getCommunications: (id) => apiClient.get(`/projects/${id}/communications`),
    createCommunication: (id, data) => apiClient.post(`/projects/${id}/communications`, data),
    deleteCommunication: (id) => apiClient.delete(`/communications/${id}`),
    
    // Files
    getFiles: (id) => apiClient.get(`/projects/${id}/files`),

    // Tasks & Milestones
    getTasks: (id) => apiClient.get(`/projects/${id}/tasks`),
    createTask: (id, data) => apiClient.post(`/projects/${id}/tasks`, data),
    reorderTasks: (id, tasks) => apiClient.post('/projects/' + id + '/tasks/reorder', { tasks }),
    regeneratePortalToken: (id) => apiClient.post(`/projects/${id}/regenerate-portal-token`)
  },

  // Standalone Tasks API
  tasks: {
    board: (projectId) => apiClient.get('/tasks/board', { params: projectId ? { project_id: projectId } : {} }),
    update: (id, data) => apiClient.put(`/tasks/${id}`, data),
    toggle: (id) => apiClient.patch(`/tasks/${id}/toggle`),
    delete: (id) => apiClient.delete(`/tasks/${id}`)
  },

  // Public Client Portal API
  portal: {
    getData: (token) => axios.get(`${getApiBase()}/portal/${encodeURIComponent(token)}`)
  },

  // Services API
  services: {
    getAll: () => apiClient.get('/services'),
    create: (data) => apiClient.post('/services', data),
    update: (id, data) => apiClient.put(`/services/${id}`, data),
    delete: (id) => apiClient.delete(`/services/${id}`)
  },

  // Submissions API
  submissions: {
    getAll: (params) => apiClient.get('/submissions', { params }),
    getOne: (id) => apiClient.get(`/submissions/${id}`),
    create: (data) => apiClient.post('/submissions', data),
    update: (id, data) => apiClient.put(`/submissions/${id}`, data),
    delete: (id) => apiClient.delete(`/submissions/${id}`),
    convertToClient: (id, data) => apiClient.post(`/submissions/${id}/convert`, data),
    getDuplicates: (id) => apiClient.get(`/submissions/${id}/duplicates`)
  },

  // Files API
  files: {
    upload: (formData) => apiClient.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id) => apiClient.delete(`/files/${id}`)
  },

  // Reports API
  reports: {
    getDashboard: () => apiClient.get('/reports/dashboard'),
    getFinancial: (params) => apiClient.get('/reports/financial', { params }),
    getBudgetOverview: (params) => apiClient.get('/reports/budget-overview', { params }),
    backupDatabase: () => apiClient.get('/reports/backup-db', { responseType: 'blob' }),
    exportClients: (params) => apiClient.get('/reports/export/clients', { params }),
    exportProjects: (params) => apiClient.get('/reports/export/projects', { params }),
    exportProjectDetail: (id, params) => apiClient.get(`/reports/export/project/${id}`, { params })
  }
};

