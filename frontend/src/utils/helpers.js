/* ─── Currency ─── */
export const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(n || 0)

export const formatINRShort = (n) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}

export const formatNum = (n) =>
  new Intl.NumberFormat('en-IN').format(n || 0)

/* ─── Date ─── */
export const today = () => new Date().toISOString().split('T')[0]

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

export const formatDateTime = (d) =>
  new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

/* ─── GST Calculations ─── */
/**
 * Calculate GST from inclusive price
 * @param {number} inclusivePrice  - Price including GST
 * @param {number} gstRate         - GST % (e.g. 18)
 * @returns {{ basePrice, gstAmt, cgst, sgst, igst }}
 */
export function calcGSTFromInclusive(inclusivePrice, gstRate) {
  const basePrice = inclusivePrice / (1 + gstRate / 100)
  const gstAmt = inclusivePrice - basePrice
  return {
    basePrice: round2(basePrice),
    gstAmt: round2(gstAmt),
    cgst: round2(gstAmt / 2),
    sgst: round2(gstAmt / 2),
    igst: 0
  }
}

/**
 * Calculate GST from exclusive price
 */
export function calcGSTFromExclusive(basePrice, gstRate) {
  const gstAmt = basePrice * (gstRate / 100)
  return {
    basePrice: round2(basePrice),
    gstAmt: round2(gstAmt),
    cgst: round2(gstAmt / 2),
    sgst: round2(gstAmt / 2),
    igst: 0,
    total: round2(basePrice + gstAmt)
  }
}

export function calcInvoiceTotals(items) {
  let subtotal = 0
  let totalGST = 0

  items.forEach(item => {
    const qty = Number(item.qty) || 0
    const price = Number(item.price) || 0
    const gstRate = Number(item.gst) || 0
    const lineTotal = qty * price
    const { basePrice, gstAmt } = calcGSTFromInclusive(lineTotal, gstRate)
    subtotal += basePrice
    totalGST += gstAmt
  })

  return {
    subtotal: round2(subtotal),
    gstAmt: round2(totalGST),
    cgst: round2(totalGST / 2),
    sgst: round2(totalGST / 2),
    total: round2(subtotal + totalGST)
  }
}

/* ─── Misc ─── */
export const round2 = (n) => Math.round(n * 100) / 100

export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const slugify = (str) =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

export const capitalize = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1)

export const truncate = (str, n = 30) =>
  str.length > n ? str.slice(0, n) + '…' : str

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const getProfitMargin = (selling, cost) =>
  cost > 0 ? round2(((selling - cost) / cost) * 100) : 0

export const getStockStatus = (stock, minStock) => {
  if (stock === 0) return { label: 'Out of Stock', color: 'red' }
  if (stock <= minStock) return { label: 'Low Stock', color: 'amber' }
  return { label: 'In Stock', color: 'green' }
}
