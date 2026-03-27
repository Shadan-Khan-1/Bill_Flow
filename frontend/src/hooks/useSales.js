import { useState, useEffect, useCallback } from 'react'
import { salesService } from '../services/transactions.service'
import { getAllFromDB, saveToDB, deleteFromDB, queueOfflineAction } from '../utils/indexedDB'
import toast from 'react-hot-toast'

const STORE = 'sales'

export function useSales(params = {}) {
  const [sales,      setSales]   = useState([])
  const [loading,    setLoading] = useState(true)
  const [error,      setError]   = useState(null)
  const [pagination, setPag]     = useState({ page: 1, totalPages: 1, total: 0 })

  const fetchSales = useCallback(async (overrideParams = {}) => {
    setLoading(true)
    try {
      const { data } = await salesService.getAll({ ...params, ...overrideParams })
      setSales(data.sales)
      setPag({ page: data.page, totalPages: data.totalPages, total: data.total })
      // Cache in IDB
      data.sales.forEach(s => saveToDB(STORE, s))
    } catch (err) {
      if (!navigator.onLine) {
        const cached = await getAllFromDB(STORE)
        setSales(cached)
        toast('Showing cached sales data', { icon: '📴' })
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSales() }, [fetchSales])

  /* Create sale — queues offline if no network */
  const createSale = useCallback(async (payload) => {
    if (!navigator.onLine) {
      await queueOfflineAction({ type: 'CREATE_SALE', request: { method: 'POST', url: '/sales', data: payload } })
      const temp = { ...payload, _id: `offline_${Date.now()}`, invoiceNo: 'PENDING', status: 'pending', _offline: true }
      setSales(s => [temp, ...s])
      toast('Sale saved offline. Will sync when connected.', { icon: '📴' })
      return temp
    }
    const { data } = await salesService.create(payload)
    setSales(s => [data.sale, ...s])
    toast.success(`Invoice ${data.sale.invoiceNo} created!`)
    return data.sale
  }, [])

  /* Update */
  const updateSale = useCallback(async (id, updates) => {
    const { data } = await salesService.update(id, updates)
    setSales(s => s.map(x => x._id === id ? data.sale : x))
    toast.success('Sale updated')
    return data.sale
  }, [])

  /* Delete */
  const deleteSale = useCallback(async (id) => {
    await salesService.delete(id)
    setSales(s => s.filter(x => x._id !== id))
    await deleteFromDB(STORE, id)
    toast.success('Sale deleted and stock restored')
  }, [])

  /* Computed */
  const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0)
  const pendingSales = sales.filter(s => s.status === 'pending')

  return {
    sales, loading, error, pagination,
    totalRevenue, pendingSales,
    createSale, updateSale, deleteSale,
    refetch: fetchSales,
  }
}
