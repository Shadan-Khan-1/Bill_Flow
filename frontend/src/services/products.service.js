import api from './api'

const BASE = '/products'

export const productsService = {
  getAll: (params = {}) => api.get(BASE, { params }),
  getOne: (id) => api.get(`${BASE}/${id}`),
  create: (data) => api.post(BASE, data),
  update: (id, data) => api.put(`${BASE}/${id}`, data),
  delete: (id) => api.delete(`${BASE}/${id}`),
  getLowStock: () => api.get(`${BASE}/low-stock`),
  updateStock: (id, qty) => api.patch(`${BASE}/${id}/stock`, { qty }),
}
