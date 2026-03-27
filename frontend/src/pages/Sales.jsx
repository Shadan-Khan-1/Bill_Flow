import { useState, useRef } from 'react'
import { Plus, Eye, Printer, Download, X, Receipt } from 'lucide-react'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'
import { formatINR, today, calcInvoiceTotals } from '../utils/helpers'
import toast from 'react-hot-toast'

const DEMO_PRODUCTS = [
  { _id: '1', name: 'Samsung Galaxy S24',   price: 79999, gst: 18, stock: 15 },
  { _id: '2', name: 'Sony WH-1000XM5',      price: 29990, gst: 18, stock: 8  },
  { _id: '3', name: 'Apple MacBook Air M3', price: 114900,gst: 18, stock: 4  },
  { _id: '4', name: 'Logitech MX Master 3', price: 9995,  gst: 18, stock: 22 },
  { _id: '5', name: 'Dell 27" 4K Monitor',  price: 52990, gst: 18, stock: 3  },
]

const DEMO_SALES = [
  { _id: '1', date: '2025-03-23', invoiceNo: 'INV-004', customer: { name: 'Kavitha R',     phone: '9765432100', gst: '' },           subtotal: 9997,   gstAmt: 2122,  total: 12119,  paymentMode: 'Cash',          status: 'pending', products: [{ name: 'Mechanical Keyboard RGB', qty: 2, price: 4999, gst: 18 }, { name: 'Wireless Charger 15W', qty: 1, price: 1999, gst: 18 }] },
  { _id: '2', date: '2025-03-22', invoiceNo: 'INV-003', customer: { name: 'Arjun Tech Hub', phone: '9011234567', gst: '27AAACT1234F1Z5' }, subtotal: 186347, gstAmt: 39528, total: 225875, paymentMode: 'Bank Transfer', status: 'paid',    products: [{ name: 'Apple MacBook Air M3', qty: 1, price: 114900, gst: 18 }] },
  { _id: '3', date: '2025-03-21', invoiceNo: 'INV-002', customer: { name: 'Priya Mehta',    phone: '9823456789', gst: '' },           subtotal: 25415,  gstAmt: 5396,  total: 30811,  paymentMode: 'Card',          status: 'paid',    products: [{ name: 'Sony WH-1000XM5', qty: 1, price: 29990, gst: 18 }] },
  { _id: '4', date: '2025-03-20', invoiceNo: 'INV-001', customer: { name: 'Rahul Sharma',   phone: '9876543210', gst: '27AADCB2230M1Z3' }, subtotal: 76271,  gstAmt: 16182, total: 92446,  paymentMode: 'UPI',           status: 'paid',    products: [{ name: 'Samsung Galaxy S24', qty: 1, price: 79999, gst: 18 }] },
]

const COMPANY = {
  name: 'BillFlow Technologies Pvt. Ltd.',
  address: '404, Nexus Complex, Bandra Kurla Complex, Mumbai – 400051',
  phone: '+91 98765 43210', email: 'billing@billflow.in',
  gstin: '27AABCT1234F1Z5', state: 'Maharashtra', stateCode: '27'
}

const EMPTY_FORM = { customerName: '', customerPhone: '', customerGst: '', date: today(), paymentMode: 'Cash' }
const EMPTY_ITEM = { productId: '', name: '', qty: 1, price: '', gst: 18 }

