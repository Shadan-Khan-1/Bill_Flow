import { useState } from 'react'
import { Plus, Eye, CheckCircle, X } from 'lucide-react'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'
import { formatINR, today, calcInvoiceTotals } from '../utils/helpers'
import { purchasesService } from '../services/transactions.service'
import toast from 'react-hot-toast'

/* ── Demo data when API not connected ── */
const DEMO_PURCHASES = [
  { _id: '1', date: '2025-03-10', invoiceNo: 'PUR-001', supplier: 'Samsung India', subtotal: 340000, gstAmt: 61200, total: 401200, status: 'received', paymentStatus: 'paid', products: [{ name: 'Samsung Galaxy S24', qty: 5, price: 68000, total: 340000 }] },
  { _id: '2', date: '2025-03-14', invoiceNo: 'PUR-002', supplier: 'Apple Distributor', subtotal: 196000, gstAmt: 35280, total: 231280, status: 'received', paymentStatus: 'pending', products: [{ name: 'Apple MacBook Air M3', qty: 2, price: 98000, total: 196000 }] },
  { _id: '3', date: '2025-03-18', invoiceNo: 'PUR-003', supplier: 'Logitech India', subtotal: 75000, gstAmt: 13500, total: 88500, status: 'received', paymentStatus: 'paid', products: [{ name: 'Logitech MX Master 3', qty: 10, price: 7500, total: 75000 }] },
  { _id: '4', date: '2025-03-22', invoiceNo: 'PUR-004', supplier: 'Sony India', subtotal: 96000, gstAmt: 17280, total: 113280, status: 'pending', paymentStatus: 'pending', products: [{ name: 'Sony WH-1000XM5', qty: 4, price: 24000, total: 96000 }] },
]
const DEMO_PRODUCTS = [
  { _id: '1', name: 'Samsung Galaxy S24', costPrice: 68000 },
  { _id: '2', name: 'Sony WH-1000XM5', costPrice: 24000 },
  { _id: '3', name: 'Apple MacBook Air M3', costPrice: 98000 },
  { _id: '4', name: 'Logitech MX Master 3', costPrice: 7500 },
]

const EMPTY_FORM = { supplier: '', invoiceNo: '', date: today(), notes: '', paymentStatus: 'pending' }
const EMPTY_ITEM = { productId: '', name: '', qty: 1, price: '' }

