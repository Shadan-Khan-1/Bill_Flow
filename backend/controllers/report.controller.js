const { Sale, Purchase } = require('../models/Transaction.model')
const Product = require('../models/Product.model')
const { AppError } = require('../middleware/errorHandler')
const ExcelJS = require('exceljs')
const PDFDocument = require('pdfkit')

/* ── Date range builder ── */
const getDateRange = (period, from, to) => {
  const now = new Date()
  const start = new Date()

  if (from && to) {
    return { $gte: new Date(from), $lte: new Date(new Date(to).setHours(23, 59, 59)) }
  }

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      return { $gte: start, $lte: now }
    case 'week':
      start.setDate(now.getDate() - 7)
      return { $gte: start }
    case 'month':
      start.setDate(1); start.setHours(0, 0, 0, 0)
      return { $gte: start }
    case 'quarter':
      start.setMonth(Math.floor(now.getMonth() / 3) * 3, 1)
      start.setHours(0, 0, 0, 0)
      return { $gte: start }
    case 'year':
      start.setMonth(0, 1); start.setHours(0, 0, 0, 0)
      return { $gte: start }
    default:
      start.setDate(1); start.setHours(0, 0, 0, 0)
      return { $gte: start }
  }
}

/* ── GET /api/reports/summary ── */
exports.getSummary = async (req, res) => {
  const { period = 'month', from, to } = req.query
  const tenantId = req.tenantId
  const dateRange = getDateRange(period, from, to)

  const [salesAgg, purchaseAgg, productStats] = await Promise.all([
    Sale.aggregate([
      { $match: { tenantId, date: dateRange, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' }, totalGST: { $sum: '$gstAmt' }, count: { $sum: 1 } } }
    ]),
    Purchase.aggregate([
      { $match: { tenantId, date: dateRange } },
      { $group: { _id: null, totalPurchases: { $sum: '$total' }, count: { $sum: 1 } } }
    ]),
    Product.aggregate([
      { $match: { tenantId, isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          lowStock: { $sum: { $cond: [{ $lte: ['$stock', '$minStock'] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
        }
      }
    ])
  ])

  const revenue = salesAgg[0]?.totalRevenue || 0
  const purchases = purchaseAgg[0]?.totalPurchases || 0
  const gst = salesAgg[0]?.totalGST || 0

  res.json({
    status: 'success',
    data: {
      totalRevenue: revenue,
      totalPurchases: purchases,
      grossProfit: revenue - purchases,
      totalGST: gst,
      cgst: gst / 2,
      sgst: gst / 2,
      totalSales: salesAgg[0]?.count || 0,
      totalOrders: purchaseAgg[0]?.count || 0,
      totalProducts: productStats[0]?.total || 0,
      lowStock: productStats[0]?.lowStock || 0,
      outOfStock: productStats[0]?.outOfStock || 0,
    }
  })
}

/* ── GET /api/reports/profit-loss ── */
exports.getProfitLoss = async (req, res) => {
  const tenantId = req.tenantId

  const months = await Sale.aggregate([
    { $match: { tenantId, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        sales: { $sum: '$total' },
        gstAmt: { $sum: '$gstAmt' },
        subtotal: { $sum: '$subtotal' },
        count: { $sum: 1 },
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 }
  ])

  const purchasesByMonth = await Purchase.aggregate([
    { $match: { tenantId } },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
        purchases: { $sum: '$subtotal' },
      }
    }
  ])

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const trend = months.map(m => {
    const pMonth = purchasesByMonth.find(
      p => p._id.year === m._id.year && p._id.month === m._id.month
    )
    const purchases = pMonth?.purchases || 0
    return {
      month: monthNames[m._id.month - 1],
      year: m._id.year,
      sales: m.sales,
      purchases,
      profit: m.subtotal - purchases,
      gstAmt: m.gstAmt,
      count: m.count,
    }
  })

  res.json({ status: 'success', data: { trend } })
}

/* ── GET /api/reports/gst ── */
exports.getGSTReport = async (req, res) => {
  const { period = 'month', from, to } = req.query
  const tenantId = req.tenantId
  const dateRange = getDateRange(period, from, to)

  const salesGST = await Sale.aggregate([
    { $match: { tenantId, date: dateRange, status: { $ne: 'cancelled' } } },
    { $unwind: '$products' },
    {
      $group: {
        _id: '$products.gst',
        taxable: { $sum: '$products.basePrice' },
        gstAmt: { $sum: '$products.gstAmt' },
        count: { $sum: 1 },
      }
    },
    { $sort: { _id: 1 } }
  ])

  const total = salesGST.reduce((acc, g) => ({
    taxable: acc.taxable + g.taxable,
    gstAmt: acc.gstAmt + g.gstAmt,
  }), { taxable: 0, gstAmt: 0 })

  res.json({
    status: 'success',
    data: {
      byRate: salesGST.map(g => ({
        rate: g._id,
        taxable: Math.round(g.taxable * 100) / 100,
        cgst: Math.round(g.gstAmt / 2 * 100) / 100,
        sgst: Math.round(g.gstAmt / 2 * 100) / 100,
        total: Math.round(g.gstAmt * 100) / 100,
      })),
      totals: {
        taxable: Math.round(total.taxable * 100) / 100,
        cgst: Math.round(total.gstAmt / 2 * 100) / 100,
        sgst: Math.round(total.gstAmt / 2 * 100) / 100,
        total: Math.round(total.gstAmt * 100) / 100,
      }
    }
  })
}

/* ── GET /api/reports/export/sales ── */
exports.exportSalesExcel = async (req, res) => {
  const { from, to, period = 'month' } = req.query
  const tenantId = req.tenantId
  const dateRange = getDateRange(period, from, to)

  const sales = await Sale.find({ tenantId, date: dateRange }).lean()

  const wb = new ExcelJS.Workbook()
  wb.creator = 'BillFlow'

  const ws = wb.addWorksheet('Sales Report')
  ws.columns = [
    { header: 'Invoice No', key: 'invoiceNo', width: 14 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Customer', key: 'customer', width: 22 },
    { header: 'Subtotal', key: 'subtotal', width: 14 },
    { header: 'GST', key: 'gstAmt', width: 12 },
    { header: 'Total', key: 'total', width: 14 },
    { header: 'Payment Mode', key: 'paymentMode', width: 14 },
    { header: 'Status', key: 'status', width: 10 },
  ]

  ws.getRow(1).font = { bold: true, size: 12 }
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } }
  ws.getRow(1).border = { bottom: { style: 'thin' } }

  sales.forEach(s => {
    ws.addRow({
      invoiceNo: s.invoiceNo,
      date: new Date(s.date).toLocaleDateString('en-IN'),
      customer: s.customer?.name,
      subtotal: s.subtotal,
      gstAmt: s.gstAmt,
      total: s.total,
      paymentMode: s.paymentMode,
      status: s.status,
    })
  })

  /* Totals row */
  const lastRow = ws.lastRow.number + 2
  ws.getCell(`A${lastRow}`).value = 'TOTAL'
  ws.getCell(`A${lastRow}`).font = { bold: true }
  ws.getCell(`D${lastRow}`).value = { formula: `SUM(D2:D${lastRow - 2})` }
  ws.getCell(`E${lastRow}`).value = { formula: `SUM(E2:E${lastRow - 2})` }
  ws.getCell(`F${lastRow}`).value = { formula: `SUM(F2:F${lastRow - 2})` }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx')

  await wb.xlsx.write(res)
  res.end()
}

/* ── GET /api/reports/export/purchases ── */
exports.exportPurchasesExcel = async (req, res) => {
  const { from, to, period = 'month' } = req.query
  const tenantId = req.tenantId
  const dateRange = getDateRange(period, from, to)

  const purchases = await Purchase.find({ tenantId, date: dateRange }).lean()

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Purchases Report')
  ws.columns = [
    { header: 'Invoice No', key: 'invoiceNo', width: 14 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Supplier', key: 'supplier', width: 22 },
    { header: 'Subtotal', key: 'subtotal', width: 14 },
    { header: 'GST', key: 'gstAmt', width: 12 },
    { header: 'Total', key: 'total', width: 14 },
    { header: 'Payment Status', key: 'paymentStatus', width: 14 },
    { header: 'Status', key: 'status', width: 10 },
  ]

  ws.getRow(1).font = { bold: true }
  purchases.forEach(p => ws.addRow({
    invoiceNo: p.invoiceNo,
    date: new Date(p.date).toLocaleDateString('en-IN'),
    supplier: p.supplier,
    subtotal: p.subtotal,
    gstAmt: p.gstAmt,
    total: p.total,
    paymentStatus: p.paymentStatus,
    status: p.status,
  }))

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=purchases-report.xlsx')
  await wb.xlsx.write(res)
  res.end()
}
