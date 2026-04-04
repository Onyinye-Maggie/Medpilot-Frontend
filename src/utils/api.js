import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://medpilot-backend.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medpilot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('medpilot_token');
      localStorage.removeItem('medpilot_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  changePassword: (data) => api.put('/api/auth/change-password', data),
};

// ─── Patients ────────────────────────────────────────────────────────────────
export const patientsAPI = {
  getAll: (params) => api.get('/api/patients', { params }),
  getById: (id) => api.get(`/api/patients/${id}`),
  create: (data) => api.post('/api/patients', data),
  update: (id, data) => api.put(`/api/patients/${id}`, data),
  delete: (id) => api.delete(`/api/patients/${id}`),
  search: (query) => api.get('/api/patients/search', { params: { q: query } }),
};

// ─── Appointments ────────────────────────────────────────────────────────────
export const appointmentsAPI = {
  getAll: (params) => api.get('/api/appointments', { params }),
  getById: (id) => api.get(`/api/appointments/${id}`),
  create: (data) => api.post('/api/appointments', data),
  update: (id, data) => api.put(`/api/appointments/${id}`, data),
  delete: (id) => api.delete(`/api/appointments/${id}`),
  getToday: () => api.get('/api/appointments/today'),
  getUpcoming: () => api.get('/api/appointments/upcoming'),
};

// ─── Medical Records ─────────────────────────────────────────────────────────
export const recordsAPI = {
  getByPatient: (patientId) => api.get(`/api/records/patient/${patientId}`),
  getById: (id) => api.get(`/api/records/${id}`),
  create: (data) => api.post('/api/records', data),
  update: (id, data) => api.put(`/api/records/${id}`, data),
  delete: (id) => api.delete(`/api/records/${id}`),
};

// ─── Prescriptions ───────────────────────────────────────────────────────────
export const prescriptionsAPI = {
  getByPatient: (patientId) => api.get(`/api/prescriptions/patient/${patientId}`),
  getById: (id) => api.get(`/api/prescriptions/${id}`),
  create: (data) => api.post('/api/prescriptions', data),
  update: (id, data) => api.put(`/api/prescriptions/${id}`, data),
  delete: (id) => api.delete(`/api/prescriptions/${id}`),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard/stats'),
  getRecentActivity: () => api.get('/api/dashboard/activity'),
};

export default api;
