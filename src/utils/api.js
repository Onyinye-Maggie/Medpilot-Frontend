import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://medpilot-backend.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medpilot_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

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

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register:        (data) => api.post('/api/auth/register', data),
  login:           (data) => api.post('/api/auth/login', data),
  verifyOTP:       (data) => api.post('/api/auth/verify-otp', data),
  resendOTP:       (data) => api.post('/api/auth/resend-otp', data),
  forgotPassword:  (data) => api.post('/api/auth/forgot-password', data),
  getProfile:      ()     => api.get('/api/auth/profile'),
  updateProfile:   (data) => api.put('/api/auth/profile', data),
  changePassword:  (data) => api.put('/api/auth/change-password', data),
};

// ─── Medications ──────────────────────────────────────────────────────────
export const medicationsAPI = {
  getAll:       (params) => api.get('/api/medications', { params }),
  getById:      (id)     => api.get(`/api/medications/${id}`),
  create:       (data)   => api.post('/api/medications', data),
  update:       (id, d)  => api.put(`/api/medications/${id}`, d),
  delete:       (id)     => api.delete(`/api/medications/${id}`),
  refillStatus: ()       => api.get('/api/medications/refill-status'),
};

// ─── Doses ────────────────────────────────────────────────────────────────
export const dosesAPI = {
  getAll:   (params) => api.get('/api/doses', { params }),
  getById:  (id)     => api.get(`/api/doses/${id}`),
  log:      (data)   => api.post('/api/doses', data),
  update:   (id, d)  => api.put(`/api/doses/${id}`, d),
  delete:   (id)     => api.delete(`/api/doses/${id}`),
};

// ─── Refills ──────────────────────────────────────────────────────────────
export const refillsAPI = {
  getAll:        (params) => api.get('/api/refills', { params }),
  getById:       (id)     => api.get(`/api/refills/${id}`),
  create:        (data)   => api.post('/api/refills', data),
  update:        (id, d)  => api.put(`/api/refills/${id}`, d),
  cancel:        (id)     => api.delete(`/api/refills/${id}`),
  updateStatus:  (id, d)  => api.put(`/api/refills/status/${id}`, d), // admin only
};

// ─── Dashboard ────────────────────────────────────────────────────────────
export const dashboardAPI = {
  get:              () => api.get('/api/dashboard'),
  adherenceHistory: () => api.get('/api/dashboard/adherence-history'),
};

export default api;