export default function Purchases() {
  const [purchases, setPurchases] = useState(DEMO_PURCHASES)
  const [modal, setModal] = useState(false)
  const [viewModal, setView] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const updateItem = (i, field, val) => {
    setItems(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: val }
      if (field === 'productId') {
        const p = DEMO_PRODUCTS.find(p => p._id === val)
        if (p) { next[i].name = p.name; next[i].price = p.costPrice }
      }
      return next
    })
  }
  const addItem = () => setItems(i => [...i, { ...EMPTY_ITEM }])
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const totals = calcInvoiceTotals(items.map(it => ({ ...it, gst: 18 })))

  const openNew = () => {
    setForm(EMPTY_FORM)
    setItems([{ ...EMPTY_ITEM }])
    setModal(true)
  }

  const save = async () => {
    debugger
    if (!form.supplier || !form.invoiceNo) return toast.error('Fill required fields')
    if (items.some(it => !it.productId || !it.qty || !it.price)) return toast.error('Complete all item rows')
    setSaving(true)
    try {
      const payload = {
        ...form, ...totals,
        products: items.map(it => ({
          productId: it.productId, name: it.name,
          qty: +it.qty, price: +it.price, total: +it.qty * +it.price
        }))
      }
       await purchasesService.create(payload) // ← uncomment with real API
      const mock = { _id: Date.now().toString(), ...payload, status: 'pending' }
      setPurchases(ps => [mock, ...ps])
      toast.success('Purchase recorded!')
      setModal(false)
    } finally { setSaving(false) }
  }

  const columns = [
    { key: 'invoiceNo', label: 'Invoice', render: v => <span className="font-mono" style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 12 }}>{v}</span> },
    { key: 'date', label: 'Date', render: v => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span> },
    { key: 'supplier', label: 'Supplier', render: v => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'products', label: 'Items', render: v => <span className="badge badge-blue">{v?.length} items</span> },
    { key: 'subtotal', label: 'Subtotal', render: v => <span className="font-mono">{formatINR(v)}</span> },
    { key: 'gstAmt', label: 'GST', render: v => <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{formatINR(v)}</span> },
    { key: 'total', label: 'Total', render: v => <span className="font-mono" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{formatINR(v)}</span> },
    { key: 'status', label: 'Status', render: v => <span className={`badge badge-${v === 'received' ? 'green' : 'amber'}`}>{v}</span> },
    { key: 'paymentStatus', label: 'Payment', render: v => <span className={`badge badge-${v === 'paid' ? 'green' : 'red'}`}>{v}</span> },
    {
      key: '_id', label: 'Action', sortable: false, render: (_, row) => (
        <button className="btn btn-icon" onClick={() => setView(row)}><Eye size={13} /></button>
      )
    },
  ]

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h2 className="page-title">Purchases</h2>
          <p className="page-subtitle">
            {purchases.length} entries · {formatINR(purchases.reduce((s, p) => s + p.total, 0))} total
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={15} /> New Purchase</button>
      </div>

      <div className="card card-flush">
        <DataTable columns={columns} data={purchases} searchKeys={['invoiceNo', 'supplier']} />
      </div>

      {/* New Purchase Modal */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '300px' }}>

        <Modal open={modal} onClose={() => setModal(false)} title="Record Purchase" size="modal-lg"
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save Purchase'}
            </button>
          </>}
        >
          <div className="grid grid-3" style={{ gap: 12, marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Supplier *</label>
              <input className="input" placeholder="Supplier name" value={form.supplier} onChange={set('supplier')} />
            </div>
            <div className="form-group">
              <label className="form-label">Invoice No *</label>
              <input className="input" placeholder="PUR-XXX" value={form.invoiceNo} onChange={set('invoiceNo')} />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="input" type="date" value={form.date} onChange={set('date')} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Payment Status</label>
              <select className="input" value={form.paymentStatus} onChange={set('paymentStatus')}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
              </select>
            </div>
          </div>

          {/* Items */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label className="form-label" style={{ margin: 0 }}>Items</label>
              <button className="btn btn-ghost btn-sm" onClick={addItem}><Plus size={12} /> Add Item</button>
            </div>
            {items.map((it, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <select className="input" value={it.productId} onChange={e => updateItem(i, 'productId', e.target.value)}>
                  <option value="">Select product</option>
                  {DEMO_PRODUCTS.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <input className="input" type="number" min="1" placeholder="Qty" value={it.qty} onChange={e => updateItem(i, 'qty', e.target.value)} />
                <input className="input" type="number" min="0" placeholder="Cost ₹" value={it.price} onChange={e => updateItem(i, 'price', e.target.value)} />
                <button className="btn btn-icon" style={{ color: 'var(--red)' }} onClick={() => removeItem(i)}><X size={13} /></button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '14px 18px', maxWidth: 280, marginLeft: 'auto' }}>
            {[['Subtotal', totals.subtotal], ['GST (18%)', totals.gstAmt]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 7 }}>
                <span>{k}</span><span className="font-mono">{formatINR(v)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, color: 'var(--accent)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <span>Grand Total</span><span className="font-mono">{formatINR(totals.total)}</span>
            </div>
          </div>
        </Modal>

        {/* View Modal */}
        <Modal open={!!viewModal} onClose={() => setView(null)} title={`Purchase — ${viewModal?.invoiceNo}`} size="modal-md">
          {viewModal && (
            <>
              <div className="grid grid-2" style={{ gap: 10, marginBottom: 18 }}>
                {[['Supplier', viewModal.supplier], ['Date', viewModal.date], ['Invoice No', viewModal.invoiceNo], ['Status', viewModal.status]].map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--bg-secondary)', borderRadius: 9, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k}</div>
                    <div style={{ fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
              <table style={{ marginBottom: 16 }}>
                <thead><tr><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr></thead>
                <tbody>
                  {viewModal.products.map((p, i) => (
                    <tr key={i}>
                      <td>{p.name}</td>
                      <td className="font-mono">{p.qty}</td>
                      <td className="font-mono">{formatINR(p.price)}</td>
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatINR(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '14px 18px' }}>
                {[['Subtotal', viewModal.subtotal], ['GST', viewModal.gstAmt]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 7 }}>
                    <span>{k}</span><span className="font-mono">{formatINR(v)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, color: 'var(--accent)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <span>Grand Total</span><span className="font-mono">{formatINR(viewModal.total)}</span>
                </div>
              </div>
            </>
          )}
        </Modal>
      </div>
    </div>
  )
}
