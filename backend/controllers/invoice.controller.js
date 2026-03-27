const { Sale }              = require('../models/Transaction.model')
const { AppError }          = require('../middleware/errorHandler')
const { generateInvoicePDF} = require('../utils/pdfGenerator')

const COMPANY = {
  name:      process.env.COMPANY_NAME      || 'BillFlow Technologies Pvt. Ltd.',
  address:   process.env.COMPANY_ADDRESS   || '404, Nexus Complex, Bandra Kurla Complex, Mumbai – 400051',
  phone:     process.env.COMPANY_PHONE     || '+91 98765 43210',
  email:     process.env.COMPANY_EMAIL     || 'billing@billflow.in',
  gstin:     process.env.COMPANY_GSTIN     || '27AABCT1234F1Z5',
  state:     process.env.COMPANY_STATE     || 'Maharashtra',
  stateCode: process.env.COMPANY_STATE_CODE|| '27',
}

/* ── GET /api/sales/:id/pdf ── */
exports.downloadInvoicePDF = async (req, res) => {
  const sale = await Sale.findOne({ _id: req.params.id, tenantId: req.tenantId }).lean()
  if (!sale) throw new AppError('Sale not found', 404)

  const filename = `Invoice_${sale.invoiceNo}.pdf`

  res.setHeader('Content-Type',        'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

  generateInvoicePDF(sale, COMPANY, res)
}
