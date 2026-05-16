import axios from 'axios'

const api = axios.create({
  // The base URL is configured *exclusively* via the VITE_API_URL environment variable.
  // For local development, create a .env file in the `frontend` directory and set:
  // VITE_API_URL=/api
  // This uses the Vite proxy. For production, the build pipeline (e.g., Vercel) will set this to the live backend URL.
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  withCredentials: true,
})

// Add interceptor to attach token to every request securely
api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('apsfl_userId')
  if (userId) config.headers.Authorization = userId
  return config
})

// Add response interceptor to cache GET requests for offline support
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get') {
      try {
        const queryStr = new URLSearchParams(response.config.params || {}).toString();
        const cacheKey = `cache_${response.config.url}?${queryStr}`;
        localStorage.setItem(cacheKey, JSON.stringify(response.data));
      } catch (e) {
        // Ignore local storage quota errors safely
      }
    }
    return response;
  },
  (error) => {
    // Return cached data if offline or network fails
    if ((!navigator.onLine || error.code === 'ERR_NETWORK') && error.config && error.config.method === 'get') {
      try {
        const queryStr = new URLSearchParams(error.config.params || {}).toString();
        const cacheKey = `cache_${error.config.url}?${queryStr}`;
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          // Simulate a successful Axios response using the cached data
          return Promise.resolve({ data: JSON.parse(cachedData), status: 200, statusText: 'OK', config: error.config, headers: {} });
        }
      } catch (e) {}
    }
    return Promise.reject(error)
  }
)

// ── Customers ──────────────────────────────────────────────────────────────────
export const getCustomers = (params) => api.get('/customers', { params })
export const getCustomerById = (id) => api.get(`/customers/${id}`)
export const createCustomer = (data) => api.post('/customers', data)
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data)
export const deleteCustomer = (id) => api.delete(`/customers/${id}`)
export const importCustomers = (formData) =>
  api.post('/customers/import', formData)  // let axios set multipart headers
export const bulkDeleteCustomers = (data) => api.post('/customers/bulk-delete', data);
export const resetSerials = () => api.post('/customers/reset-serials');
export const getPonStats = () => api.get('/customers/pon-stats');

// ── Payments ───────────────────────────────────────────────────────────────────
export const markPayment = (customerId, data) => api.post(`/payments/mark/${customerId}`, data)
export const markUnpaid  = (customerId) => api.post(`/payments/unpaid/${customerId}`)
export const getPaymentHistory = (customerId) => api.get(`/payments/history/${customerId}`)
export const deletePayment = (paymentId, params) => api.delete(`/payments/${paymentId}`, { params })
export const getAllPayments = (params) => api.get('/payments/all', { params })

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const getDashboardStats  = () => api.get('/dashboard/stats')
export const getExpiringCustomers = (days) => api.get('/dashboard/expiring', { params: { days } })
export const resetDashboard   = () => api.post('/dashboard/reset')

// ── getMonthlyChart ───────────────────────────────────────────────────────────────────────
export const getMonthlyChart = (year) => api.get('/dashboard/monthly-chart', { params: { year } })

// ── Settings ───────────────────────────────────────────────────────────────────
export const getSettings = () => api.get('/settings')
export const updateSettings = (data) => api.put('/settings', data)

// ── auth ───────────────────────────────────────────────────────────────
export const signup = (data) => api.post('/auth/signup', data)
export const login = (credentials) => api.post('/auth/login', credentials)
export const logout = () => api.post('/auth/logout')
export const getCurrentUser = () => api.get('/auth/me')
export const updateCurrentUser = (data) => api.put('/auth/me', data)


export default api