/* ─── Invoice Print Template ─── */
function InvoicePrint({ sale }) {
  const { subtotal, gstAmt, total } = sale
  return (
    <div style={{ background: '#fff', color: '#1a1a1a', fontFamily: "'DM Sans', sans-serif", padding: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 28, borderBottom: '2px solid #f0f0f0', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0a0e1a', marginBottom: 8 }}>⚡ BillFlow</div>
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.7 }}>
            {COMPANY.address}<br />
            📞 {COMPANY.phone} · ✉️ {COMPANY.email}<br />
            <strong>GSTIN: {COMPANY.gstin}</strong>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#d97706', letterSpacing: '-1px', marginBottom: 4 }}>INVOICE</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{sale.invoiceNo}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Date: {sale.date}</div>
          <div style={{ marginTop: 10, display: 'inline-block', background: '#dcfce7', color: '#166534', padding: '3px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
            {sale.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Bill To + Payment */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 8 }}>Bill To</div>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 3 }}>{sale.customer.name}</div>
          <div style={{ fontSize: 13, color: '#555' }}>{sale.customer.phone}</div>
          {sale.customer.gst && <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>GSTIN: {sale.customer.gst}</div>}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 8 }}>Payment Details</div>
          <div style={{ fontWeight: 600 }}>Mode: {sale.paymentMode}</div>
          <div style={{ fontSize: 13, color: '#555' }}>State: {COMPANY.state} ({COMPANY.stateCode})</div>
        </div>
      </div>

      {/* Items table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#f8f9fa' }}>
            {['#','Description','Qty','Unit Price (excl. GST)','GST %','Amount'].map(h => (
              <th key={h} style={{ padding: '10px 12px', fontSize: 11, textAlign: h === '#' ? 'center' : h === 'Amount' ? 'right' : 'left', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#666' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sale.products.map((p, i) => {
            const lineInc = +p.price * +p.qty
            const base    = lineInc / (1 + +p.gst / 100)
            return (
              <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>{i + 1}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 13 }}>{p.name}</td>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>{p.qty}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 13 }}>₹{(+p.price / (1 + +p.gst / 100)).toFixed(2)}</td>
                <td style={{ padding: '10px 12px', fontSize: 13 }}>{p.gst}%</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, textAlign: 'right', fontSize: 13 }}>₹{base.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
        <div style={{ minWidth: 270, background: '#f8f9fa', borderRadius: 10, padding: '16px 20px' }}>
          {[['Subtotal (excl. GST)', subtotal], ['CGST (9%)', gstAmt / 2], ['SGST (9%)', gstAmt / 2]].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: '#555' }}>
              <span>{k}</span><span style={{ fontFamily: 'monospace' }}>₹{Number(v).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 18, color: '#0a0e1a', borderTop: '2px solid #ddd', paddingTop: 10 }}>
            <span>Grand Total</span>
            <span style={{ fontFamily: 'monospace', color: '#d97706' }}>₹{Number(total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: 16, fontSize: 12, color: '#aaa' }}>
        <span>Thank you for your business!</span>
        <span>Generated by BillFlow · {COMPANY.name}</span>
      </div>
    </div>
  )
}

export default function Sales() {
  const [sales, setSales]       = useState(DEMO_SALES)
  const [modal, setModal]       = useState(false)
  const [invoiceModal, setInv]  = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [items, setItems]       = useState([{ ...EMPTY_ITEM }])
  const [saving, setSaving]     = useState(false)
  const printRef = useRef()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const updateItem = (i, field, val) => {
    setItems(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: val }
      if (field === 'productId') {
        const p = DEMO_PRODUCTS.find(p => p._id === val)
        if (p) { next[i].name = p.name; next[i].price = p.price; next[i].gst = p.gst }
      }
      return next
    })
  }
  const addItem    = () => setItems(i => [...i, { ...EMPTY_ITEM }])
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const totals = calcInvoiceTotals(items)

  const openNew = () => { setForm(EMPTY_FORM); setItems([{ ...EMPTY_ITEM }]); setModal(true) }

  const save = async () => {
    if (!form.customerName) return toast.error('Enter customer name')
    if (items.some(it => !it.productId)) return toast.error('Select product for all rows')
    setSaving(true)
    try {
      const invNo = `INV-${String(sales.length + 5).padStart(3, '0')}`
      const sale = {
        _id: Date.now().toString(), date: form.date, invoiceNo: invNo,
        customer: { name: form.customerName, phone: form.customerPhone, gst: form.customerGst },
        products: items.map(it => ({ productId: it.productId, name: it.name, qty: +it.qty, price: +it.price, gst: +it.gst })),
        ...totals, paymentMode: form.paymentMode, status: 'paid'
      }
      setSales(ss => [sale, ...ss])
      toast.success(`Invoice ${invNo} created!`)
      setModal(false)
      setInv(sale)
    } finally { setSaving(false) }
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
    { key: 'invoiceNo', label: 'Invoice', render: v => <span className="font-mono" style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12 }}>{v}</span> },
    { key: 'date',      label: 'Date',    render: v => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span> },
    { key: 'customer',  label: 'Customer',render: (v) => (
      <div>
        <div style={{ fontWeight: 500 }}>{v?.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v?.phone}</div>
      </div>
    )},
    { key: 'products',    label: 'Items',  render: v => <span className="badge badge-purple">{v?.length} items</span> },
    { key: 'subtotal',    label: 'Subtotal',render: v => <span className="font-mono">{formatINR(v)}</span> },
    { key: 'gstAmt',      label: 'GST',    render: v => <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{formatINR(v)}</span> },
    { key: 'total',       label: 'Total',  render: v => <span className="font-mono" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{formatINR(v)}</span> },
    { key: 'paymentMode', label: 'Mode',   render: v => <span className="badge badge-blue">{v}</span> },
    { key: 'status',      label: 'Status', render: v => <span className={`badge badge-${v === 'paid' ? 'green' : 'amber'}`}>{v}</span> },
    { key: '_id', label: 'Actions', sortable: false, render: (_, row) => (
      <button className="btn btn-icon" onClick={() => setInv(row)}><Eye size={13} /></button>
    )},
  ]

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h2 className="page-title">Sales & Billing</h2>
          <p className="page-subtitle">
            {sales.length} invoices · {formatINR(sales.reduce((s, x) => s + x.total, 0))} total revenue
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={15} /> New Invoice</button>
      </div>

      <div className="card card-flush">
        <DataTable columns={columns} data={sales} searchKeys={['invoiceNo', 'customer']} />
      </div>

      {/* New Invoice Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Create Invoice" size="modal-xl"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <Receipt size={14} /> {saving ? 'Creating…' : 'Generate Invoice'}
          </button>
        </>}
      >
        <div className="grid grid-2" style={{ gap: 24, marginBottom: 24 }}>
          {/* Customer */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Customer Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input className="input" placeholder="Full name" value={form.customerName} onChange={set('customerName')} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="input" placeholder="+91 XXXXX XXXXX" value={form.customerPhone} onChange={set('customerPhone')} />
              </div>
              <div className="form-group">
                <label className="form-label">GSTIN (Optional)</label>
                <input className="input" placeholder="27XXXXX" value={form.customerGst} onChange={set('customerGst')} />
              </div>
            </div>
          </div>
          {/* Invoice Details */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Invoice Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Invoice Date</label>
                <input className="input" type="date" value={form.date} onChange={set('date')} />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select className="input" value={form.paymentMode} onChange={set('paymentMode')}>
                  {['Cash','Card','UPI','Bank Transfer','Cheque','Credit'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Line Items</div>
            <button className="btn btn-ghost btn-sm" onClick={addItem}><Plus size={12} /> Add Row</button>
          </div>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px 80px auto', gap: 8, marginBottom: 6, padding: '0 4px' }}>
            {['Product','Qty','Price (incl. GST)','GST%',''].map(h => (
              <div key={h} style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
            ))}
          </div>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px 80px auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <select className="input" value={it.productId} onChange={e => updateItem(i, 'productId', e.target.value)}>
                <option value="">Select product</option>
                {DEMO_PRODUCTS.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock})</option>)}
              </select>
              <input className="input" type="number" min="1" placeholder="1" value={it.qty} onChange={e => updateItem(i, 'qty', e.target.value)} />
              <input className="input" type="number" min="0" placeholder="0.00" value={it.price} onChange={e => updateItem(i, 'price', e.target.value)} />
              <select className="input" value={it.gst} onChange={e => updateItem(i, 'gst', e.target.value)}>
                {[0,5,12,18,28].map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
              <button className="btn btn-icon" style={{ color: 'var(--red)' }} onClick={() => removeItem(i)}><X size={13} /></button>
            </div>
          ))}
        </div>

        {/* Bill summary */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 11, padding: '14px 18px', maxWidth: 300, marginLeft: 'auto' }}>
          {[['Subtotal (excl. GST)', totals.subtotal], ['CGST', totals.cgst], ['SGST', totals.sgst]].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 7 }}>
              <span>{k}</span><span className="font-mono">{formatINR(v)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, color: 'var(--accent)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <span>Grand Total</span><span className="font-mono">{formatINR(totals.total)}</span>
          </div>
        </div>
      </Modal>

      {/* Invoice Preview Modal */}
      <Modal open={!!invoiceModal} onClose={() => setInv(null)} title="Invoice Preview" size="modal-lg">
        {invoiceModal && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button className="btn btn-ghost" onClick={handlePrint}><Printer size={14} /> Print</button>
              <button className="btn btn-ghost" onClick={handlePrint}><Download size={14} /> Download PDF</button>
            </div>
            <div ref={printRef}>
              <InvoicePrint sale={invoiceModal} />
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
