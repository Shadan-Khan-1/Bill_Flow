import api from './api'

/* ─── Sales ─── */
export const salesService = {
  getAll: (params = {}) => api.get('/sales', { params }),
  getOne: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  delete: (id) => api.delete(`/sales/${id}`),
  getInvoicePdf: (id) => api.get(`/sales/${id}/pdf`, { responseType: 'blob' }),
}

/* ─── Purchases ─── */
export const purchasesService = {
  getAll: (params = {}) => api.get('/purchases', { params }),
  getOne: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  delete: (id) => api.delete(`/purchases/${id}`),
  markPaid: (id) => api.patch(`/purchases/${id}/mark-paid`),
}

/* ─── Reports ─── */
export const reportsService = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  getProfitLoss: (params) => api.get('/reports/profit-loss', { params }),
  getGSTReport: (params) => api.get('/reports/gst', { params }),
  exportExcel: (type, params) =>
    api.get(`/reports/export/${type}`, { params, responseType: 'blob' }),
  exportPDF: (type, params) =>
    api.get(`/reports/export/${type}/pdf`, { params, responseType: 'blob' }),
}
