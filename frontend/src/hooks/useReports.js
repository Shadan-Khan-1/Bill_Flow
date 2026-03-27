import { useState, useCallback } from 'react'
import { reportsService } from '../services/transactions.service'
import { downloadBlob } from '../utils/helpers'
import toast from 'react-hot-toast'

export function useReports() {
  const [summary,    setSummary]    = useState(null)
  const [plTrend,    setPlTrend]    = useState([])
  const [gstData,    setGstData]    = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [exporting,  setExporting]  = useState(false)

  const loadSummary = useCallback(async (params = {}) => {
    setLoading(true)
    try {
      const { data } = await reportsService.getSummary(params)
      setSummary(data.data)
    } catch (_) {
      /* silently fallback to mock in pages */
    } finally {
      setLoading(false)
    }
  }, [])

  const loadProfitLoss = useCallback(async (params = {}) => {
    setLoading(true)
    try {
      const { data } = await reportsService.getProfitLoss(params)
      setPlTrend(data.data.trend)
    } catch (_) {}
    finally { setLoading(false) }
  }, [])

  const loadGST = useCallback(async (params = {}) => {
    setLoading(true)
    try {
      const { data } = await reportsService.getGSTReport(params)
      setGstData(data.data)
    } catch (_) {}
    finally { setLoading(false) }
  }, [])

  const exportExcel = useCallback(async (type = 'sales', params = {}) => {
    setExporting(true)
    const toastId = toast.loading(`Generating ${type} Excel report…`)
    try {
      const { data } = await reportsService.exportExcel(type, params)
      downloadBlob(data, `${type}-report-${new Date().toISOString().slice(0,10)}.xlsx`)
      toast.success('Excel report downloaded!', { id: toastId })
    } catch (err) {
      toast.error('Export failed', { id: toastId })
    } finally {
      setExporting(false)
    }
  }, [])

  const exportPDF = useCallback(async (type = 'sales', params = {}) => {
    setExporting(true)
    const toastId = toast.loading(`Generating ${type} PDF report…`)
    try {
      const { data } = await reportsService.exportPDF(type, params)
      downloadBlob(data, `${type}-report-${new Date().toISOString().slice(0,10)}.pdf`)
      toast.success('PDF report downloaded!', { id: toastId })
    } catch (err) {
      toast.error('PDF export failed', { id: toastId })
    } finally {
      setExporting(false)
    }
  }, [])

  return {
    summary, plTrend, gstData,
    loading, exporting,
    loadSummary, loadProfitLoss, loadGST,
    exportExcel, exportPDF,
  }
}
