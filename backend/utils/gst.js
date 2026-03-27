/**
 * Calculate all GST figures from an array of line items.
 * Prices stored as inclusive of GST.
 */
const calcLineItem = (item) => {
  const qty       = Number(item.qty)   || 0
  const price     = Number(item.price) || 0   // unit price incl. GST
  const gstRate   = Number(item.gst)   || 0

  const lineTotal  = qty * price
  const basePrice  = lineTotal / (1 + gstRate / 100)  // excl. GST
  const gstAmt     = lineTotal - basePrice

  return {
    ...item,
    lineTotal:  round(lineTotal),
    basePrice:  round(basePrice),
    gstAmt:     round(gstAmt),
  }
}

const calcTotals = (items) => {
  const computed = items.map(calcLineItem)

  const subtotal = computed.reduce((s, i) => s + i.basePrice,  0)
  const gstAmt   = computed.reduce((s, i) => s + i.gstAmt,    0)
  const total    = computed.reduce((s, i) => s + i.lineTotal,  0)

  return {
    items:    computed,
    subtotal: round(subtotal),
    gstAmt:   round(gstAmt),
    cgst:     round(gstAmt / 2),
    sgst:     round(gstAmt / 2),
    igst:     0,
    total:    round(total),
  }
}

const round = (n) => Math.round(n * 100) / 100

/**
 * Build an auto-incremented invoice number.
 * Pads to 4 digits: INV-0001
 */
const buildInvoiceNo = async (Model, prefix, tenantId) => {
  const last = await Model
    .findOne({ tenantId })
    .sort({ createdAt: -1 })
    .select('invoiceNo')
    .lean()

  let next = 1
  if (last?.invoiceNo) {
    const num = parseInt(last.invoiceNo.replace(/\D/g, ''), 10)
    if (!isNaN(num)) next = num + 1
  }

  return `${prefix}-${String(next).padStart(4, '0')}`
}

module.exports = { calcLineItem, calcTotals, buildInvoiceNo, round }
