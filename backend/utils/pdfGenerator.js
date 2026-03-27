const PDFDocument = require('pdfkit')

/**
 * Generates a professional GST invoice PDF into a writable stream.
 * @param {Object} sale     - Populated sale document
 * @param {Object} company  - Company config from env/settings
 * @param {Stream} stream   - Writable stream (res or fs)
 */
function generateInvoicePDF(sale, company, stream) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' })
  doc.pipe(stream)

  const ACCENT  = '#d97706'
  const DARK    = '#0f172a'
  const GRAY    = '#64748b'
  const LIGHT   = '#f8fafc'
  const RED     = '#ef4444'
  const GREEN   = '#10b981'

  const W = doc.page.width - 100   // usable width
  const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`

  /* ── Header background strip ── */
  doc.rect(0, 0, doc.page.width, 120).fill(DARK)

  /* ── Company name ── */
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(22)
     .text('⚡ BillFlow', 50, 30)

  doc.fillColor('#94a3b8').font('Helvetica').fontSize(9)
     .text(company.address, 50, 58, { width: 280 })
     .text(`GSTIN: ${company.gstin}  |  ${company.phone}  |  ${company.email}`, 50, 80)

  /* ── INVOICE label + number ── */
  doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(28)
     .text('INVOICE', 50, 25, { align: 'right', width: W })

  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(13)
     .text(sale.invoiceNo, 50, 60, { align: 'right', width: W })

  doc.fillColor('#94a3b8').font('Helvetica').fontSize(9)
     .text(`Date: ${new Date(sale.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 50, 78, { align: 'right', width: W })

  /* Status badge */
  const statusColor = sale.status === 'paid' ? GREEN : RED
  doc.rect(doc.page.width - 120, 94, 70, 18).fill(statusColor)
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8)
     .text(sale.status.toUpperCase(), doc.page.width - 118, 99, { width: 66, align: 'center' })

  /* ── Bill To / From section ── */
  doc.y = 140

  doc.fillColor(GRAY).font('Helvetica-Bold').fontSize(8)
     .text('BILL TO', 50, 145, { characterSpacing: 1.5 })
  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(13)
     .text(sale.customer?.name || '', 50, 158)
  doc.fillColor(GRAY).font('Helvetica').fontSize(9)
     .text(sale.customer?.phone || '', 50, 175)
  if (sale.customer?.gst) {
    doc.text(`GSTIN: ${sale.customer.gst}`, 50, 187)
  }

  doc.fillColor(GRAY).font('Helvetica-Bold').fontSize(8)
     .text('PAYMENT MODE', 350, 145, { characterSpacing: 1.5 })
  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(12)
     .text(sale.paymentMode || 'Cash', 350, 158)
  doc.fillColor(GRAY).font('Helvetica').fontSize(9)
     .text(`State: ${company.state} (${company.stateCode})`, 350, 175)

  /* ── Table ── */
  const tableTop = 225
  const cols = { num: 50, desc: 80, qty: 340, unitPrice: 380, gst: 430, amount: 480 }

  /* Table header */
  doc.rect(50, tableTop, W, 22).fill(DARK)
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8)
     .text('#',                      cols.num,      tableTop + 7, { width: 25, align: 'center' })
     .text('DESCRIPTION',            cols.desc,     tableTop + 7)
     .text('QTY',                    cols.qty,      tableTop + 7, { width: 30, align: 'right' })
     .text('UNIT PRICE',             cols.unitPrice,tableTop + 7, { width: 45, align: 'right' })
     .text('GST%',                   cols.gst,      tableTop + 7, { width: 35, align: 'right' })
     .text('AMOUNT',                 cols.amount,   tableTop + 7, { width: 50, align: 'right' })

  /* Table rows */
  let y = tableTop + 22
  sale.products.forEach((item, i) => {
    const lineTotal = +item.qty * +item.price
    const base      = lineTotal / (1 + +item.gst / 100)
    const rowBg     = i % 2 === 0 ? '#fff' : LIGHT

    doc.rect(50, y, W, 22).fill(rowBg)
    doc.fillColor(DARK).font('Helvetica').fontSize(9)
       .text(String(i + 1),                   cols.num,      y + 7, { width: 25, align: 'center' })
       .text(item.name,                        cols.desc,     y + 7, { width: 250 })
       .text(String(item.qty),                 cols.qty,      y + 7, { width: 30, align: 'right' })
       .text(fmt(+item.price / (1 + +item.gst / 100)), cols.unitPrice, y + 7, { width: 45, align: 'right' })
       .text(`${item.gst}%`,                  cols.gst,      y + 7, { width: 35, align: 'right' })

    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(9)
       .text(fmt(base), cols.amount, y + 7, { width: 50, align: 'right' })

    y += 22
  })

  /* Border under last row */
  doc.rect(50, y, W, 1).fill('#e2e8f0')
  y += 14

  /* ── Totals box ── */
  const totalsX = 350
  const totalsW = W - (totalsX - 50)

  const addTotal = (label, value, bold = false, color = DARK) => {
    doc.rect(totalsX, y, totalsW, 18).fill(bold ? DARK : LIGHT)
    doc.fillColor(bold ? '#fff' : GRAY)
       .font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9)
       .text(label, totalsX + 6, y + 5, { width: totalsW - 60 })
    doc.fillColor(bold ? '#fff' : DARK)
       .font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 10 : 9)
       .text(value, totalsX, y + 5, { width: totalsW - 8, align: 'right' })
    y += 18
  }

  addTotal('Subtotal (excl. GST)', fmt(sale.subtotal))
  addTotal('CGST (9%)',            fmt(sale.cgst || sale.gstAmt / 2))
  addTotal('SGST (9%)',            fmt(sale.sgst || sale.gstAmt / 2))
  if (sale.discount > 0) addTotal('Discount', `−${fmt(sale.discount)}`)
  y += 2
  addTotal('GRAND TOTAL', fmt(sale.total), true)

  /* ── Footer ── */
  const footerY = doc.page.height - 70
  doc.rect(0, footerY, doc.page.width, 70).fill(LIGHT)
  doc.rect(0, footerY, doc.page.width, 1).fill('#e2e8f0')

  doc.fillColor(GRAY).font('Helvetica').fontSize(8)
     .text('Thank you for your business!', 50, footerY + 15, { align: 'center', width: W })
     .text(company.name, 50, footerY + 28, { align: 'center', width: W })
     .text(`Generated by BillFlow on ${new Date().toLocaleString('en-IN')}`, 50, footerY + 40, { align: 'center', width: W })

  doc.end()
}

module.exports = { generateInvoicePDF }
