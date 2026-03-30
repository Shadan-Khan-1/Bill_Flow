import { useState, useEffect } from 'react'
import { Plus, Eye, X, Loader } from 'lucide-react'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'
import { formatINR, today, calcInvoiceTotals } from '../utils/helpers'
import { purchasesService } from '../services/transactions.service'
import { productsService } from '../services/products.service'
import toast from 'react-hot-toast'

const EMPTY_FORM = { supplier: '', invoiceNo: '', date: today(), notes: '', paymentStatus: 'pending' }
const EMPTY_ITEM = { productId: '', name: '', qty: 1, price: '' }

export default function Purchases() {
  const [purchases, setPurchases] = useState([])
  const [products, setProducts] = useState([])
  const [modal, setModal] = useState(false)
  const [viewModal, setView] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // Fetch purchases and products on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [purchasesRes, productsRes] = await Promise.all([
          purchasesService.getAll(),
          productsService.getAll(),
        ])

        setPurchases(purchasesRes.data?.purchases || [])
        setProducts(productsRes.data?.products || [])
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load purchases. Please try again.')
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, []);
  const updateItem = (i, field, val) => {
    setItems(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: val }
      if (field === 'productId') {
        const p = products.find(p => p._id === val)
        if (p) {
          next[i].name = p.name
          next[i].price = p.costPrice
        }
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

  const validateForm = () => {
    if (!form.supplier?.trim()) {
      toast.error('Supplier name is required')
      return false
    }
    if (!form.invoiceNo?.trim()) {
      toast.error('Invoice number is required')
      return false
    }
    if (items.length === 0) {
      toast.error('Add at least one item')
      return false
    }
    if (items.some(it => !it.productId || !it.qty || !it.price)) {
      toast.error('Complete all item rows')
      return false
    }
    return true
  }

  const save = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const payload = {
        ...form,
        ...totals,
        products: items.map(it => ({
          productId: it.productId,
          name: it.name,
          qty: +it.qty,
          price: +it.price,
          total: +it.qty * +it.price
        }))
      }

      const res = await purchasesService.create(payload)
      const newPurchase = res.data?.purchase || { _id: Date.now().toString(), ...payload, status: 'pending' }

      setPurchases(ps => [newPurchase, ...ps])
      setModal(false)
      toast.success('Purchase recorded successfully!')
    } catch (err) {
      console.error('Failed to save purchase:', err)
      toast.error(err.response?.data?.message || 'Failed to save purchase')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: 'invoiceNo',
      label: 'Invoice',
      render: v => <span className="font-mono" style={{ color: 'var(--blue)', fontWeight: 700, fontSize: 12 }}>{v}</span>
    },
    {
      key: 'date',
      label: 'Date',
      render: v => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{new Date(v).toLocaleDateString()}</span>
    },
    {
      key: 'supplier',
      label: 'Supplier',
      render: v => <span style={{ fontWeight: 500 }}>{v}</span>
    },
    {
      key: 'products',
      label: 'Items',
      render: v => <span className="badge badge-blue">{v?.length || 0} items</span>
    },
    {
      key: 'subtotal',
      label: 'Subtotal',
      render: v => <span className="font-mono">{formatINR(v)}</span>
    },
    {
      key: 'gstAmt',
      label: 'GST',
      render: v => <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{formatINR(v)}</span>
    },
    {
      key: 'total',
      label: 'Total',
      render: v => <span className="font-mono" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{formatINR(v)}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: v => <span className={`badge badge-${v === 'received' ? 'green' : 'amber'}`}>{v}</span>
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: v => <span className={`badge badge-${v === 'paid' ? 'green' : 'red'}`}>{v}</span>
    },
    {
      key: '_id',
      label: 'Action',
      sortable: false,
      render: (_, row) => (
        <button className="btn btn-icon" onClick={() => setView(row)} title="View details">
          <Eye size={13} />
        </button>
      )
    },
  ]

  const totalRevenue = purchases.reduce((sum, p) => sum + (p.total || 0), 0)

  if (loading) {
    return (
      <div className="animate-fadeIn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading purchases...</p>
        </div>
      </div>
    )
  }

  if (error && purchases.length === 0) {
    return (
      <div className="animate-fadeIn">
        <div className="page-header">
          <h2 className="page-title">Purchases</h2>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ marginTop: '16px' }}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h2 className="page-title">Purchases</h2>
          <p className="page-subtitle">
            {purchases.length} entries · {formatINR(totalRevenue)} total
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={15} /> New Purchase
        </button>
      </div>

      <div className="card card-flush">
        {purchases.length > 0 ? (
          <DataTable columns={columns} data={purchases} searchKeys={['invoiceNo', 'supplier']} />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <p>No purchases recorded yet</p>
          </div>
        )}
      </div>

      {/* New Purchase Modal */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '300px' }}>
        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title="Record Purchase"
          size="modal-lg"
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save Purchase'}
              </button>
            </>
          }
        >
          <div className="grid grid-3" style={{ gap: 12, marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">Supplier *</label>
              <input
                className="input"
                placeholder="Supplier name"
                value={form.supplier}
                onChange={set('supplier')}
                disabled={saving}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Invoice No *</label>
              <input
                className="input"
                placeholder="PUR-XXX"
                value={form.invoiceNo}
                onChange={set('invoiceNo')}
                disabled={saving}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={set('date')}
                disabled={saving}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Payment Status</label>
              <select
                className="input"
                value={form.paymentStatus}
                onChange={set('paymentStatus')}
                disabled={saving}
              >
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
              <button className="btn btn-ghost btn-sm" onClick={addItem} disabled={saving}>
                <Plus size={12} /> Add Item
              </button>
            </div>
            {items.map((it, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <select
                  className="input"
                  value={it.productId}
                  onChange={e => updateItem(i, 'productId', e.target.value)}
                  disabled={saving}
                >
                  <option value="">Select product</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                <input
                  className="input"
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={it.qty}
                  onChange={e => updateItem(i, 'qty', e.target.value)}
                  disabled={saving}
                />
                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="Cost ₹"
                  value={it.price}
                  onChange={e => updateItem(i, 'price', e.target.value)}
                  disabled={saving}
                />
                <button
                  className="btn btn-icon"
                  style={{ color: 'var(--red)' }}
                  onClick={() => removeItem(i)}
                  disabled={saving}
                  title="Remove item"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '14px 18px', maxWidth: 280, marginLeft: 'auto' }}>
            {[['Subtotal', totals.subtotal], ['GST (18%)', totals.gstAmt]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 7 }}>
                <span>{k}</span>
                <span className="font-mono">{formatINR(v)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, color: 'var(--accent)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <span>Grand Total</span>
              <span className="font-mono">{formatINR(totals.total)}</span>
            </div>
          </div>
        </Modal>
        {/* View Modal */}
        <Modal
          open={!!viewModal}
          onClose={() => setView(null)}
          title={`Purchase — ${viewModal?.invoiceNo}`}
          size="modal-md"
        >
          {viewModal && (
            <>
              <div className="grid grid-2" style={{ gap: 10, marginBottom: 18 }}>
                {[
                  ['Supplier', viewModal.supplier],
                  ['Date', new Date(viewModal.date).toLocaleDateString()],
                  ['Invoice No', viewModal.invoiceNo],
                  ['Status', viewModal.status]
                ].map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--bg-secondary)', borderRadius: 9, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      {k}
                    </div>
                    <div style={{ fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
              <table style={{ marginBottom: 16, width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', paddingBottom: 8 }}>Product</th>
                    <th style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', paddingBottom: 8 }}>Qty</th>
                    <th style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', paddingBottom: 8 }}>Unit Cost</th>
                    <th style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', paddingBottom: 8 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewModal.products?.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 0', fontSize: 13 }}>{p.name}</td>
                      <td className="font-mono" style={{ textAlign: 'right', padding: '8px 0', fontSize: 13 }}>{p.qty}</td>
                      <td className="font-mono" style={{ textAlign: 'right', padding: '8px 0', fontSize: 13 }}>{formatINR(p.price)}</td>
                      <td className="font-mono" style={{ textAlign: 'right', padding: '8px 0', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                        {formatINR(p.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '14px 18px' }}>
                {[['Subtotal', viewModal.subtotal], ['GST', viewModal.gstAmt]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 7 }}>
                    <span>{k}</span>
                    <span className="font-mono">{formatINR(v)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, color: 'var(--accent)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <span>Grand Total</span>
                  <span className="font-mono">{formatINR(viewModal.total)}</span>
                </div>
              </div>
            </>
          )}
        </Modal>
      </div>
    </div>
  )
}
