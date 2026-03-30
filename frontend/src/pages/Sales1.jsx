import { useState, useRef, useEffect } from 'react'
import { Plus, Eye, Printer, Download, X, Receipt, Loader } from 'lucide-react'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'
import { formatINR, today } from '../utils/helpers'
import { salesService } from '../services/transactions.service'
import { productsService } from '../services/products.service'
import toast from 'react-hot-toast'

const COMPANY = {
  name: 'BillFlow Technologies Pvt. Ltd.',
  address: '404, Nexus Complex, Bandra Kurla Complex, Mumbai – 400051',
  phone: '+91 98765 43210',
  email: 'billing@billflow.in',
  state: 'Maharashtra',
  stateCode: '27',
}

const EMPTY_FORM = { customerName: '', customerPhone: '', date: today(), paymentMode: 'Cash' }
const EMPTY_ITEM = { productId: '', name: '', qty: 1, price: '' }

const calcTotal = (items) =>
  items.reduce((sum, it) => sum + (+it.price || 0) * (+it.qty || 0), 0)

function InvoicePrint({ sale }) {
  const [hoveredRow, setHoveredRow] = useState(null)
  return (
    <div style={{ background: '#fff', color: '#1a1a1a', fontFamily: "'DM Sans', sans-serif", padding: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 24, borderBottom: '2px solid #f0f0f0', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0a0e1a', marginBottom: 6 }}>BillFlow</div>
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.7 }}>
            {COMPANY.address}<br />
            {COMPANY.phone} · {COMPANY.email}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#d97706', letterSpacing: '-1px', marginBottom: 4 }}>INVOICE</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{sale.invoiceNo}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Date: {sale.date}</div>
          <div style={{ marginTop: 8, display: 'inline-block', background: '#dcfce7', color: '#166534', padding: '3px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
            {(sale.status || 'paid').toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 8 }}>Bill To</div>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 3 }}>{sale.customer?.name}</div>
        <div style={{ fontSize: 13, color: '#555' }}>{sale.customer?.phone}</div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {['#', 'Product Name', 'Qty', 'Amount'].map(h => (
              <th key={h} style={{
                padding: '10px 14px', fontSize: 11, fontWeight: 600,
                textAlign: h === '#' ? 'center' : h === 'Amount' ? 'right' : 'left',
                textTransform: 'uppercase', letterSpacing: '0.07em',
                color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sale.products.map((p, i) => {
            const lineAmt = +p.price * +p.qty
            return (
              <tr
                key={i}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  borderBottom: i < sale.products.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: hoveredRow === i ? '#eff6ff' : '#fff',
                  transition: 'background 0.12s ease',
                  cursor: 'default',
                }}
              >
                <td style={{ padding: '11px 14px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>{i + 1}</td>
                <td style={{ padding: '11px 14px', fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{p.name}</td>
                <td style={{ padding: '11px 14px', fontSize: 13, textAlign: 'center', color: '#64748b' }}>{p.qty}</td>
                <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontWeight: 700, textAlign: 'right', fontSize: 13, color: '#0f172a' }}>
                  Rs.{lineAmt.toFixed(2)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
        <div style={{ minWidth: 240, background: '#f8f9fa', borderRadius: 10, padding: '14px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 18, color: '#0a0e1a' }}>
            <span>Grand Total</span>
            <span style={{ fontFamily: 'monospace', color: '#d97706' }}>Rs.{Number(sale.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: 14, fontSize: 12, color: '#aaa' }}>
        <span>Thank you for your business!</span>
        <span>Generated by BillFlow</span>
      </div>
    </div>
  )
}

export default function Sales() {
  const [sales,        setSales]   = useState([])
  const [products,     setProducts]= useState([])
  const [modal,        setModal]   = useState(false)
  const [invoiceModal, setInv]     = useState(null)
  const [form,         setForm]    = useState(EMPTY_FORM)
  const [items,        setItems]   = useState([{ ...EMPTY_ITEM }])
  const [saving,       setSaving]  = useState(false)
  const [loading,      setLoading] = useState(true)
  const [error,        setError]   = useState(null)
  const printRef = useRef()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [salesRes, productsRes] = await Promise.all([
          salesService.getAll(),
          productsService.getAll(),
        ])
        setSales(salesRes.data?.sales || [])
        setProducts(productsRes.data?.products || [])
      } catch (err) {
        console.error('Failed to load:', err)
        setError('Failed to load sales. Please try again.')
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const updateItem = (i, field, val) => {
    setItems(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: val }
      if (field === 'productId') {
        const prod = products.find(p => p._id === val)
        if (prod) { next[i].name = prod.name; next[i].price = prod.price }
      }
      return next
    })
  }

  const addItem    = () => setItems(i => [...i, { ...EMPTY_ITEM }])
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const grandTotal = calcTotal(items)

  const openNew = () => { setForm(EMPTY_FORM); setItems([{ ...EMPTY_ITEM }]); setModal(true) }

  const validateForm = () => {
    if (!form.customerName.trim()) { toast.error('Customer name is required'); return false }
    if (items.some(it => !it.productId || !it.qty)) { toast.error('Select a product and quantity for each row'); return false }
    return true
  }

  const save = async () => {
    if (!validateForm()) return
    setSaving(true)
    try {
      const payload = {
        customer:    { name: form.customerName, phone: form.customerPhone },
        date:        form.date,
        paymentMode: form.paymentMode,
        total:       grandTotal,
        subtotal:    grandTotal,
        gstAmt:      0,
        products: items.map(it => ({
          productId: it.productId,
          name:      it.name,
          qty:       +it.qty,
          price:     +it.price,
        })),
      }

      const res = await salesService.create(payload)
      const newSale = res.data?.sale || {
        _id:       Date.now().toString(),
        invoiceNo: `INV-${String(sales.length + 1).padStart(3, '0')}`,
        status:    'paid',
        ...payload,
      }

      setSales(ss => [newSale, ...ss])
      setModal(false)
      setInv(newSale)
      toast.success('Invoice created!')
    } catch (err) {
      console.error('Save error:', err)
      toast.error(err.response?.data?.message || 'Failed to create invoice')
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    const w = window.open('', '_blank')
    w.document.write(`<html><head><title>Invoice</title>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>body{margin:0;padding:0;}</style>
    </head><body>${printRef.current.innerHTML}</body></html>`)
    w.document.close()
    setTimeout(() => { w.focus(); w.print() }, 500)
  }

  const columns = [
    {
      key: 'customer', label: 'Customer Name',
      render: v => <span style={{ fontWeight: 600 }}>{v?.name || '—'}</span>,
    },
    {
      key: 'customer', label: 'Phone No',
      render: v => <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{v?.phone || '—'}</span>,
    },
    {
      key: 'products', label: 'Product Name',
      render: v => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {(v || []).map((p, i) => (
            <span key={i} style={{ fontSize: 13 }}>
              {p.name}
              <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontSize: 12 }}>x{p.qty}</span>
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'total', label: 'Amount',
      render: v => <span className="font-mono" style={{ fontWeight: 700 }}>{formatINR(v)}</span>,
    },
    {
      key: 'date', label: 'Date',
      render: v => (
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      key: '_id', label: 'Actions', sortable: false,
      render: (_, row) => (
        <button className="btn btn-icon" onClick={() => setInv(row)} title="View invoice">
          <Eye size={13} />
        </button>
      ),
    },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 10, color: 'var(--accent)' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading sales…</p>
        </div>
      </div>
    )
  }

  if (error && sales.length === 0) {
    return (
      <div className="animate-fadeIn">
        <div className="page-header"><h2 className="page-title">Sales</h2></div>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">

      <div className="page-header">
        <div>
          <h2 className="page-title">Sales</h2>
          <p className="page-subtitle">{sales.length} invoice{sales.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={15} /> New Invoice
        </button>
      </div>

      <div className="card card-flush">
        {sales.length > 0
          ? <DataTable columns={columns} data={sales} searchKeys={['invoiceNo']} />
          : (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              <Receipt size={36} style={{ marginBottom: 12, opacity: 0.3, display: 'block', margin: '0 auto 14px' }} />
              <p style={{ fontSize: 14 }}>No invoices yet. Create your first one.</p>
            </div>
          )
        }
      </div>

      {/* New Invoice Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Create Invoice"
        size="modal-md"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              <Receipt size={14} /> {saving ? 'Creating…' : 'Generate Invoice'}
            </button>
          </>
        }
      >
        {/* Customer */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Customer Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Customer Name *</label>
              <input className="input" placeholder="Full name" value={form.customerName} onChange={set('customerName')} disabled={saving} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="input" placeholder="+91 XXXXX XXXXX" value={form.customerPhone} onChange={set('customerPhone')} disabled={saving} />
            </div>
          </div>
        </div>

        {/* Date */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Invoice Date</div>
          <div className="form-group">
            <input className="input" type="date" value={form.date} onChange={set('date')} disabled={saving} />
          </div>
        </div>

        {/* Products */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Products</div>
            <button className="btn btn-ghost btn-sm" onClick={addItem} disabled={saving}><Plus size={12} /> Add Row</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 32px', gap: 8, padding: '0 2px', marginBottom: 6 }}>
            {['Product', 'Qty', ''].map((h, i) => (
              <div key={i} style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
            ))}
          </div>

          {items.map((it, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 32px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <select className="input" value={it.productId} onChange={e => updateItem(i, 'productId', e.target.value)} disabled={saving}>
                <option value="">Select product</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name}{p.stock != null ? ` (${p.stock})` : ''}</option>
                ))}
              </select>
              <input className="input" type="number" min="1" placeholder="1" value={it.qty} onChange={e => updateItem(i, 'qty', e.target.value)} disabled={saving} />
              <button className="btn btn-icon" style={{ color: 'var(--red)', width: 32, height: 32 }} onClick={() => removeItem(i)} disabled={saving || items.length === 1}><X size={13} /></button>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: 10, padding: '14px 18px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Grand Total</span>
          <span className="font-mono" style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{formatINR(grandTotal)}</span>
        </div>
      </Modal>

      {/* Invoice Preview Modal */}
      <Modal open={!!invoiceModal} onClose={() => setInv(null)} title="Invoice Preview" size="modal-lg">
        {invoiceModal && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button className="btn btn-ghost" onClick={handlePrint}><Printer size={14} /> Print</button>
              <button className="btn btn-ghost" onClick={handlePrint}><Download size={14} /> Download PDF</button>
            </div>
            <div ref={printRef}><InvoicePrint sale={invoiceModal} /></div>
          </>
        )}
      </Modal>

    </div>
  )
}

// import { useState, useRef, useEffect } from 'react'
// import { Plus, Eye, Printer, Download, X, Receipt, Loader } from 'lucide-react'
// import Modal from '../components/Modal'
// import DataTable from '../components/DataTable'
// import { formatINR, today, calcInvoiceTotals } from '../utils/helpers'
// import { salesService } from '../services/transactions.service'
// import { productsService } from '../services/products.service'
// import toast from 'react-hot-toast'

// const COMPANY = {
//     name: 'BillFlow Technologies Pvt. Ltd.',
//     address: '404, Nexus Complex, Bandra Kurla Complex, Mumbai – 400051',
//     phone: '+91 98765 43210', email: 'billing@billflow.in',
//     // gstin: '27AABCT1234F1Z5',
//     state: 'Maharashtra', stateCode: '27'
// }

// const EMPTY_FORM = { customerName: '', customerPhone: '', customerGst: '', date: today(), paymentMode: 'Cash' }
// const EMPTY_ITEM = {
//     productId: '', name: '', qty: 1, price: '',
//     // gst: 18 
// }

// /* ─── Invoice Print Template ─── */
// function InvoicePrint({ sale }) {
//     debugger
//     const [hoveredRow, setHoveredRow] = useState(null);
//     const { subtotal, gstAmt, total } = sale
//     return (
//         <div style={{ background: '#fff', color: '#1a1a1a', fontFamily: "'DM Sans', sans-serif", padding: 40 }}>
//             {/* Header */}
//             <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 28, borderBottom: '2px solid #f0f0f0', marginBottom: 28 }}>
//                 <div>
//                     <div style={{ fontSize: 26, fontWeight: 800, color: '#0a0e1a', marginBottom: 8 }}>⚡ BillFlow</div>
//                     <div style={{ fontSize: 12, color: '#666', lineHeight: 1.7 }}>
//                         {COMPANY.address}<br />
//                         📞 {COMPANY.phone} · ✉️ {COMPANY.email}<br />
//                         {/* <strong>GSTIN: {COMPANY.gstin}</strong> */}
//                     </div>
//                 </div>
//                 <div style={{ textAlign: 'right' }}>
//                     <div style={{ fontSize: 32, fontWeight: 900, color: '#d97706', letterSpacing: '-1px', marginBottom: 4 }}>INVOICE</div>
//                     <div style={{ fontSize: 18, fontWeight: 800 }}>{sale.invoiceNo}</div>
//                     <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Date: {sale.date}</div>
//                     <div style={{ marginTop: 10, display: 'inline-block', background: '#dcfce7', color: '#166534', padding: '3px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
//                         {sale.status.toUpperCase()}
//                     </div>
//                 </div>
//             </div>

//             {/* Bill To + Payment */}
//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
//                 <div>
//                     <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 8 }}>Bill To</div>
//                     <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 3 }}>{sale.customer.name}</div>
//                     <div style={{ fontSize: 13, color: '#555' }}>{sale.customer.phone}</div>
//                     {/* {sale.customer.gst && <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>GSTIN: {sale.customer.gst}</div>} */}
//                 </div>
//                 <div>
//                     <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 8 }}>Payment Details</div>
//                     <div style={{ fontWeight: 600 }}>Mode: {sale.paymentMode}</div>
//                     <div style={{ fontSize: 13, color: '#555' }}>State: {COMPANY.state} ({COMPANY.stateCode})</div>
//                 </div>
//             </div>

//             {/* Items table */}

//             <table style={{
//                 width: '100%',
//                 borderCollapse: 'collapse',
//                 marginBottom: 24,
//                 border: '1px solid #e2e8f0',
//                 borderRadius: 10,
//                 overflow: 'hidden',
//             }}>
//                 <thead>
//                     <tr style={{ background: '#f8fafc' }}>
//                         {['#', 'Description', 'Qty', 'Unit Price (excl. GST)',
//                             // 'GST %',
//                             'Amount'].map(h => (
//                                 <th key={h} style={{
//                                     padding: '10px 14px',
//                                     fontSize: 11,
//                                     fontWeight: 600,
//                                     textAlign: h === '#' ? 'center' : h === 'Amount' ? 'right' : 'left',
//                                     textTransform: 'uppercase',
//                                     letterSpacing: '0.07em',
//                                     color: '#64748b',
//                                     borderBottom: '1px solid #e2e8f0',
//                                     whiteSpace: 'nowrap',
//                                 }}>
//                                     {h}
//                                 </th>
//                             ))}
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {sale.products.map((p, i) => {
//                         const lineInc = +p.price * +p.qty
//                         // const base = lineInc / (1 + +p.gst / 100)
//                         // const unitBase = +p.price / (1 + +p.gst / 100)
//                         const isHovered = hoveredRow === i

//                         return (
//                             <tr
//                                 key={i}
//                                 onMouseEnter={() => setHoveredRow(i)}
//                                 onMouseLeave={() => setHoveredRow(null)}
//                                 style={{
//                                     borderBottom: i < sale.products.length - 1 ? '1px solid #f1f5f9' : 'none',
//                                     background: isHovered ? '#eff6ff' : 'white',
//                                     transition: 'background 0.12s ease',
//                                     cursor: 'default',
//                                 }}
//                             >
//                                 <td style={{ padding: '11px 14px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
//                                     {i + 1}
//                                 </td>
//                                 <td style={{ padding: '11px 14px', fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
//                                     {p.name}
//                                 </td>
//                                 <td style={{ padding: '11px 14px', fontSize: 13, textAlign: 'center', color: '#64748b' }}>
//                                     {p.qty}
//                                 </td>
//                                 <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 13, textAlign: 'right', color: '#0f172a' }}>
//                                     ₹{unitBase.toFixed(2)}
//                                 </td>
//                                 {/* <td style={{ padding: '11px 14px', fontSize: 13, textAlign: 'center' }}>
//                                     <span style={{
//                                         display: 'inline-block',
//                                         background: '#f1f5f9',
//                                         border: '1px solid #e2e8f0',
//                                         borderRadius: 20,
//                                         padding: '2px 8px',
//                                         fontSize: 11,
//                                         fontWeight: 600,
//                                         color: '#0f172a',
//                                     }}>
//                                         {p.gst}%
//                                     </span>
//                                 </td> */}
//                                 <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontWeight: 700, textAlign: 'right', fontSize: 13, color: '#0f172a' }}>
//                                     ₹{base.toFixed(2)}
//                                 </td>
//                             </tr>
//                         )
//                     })}
//                 </tbody>
//             </table>
//             {/* Totals */}
//             <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
//                 <div style={{ minWidth: 270, background: '#f8f9fa', borderRadius: 10, padding: '16px 20px' }}>
//                     {/* {[['Subtotal (excl. GST)', subtotal], ['CGST (9%)', gstAmt / 2], ['SGST (9%)', gstAmt / 2]].map(([k, v]) => (
//                         <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: '#555' }}>
//                             <span>{k}</span><span style={{ fontFamily: 'monospace' }}>₹{Number(v).toFixed(2)}</span>
//                         </div>
//                     ))} */}
//                     <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 18, color: '#0a0e1a', borderTop: '2px solid #ddd', paddingTop: 10 }}>
//                         <span>Grand Total</span>
//                         <span style={{ fontFamily: 'monospace', color: '#d97706' }}>₹{Number(total).toFixed(2)}</span>
//                     </div>
//                 </div>
//             </div>

//             {/* Footer */}
//             <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: 16, fontSize: 12, color: '#aaa' }}>
//                 <span>Thank you for your business!</span>
//                 <span>Generated by BillFlow · {COMPANY.name}</span>
//             </div>
//         </div>
//     )
// }

// export default function Sales() {
//     const [sales, setSales] = useState([])
//     const [products, setProducts] = useState([])
//     const [modal, setModal] = useState(false)
//     const [invoiceModal, setInv] = useState(null)
//     const [form, setForm] = useState(EMPTY_FORM)
//     const [items, setItems] = useState([{ ...EMPTY_ITEM }])
//     const [saving, setSaving] = useState(false)
//     const [loading, setLoading] = useState(true)
//     const [error, setError] = useState(null)
//     const printRef = useRef()

//     const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

//     // Fetch sales and products on mount
//     useEffect(() => {
//         debugger;
//         const fetchData = async () => {
//             try {
//                 setLoading(true)
//                 setError(null)
//                 const [salesRes, productsRes] = await Promise.all([
//                     salesService.getAll(),
//                     productsService.getAll(),
//                 ])

//                 setSales(salesRes.data?.sales || [])
//                 setProducts(productsRes.data?.products || [])
//             } catch (err) {
//                 console.error('Failed to load data:', err)
//                 setError('Failed to load sales. Please try again.')
//                 toast.error('Failed to load data')
//             } finally {
//                 setLoading(false)
//             }
//         }

//         fetchData()
//     }, [])

//     const updateItem = (i, field, val) => {
//         setItems(prev => {
//             const next = [...prev]
//             next[i] = { ...next[i], [field]: val }
//             if (field === 'productId') {
//                 const p = products.find(p => p._id === val)
//                 if (p) {
//                     next[i].name = p.name
//                     next[i].price = p.price
//                     // next[i].gst = p.gst || 18
//                 }
//             }
//             return next
//         })
//     }
//     const addItem = () => setItems(i => [...i, { ...EMPTY_ITEM }])
//     const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))

//     const totals = calcInvoiceTotals(items)

//     const openNew = () => {
//         setForm(EMPTY_FORM)
//         setItems([{ ...EMPTY_ITEM }])
//         setModal(true)
//     }

//     const validateForm = () => {
//         if (!form.customerName?.trim()) {
//             toast.error('Customer name is required')
//             return false
//         }
//         if (items.length === 0) {
//             toast.error('Add at least one item')
//             return false
//         }
//         if (items.some(it => !it.productId || !it.qty || !it.price)) {
//             toast.error('Complete all item rows')
//             return false
//         }
//         return true
//     }

//     const save = async () => {
//         if (!validateForm()) return

//         setSaving(true)
//         try {
//             const payload = {
//                 customer: {
//                     name: form.customerName,
//                     phone: form.customerPhone,
//                     // gst: form.customerGst,
//                 },
//                 date: form.date,
//                 paymentMode: form.paymentMode,
//                 ...totals,
//                 products: items.map(it => ({
//                     productId: it.productId,
//                     name: it.name,
//                     qty: +it.qty,
//                     price: +it.price,
//                     // gst: +it.gst
//                 }))
//             }

//             const res = await salesService.create(payload)
//             debugger
//             const newSale = res.data?.sale || {
//                 _id: Date.now().toString(),
//                 ...payload,
//                 invoiceNo: `INV-${sales.length + 1}`,
//                 customer: {
//                     name: form.customerName, phone: form.customerPhone,
//                     //  gst: form.customerGst 
//                 },
//                 status: 'paid'
//             }

//             setSales(ss => [newSale, ...ss])
//             setModal(false)
//             setInv(newSale)
//             toast.success(`Invoice created successfully!`)
//         } catch (err) {
//             console.error('Failed to save invoice:', err)
//             toast.error(err.response?.data?.message || 'Failed to create invoice')
//         } finally {
//             setSaving(false)
//         }
//     }

//     const handlePrint = () => {
//         const w = window.open('', '_blank')
//         w.document.write(`<html><head><title>Invoice</title>
//       <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
//       <style>body{margin:0;padding:0;}</style>
//     </head><body>${printRef.current.innerHTML}</body></html>`)
//         w.document.close()
//         setTimeout(() => { w.focus(); w.print() }, 500)
//     }

//     const columns = [
//         {
//             key: 'invoiceNo',
//             label: 'Invoice',
//             render: v => <span className="font-mono" style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12 }}>{v}</span>
//         },
//         {
//             key: 'date',
//             label: 'Date',
//             render: v => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{new Date(v).toLocaleDateString()}</span>
//         },
//         {
//             key: 'customer',
//             label: 'Customer',
//             render: (v) => (
//                 <div>
//                     <div style={{ fontWeight: 500 }}>{v?.name}</div>
//                     <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v?.phone}</div>
//                 </div>
//             )
//         },
//         {
//             key: 'products',
//             label: 'Items',
//             render: v => <span className="badge badge-purple">{v?.length || 0} items</span>
//         },
//         {
//             key: 'subtotal',
//             label: 'Subtotal',
//             render: v => <span className="font-mono">{formatINR(v)}</span>
//         },
//         // {
//         //     key: 'gstAmt',
//         //     label: 'GST',
//         //     render: v => <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{formatINR(v)}</span>
//         // },
//         {
//             key: 'total',
//             label: 'Total',
//             render: v => <span className="font-mono" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{formatINR(v)}</span>
//         },
//         {
//             key: 'paymentMode',
//             label: 'Mode',
//             render: v => <span className="badge badge-blue">{v}</span>
//         },
//         {
//             key: 'status',
//             label: 'Status',
//             render: v => <span className={`badge badge-${v === 'paid' ? 'green' : 'amber'}`}>{v}</span>
//         },
//         {
//             key: '_id',
//             label: 'Actions',
//             sortable: false,
//             render: (_, row) => (
//                 <button className="btn btn-icon" onClick={() => setInv(row)} title="View invoice">
//                     <Eye size={13} />
//                 </button>
//             )
//         },
//     ]

//     const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0)

//     if (loading) {
//         return (
//             <div className="animate-fadeIn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
//                 <div style={{ textAlign: 'center' }}>
//                     <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
//                     <p style={{ color: 'var(--text-secondary)' }}>Loading sales...</p>
//                 </div>
//             </div>
//         )
//     }

//     if (error && sales.length === 0) {
//         return (
//             <div className="animate-fadeIn">
//                 <div className="page-header">
//                     <h2 className="page-title">Sales-1</h2>
//                 </div>
//                 <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
//                     <p>{error}</p>
//                     <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ marginTop: '16px' }}>
//                         Retry
//                     </button>
//                 </div>
//             </div>
//         )
//     }

//     return (
//         <div className="animate-fadeIn">
//             <div className="page-header">
//                 <div>
//                     <h2 className="page-title">Sales-1</h2>
//                     <p className="page-subtitle">
//                         {sales.length} invoices.
//                         {/* · */}
//                         {/* {formatINR(totalRevenue)} total revenue */}
//                     </p>
//                 </div>
//                 <button className="btn btn-primary" onClick={openNew}>
//                     <Plus size={15} /> New Invoice
//                 </button>
//             </div>

//             <div className="card card-flush">
//                 {sales.length > 0 ? (
//                     <DataTable columns={columns} data={sales} searchKeys={['invoiceNo', 'customer']} />
//                 ) : (
//                     <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
//                         <p>No invoices created yet</p>
//                     </div>
//                 )}
//             </div>
//             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '300px' }}>

//                 {/* New Invoice Modal */}
//                 <Modal
//                     open={modal}
//                     onClose={() => setModal(false)}
//                     title="Create"
//                     size="modal-xl"
//                     footer={(
//                         <>
//                             <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
//                             <button className="btn btn-primary" onClick={save} disabled={saving}>
//                                 <Receipt size={14} /> {saving ? 'Creating…' : 'Generate Invoice'}
//                             </button>
//                         </>
//                     )}
//                 >
//                     <div className="grid grid-2" style={{ gap: 24, marginBottom: 24 }}>
//                         {/* Customer */}
//                         <div>
//                             <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Customer Details</div>
//                             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
//                                 <div className="form-group">
//                                     <label className="form-label">Customer Name *</label>
//                                     <input
//                                         className="input"
//                                         placeholder="Full name"
//                                         value={form.customerName}
//                                         onChange={set('customerName')}
//                                         disabled={saving}
//                                     />
//                                 </div>
//                                 <div className="form-group">
//                                     <label className="form-label">Phone Number</label>
//                                     <input
//                                         className="input"
//                                         placeholder="+91 XXXXX XXXXX"
//                                         value={form.customerPhone}
//                                         onChange={set('customerPhone')}
//                                         disabled={saving}
//                                     />
//                                 </div>
//                                 {/* <div className="form-group">
//                   <label className="form-label">GSTIN (Optional)</label>
//                   <input
//                     className="input"
//                     placeholder="27XXXXX"
//                     value={form.customerGst}
//                     onChange={set('customerGst')}
//                     disabled={saving}
//                   />
//                 </div> */}
//                             </div>
//                         </div>
//                         {/* Invoice Details */}
//                         <div>
//                             <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Invoice Details</div>
//                             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
//                                 <div className="form-group">
//                                     <label className="form-label">Invoice Date</label>
//                                     <input
//                                         className="input"
//                                         type="date"
//                                         value={form.date}
//                                         onChange={set('date')}
//                                         disabled={saving}
//                                     />
//                                 </div>
//                                 <div className="form-group">
//                                     <label className="form-label">Payment Mode</label>
//                                     <select
//                                         className="input"
//                                         value={form.paymentMode}
//                                         onChange={set('paymentMode')}
//                                         disabled={saving}
//                                     >
//                                         {['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Credit'].map(m => (
//                                             <option key={m}>{m}</option>
//                                         ))}
//                                     </select>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Items */}
//                     <div style={{ marginBottom: 20 }}>
//                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
//                             <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Line Items</div>
//                             <button className="btn btn-ghost btn-sm" onClick={addItem} disabled={saving}>
//                                 <Plus size={12} /> Add Row
//                             </button>
//                         </div>
//                         {/* Header */}
//                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px 80px auto', gap: 8, marginBottom: 6, padding: '0 4px' }}>
//                             {['Product', 'Qty',].map(h => (
//                                 <div key={h || 'actions'} style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
//                             ))}
//                         </div>
//                         {items.map((it, i) => (
//                             <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px 80px auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
//                                 <select
//                                     className="input"
//                                     value={it.productId}
//                                     onChange={e => updateItem(i, 'productId', e.target.value)}
//                                     disabled={saving}
//                                 >
//                                     <option value="">Select product</option>
//                                     {products.map(p => (
//                                         <option key={p._id} value={p._id}>
//                                             {p.name} {p.stock ? `(Stock: ${p.stock})` : ''}
//                                         </option>
//                                     ))}
//                                 </select>
//                                 <input
//                                     className="input"
//                                     type="number"
//                                     min="1"
//                                     placeholder="1"
//                                     value={it.qty}
//                                     onChange={e => updateItem(i, 'qty', e.target.value)}
//                                     disabled={saving}
//                                 />
//                                 {/* <input
//                                     className="input"
//                                     type="number"
//                                     min="0"
//                                     placeholder="0.00"
//                                     value={it.price}
//                                     onChange={e => updateItem(i, 'price', e.target.value)}
//                                     disabled={saving}
//                                 /> */}
//                                 {/* <select
//                                     className="input"
//                                     value={it.gst}
//                                     onChange={e => updateItem(i, 'gst', e.target.value)}
//                                     disabled={saving}
//                                 >
//                                     {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
//                                 </select> */}
//                                 <button
//                                     className="btn btn-icon"
//                                     style={{ color: 'var(--red)' }}
//                                     onClick={() => removeItem(i)}
//                                     disabled={saving}
//                                     title="Remove item"
//                                 >
//                                     <X size={13} />
//                                 </button>
//                             </div>
//                         ))}
//                     </div>

//                     {/* Bill summary */}
//                     <div style={{ background: 'var(--bg-secondary)', borderRadius: 11, padding: '14px 18px', maxWidth: 300, marginLeft: 'auto' }}>
//                         {/* {[['Subtotal (excl. GST)', totals.subtotal], ['CGST', totals.cgst], ['SGST', totals.sgst]].map(([k, v]) => (
//                             <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 7 }}>
//                                 <span>{k}</span><span className="font-mono">{formatINR(v)}</span>
//                             </div>
//                         ))} */}
//                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, color: 'var(--accent)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
//                             <span>Grand Total</span><span className="font-mono">{formatINR(totals.total)}</span>
//                         </div>
//                     </div>
//                 </Modal>

//                 {/* Invoice Preview Modal */}
//                 <Modal
//                     open={!!invoiceModal}
//                     onClose={() => setInv(null)}
//                     title="Invoice Preview"
//                     size="modal-lg"
//                 >
//                     {invoiceModal && (
//                         <>
//                             <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
//                                 <button className="btn btn-ghost" onClick={handlePrint}>
//                                     <Printer size={14} /> Print
//                                 </button>
//                                 <button className="btn btn-ghost" onClick={handlePrint}>
//                                     <Download size={14} /> Download PDF
//                                 </button>
//                             </div>
//                             <div ref={printRef}>
//                                 <InvoicePrint sale={invoiceModal} />
//                             </div>
//                         </>
//                     )}
//                 </Modal>
//             </div>
//         </div>
//     )
// }
