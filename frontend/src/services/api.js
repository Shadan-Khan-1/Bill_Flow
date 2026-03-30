import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  // timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
})

/* ─── Request Interceptor: attach JWT ─── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bf_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

/* ─── Response Interceptor: global error handling ─── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error — queue for offline sync
      toast.error('You are offline. ')// Changes will sync when connected.
      return Promise.reject(error)
    }

    const { status, data } = error.response

    switch (status) {
      case 401:
        localStorage.removeItem('bf_token')
        localStorage.removeItem('bf_user')
        window.location.href = '/login'
        break
      case 403:
        toast.error('Access denied. Insufficient permissions.')
        break
      case 422:
        // Validation errors from Joi
        const msg = data.errors?.[0]?.message || data.message || 'Validation failed'
        toast.error(msg)
        break
      case 429:
        toast.error('Too many requests. Please slow down.')
        break
      case 500:
        toast.error('Server error. Please try again.')
        break
      default:
        toast.error(data.message || 'Something went wrong')
    }

    return Promise.reject(error)
  }
)

export default api
