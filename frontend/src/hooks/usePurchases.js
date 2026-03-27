import { useState, useEffect, useCallback } from 'react'
import { purchasesService } from '../services/transactions.service'
import { getAllFromDB, saveToDB, queueOfflineAction } from '../utils/indexedDB'
import toast from 'react-hot-toast'

const STORE = 'purchases'

export function usePurchases(params = {}) {
  const [purchases,  setPurchases] = useState([])
  const [loading,    setLoading]   = useState(true)
  const [error,      setError]     = useState(null)
  const [pagination, setPag]       = useState({ page: 1, totalPages: 1, total: 0 })

  const fetchPurchases = useCallback(async (overrideParams = {}) => {
    setLoading(true)
    try {
      const { data } = await purchasesService.getAll({ ...params, ...overrideParams })
      setPurchases(data.purchases)
      setPag({ page: data.page, totalPages: data.totalPages, total: data.total })
      data.purchases.forEach(p => saveToDB(STORE, p))
    } catch (err) {
      if (!navigator.onLine) {
        const cached = await getAllFromDB(STORE)
        setPurchases(cached)
        toast('Showing cached purchase data', { icon: '📴' })
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPurchases() }, [fetchPurchases])

  const createPurchase = useCallback(async (payload) => {
    if (!navigator.onLine) {
      await queueOfflineAction({ type: 'CREATE_PURCHASE', request: { method: 'POST', url: '/purchases', data: payload } })
      const temp = { ...payload, _id: `offline_${Date.now()}`, status: 'pending', _offline: true }
      setPurchases(p => [temp, ...p])
      toast('Purchase saved offline. Will sync when connected.', { icon: '📴' })
      return temp
    }
    const { data } = await purchasesService.create(payload)
    setPurchases(p => [data.purchase, ...p])
    toast.success('Purchase recorded & stock updated!')
    return data.purchase
  }, [])

  const updatePurchase = useCallback(async (id, updates) => {
    const { data } = await purchasesService.update(id, updates)
    setPurchases(p => p.map(x => x._id === id ? data.purchase : x))
    toast.success('Purchase updated')
    return data.purchase
  }, [])

  const markPaid = useCallback(async (id) => {
    const { data } = await purchasesService.markPaid(id)
    setPurchases(p => p.map(x => x._id === id ? data.purchase : x))
    toast.success('Marked as paid')
  }, [])

  const deletePurchase = useCallback(async (id) => {
    await purchasesService.delete(id)
    setPurchases(p => p.filter(x => x._id !== id))
    toast.success('Purchase deleted and stock reversed')
  }, [])

  const totalSpend       = purchases.reduce((s, p) => s + (p.total || 0), 0)
  const pendingPayments  = purchases.filter(p => p.paymentStatus === 'pending')

  return {
    purchases, loading, error, pagination,
    totalSpend, pendingPayments,
    createPurchase, updatePurchase, markPaid, deletePurchase,
    refetch: fetchPurchases,
  }
}
