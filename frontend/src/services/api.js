import axios from 'axios'

const api = axios.create({
  // Use the deployed backend URL in production, fallback to local proxy in dev
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  withCredentials: true,
})

// ── Customers ──────────────────────────────────────────────────────────────────
export const getCustomers = (params) => api.get('/customers', { params })
export const getCustomerById = (id) => api.get(`/customers/${id}`)
export const createCustomer = (data) => api.post('/customers', data)
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data)
export const deleteCustomer = (id) => api.delete(`/customers/${id}`)
export const importCustomers = (formData) =>
  api.post('/customers/import', formData)  // let axios set multipart headers

// ── Payments ───────────────────────────────────────────────────────────────────
export const markPayment = (customerId, data) => api.post(`/payments/mark/${customerId}`, data)
export const markUnpaid  = (customerId) => api.post(`/payments/unpaid/${customerId}`)
export const getPaymentHistory = (customerId) => api.get(`/payments/history/${customerId}`)
export const getAllPayments = (params) => api.get('/payments/all', { params })

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const getDashboardStats  = () => api.get('/dashboard/stats')
export const getExpiringCustomers = (days) => api.get('/dashboard/expiring', { params: { days } })
export const resetDashboard   = () => api.post('/dashboard/reset')

// ── getMonthlyChart ───────────────────────────────────────────────────────────────────────
export const getMonthlyChart = (year) => api.get('/dashboard/monthly-chart', { params: { year } })

// ── getYearlyChart ───────────────────────────────────────────────────────────────────────
export const getYearlyChart = () => api.get('/dashboard/yearly')

// ── auth ───────────────────────────────────────────────────────────────
export const login = (credentials) => api.post('/auth/login', credentials)
export const logout = () => api.post('/auth/logout')
export const getCurrentUser = () => api.get('/auth/me')


export default api
