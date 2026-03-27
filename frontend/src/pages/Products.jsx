import { useState } from 'react'
import { Plus, Edit2, Trash2, AlertTriangle, CheckCircle, Package } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable from '../components/DataTable'
import { formatINR, getProfitMargin, getStockStatus } from '../utils/helpers'

const CATEGORIES = ['Electronics', 'Laptops', 'Monitors', 'Accessories', 'Furniture', 'Stationery', 'Other']
const GST_RATES = [0, 5, 12, 18, 28]
const EMOJIS = ['📦', '📱', '💻', '🖥️', '⌨️', '🖱️', '🎧', '⚡', '🔌', '📷', '🎮', '🖨️', '💡', '🔋', '📺', '⌚', '🎵', '🧲']

const EMPTY = {
  name: '', sku: '', category: 'Electronics', price: '',
  costPrice: '', stock: '', unit: 'pcs', gst: 18,
  supplier: '', minStock: 5, image: '📦', description: ''
}

export default function Products() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts()
  const [modal, setModal] = useState(null)   // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [delTarget, setDel] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'table'

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.sku.trim()) e.sku = 'Required'
    if (!form.price) e.price = 'Required'
    if (+form.price < 0) e.price = 'Must be positive'
    if (+form.stock < 0) e.stock = 'Must be ≥ 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const openAdd = () => { setForm(EMPTY); setErrors({}); setModal('add') }
  const openEdit = (p) => {
    setForm({ ...p, price: p.price, costPrice: p.costPrice, stock: p.stock })
    setErrors({})
    setModal('edit')
  }

  const save = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: +form.price, costPrice: +form.costPrice,
        stock: +form.stock, gst: +form.gst, minStock: +form.minStock
      }
      if (modal === 'add') await addProduct(payload)
      else await updateProduct(form._id, payload)
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'image', label: '', sortable: false, render: (v) => <span style={{ fontSize: 22 }}>{v}</span> },
    {
      key: 'name', label: 'Product', render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v}</div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.sku}</div>
        </div>
      )
    },
    { key: 'category', label: 'Category', render: (v) => <span className="badge badge-blue">{v}</span> },
    { key: 'price', label: 'Price', render: (v) => <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatINR(v)}</span> },
    { key: 'costPrice', label: 'Cost', render: (v) => <span className="font-mono">{formatINR(v)}</span> },
    {
      key: 'stock', label: 'Stock', render: (v, row) => {
        const s = getStockStatus(v, row.minStock)
        return <span className={`badge badge-${s.color === 'green' ? 'green' : s.color === 'red' ? 'red' : 'amber'}`}>
          {v} {row.unit}
        </span>
      }
    },
    { key: 'gst', label: 'GST', render: (v) => `${v}%` },
    {
      key: 'actions', label: 'Actions', sortable: false, render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-icon" onClick={() => openEdit(row)}><Edit2 size={13} /></button>
          <button className="btn btn-icon" style={{ color: 'var(--red)' }} onClick={() => setDel(row)}><Trash2 size={13} /></button>
        </div>
      )
    }
  ]

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h2 className="page-title">Product Catalog</h2>
          <p className="page-subtitle">
            {products.length} products · {products.filter(p => p.stock <= p.minStock).length} low stock
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden' }}>
            {['grid', 'table'].map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                style={{
                  padding: '7px 14px', background: viewMode === m ? 'var(--accent-dim)' : 'transparent',
                  color: viewMode === m ? 'var(--accent)' : 'var(--text-muted)',
                  border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                  textTransform: 'capitalize'
                }}>
                {m}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={15} /> Add Product
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-auto" style={{ gap: 14 }}>
          {products.map(p => {
            const margin = getProfitMargin(p.price, p.costPrice)
            const stockStatus = getStockStatus(p.stock, p.minStock)
            return (
              <div key={p._id || p.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 34 }}>{p.image}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-icon" onClick={() => openEdit(p)}><Edit2 size={13} /></button>
                    <button className="btn btn-icon" style={{ color: 'var(--red)' }} onClick={() => setDel(p)}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{p.name}</div>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>{p.sku}</div>
                <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span className="badge badge-blue">{p.category}</span>
                  <span className={`badge badge-${stockStatus.color === 'green' ? 'green' : stockStatus.color === 'red' ? 'red' : 'amber'}`}>
                    {stockStatus.color !== 'green' && <AlertTriangle size={9} />}
                    {p.stock} {p.unit}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div className="font-mono" style={{ fontSize: 19, fontWeight: 800, color: 'var(--accent)' }}>
                      {formatINR(p.price)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cost: {formatINR(p.costPrice)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: margin >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {margin >= 0 ? '+' : ''}{margin}% margin
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>GST {p.gst}%</div>
                  </div>
                </div>
              </div>
            )
          })}
          {products.length === 0 && !loading && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <Package size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>No products yet. Add your first product.</p>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="card card-flush">
          <DataTable
            columns={columns}
            data={products}
            loading={loading}
            searchKeys={['name', 'sku', 'category', 'supplier']}
            emptyMessage="No products found"
          />
        </div>
      )}

      {/* Add / Edit Modal */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '300px' }}>
        <Modal
          style={{ marginTop: 300 }}
          open={!!modal}
          onClose={() => setModal(null)}
          title={modal === 'add' ? 'Add New Product' : 'Edit Product'}
          size="modal-md"
          footer={<>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : modal === 'add' ? '+ Add Product' : 'Save Changes'}
            </button>
          </>}
        >
          {/* Emoji picker */}
          <div style={{ marginBottom: 18 }}>
            <label className="form-label">Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setForm(f => ({ ...f, image: e }))} style={{
                  fontSize: 20, width: 38, height: 38, borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${form.image === e ? 'var(--accent)' : 'var(--border)'}`,
                  background: form.image === e ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                  transition: 'all 0.15s'
                }}>{e}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: 14 }}>
            {[
              { label: 'Product Name *', key: 'name', placeholder: 'e.g. Samsung Galaxy S24' },
              { label: 'SKU *', key: 'sku', placeholder: 'e.g. SAM-S24-BLK' },
              { label: 'Selling Price *', key: 'price', type: 'number', placeholder: '0.00' },
              { label: 'Cost Price', key: 'costPrice', type: 'number', placeholder: '0.00' },
              { label: 'Stock Qty', key: 'stock', type: 'number', placeholder: '0' },
              { label: 'Min Stock Alert', key: 'minStock', type: 'number', placeholder: '5' },
              { label: 'Supplier', key: 'supplier', placeholder: 'Supplier name' },
              { label: 'Unit', key: 'unit', placeholder: 'pcs, kg, ltr…' },
            ].map(f => (
              <div className="form-group" key={f.key}>
                <label className="form-label">{f.label}</label>
                <input
                  className={`input ${errors[f.key] ? 'input-error' : ''}`}
                  type={f.type || 'text'}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={set(f.key)}
                />
                {errors[f.key] && <span style={{ fontSize: 11, color: 'var(--red)' }}>{errors[f.key]}</span>}
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="input" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">GST Rate</label>
              <select className="input" value={form.gst} onChange={set('gst')}>
                {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea className="input" rows={2} placeholder="Optional product description" value={form.description} onChange={set('description')} />
            </div>
          </div>
        </Modal>
      </div>
      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!delTarget}
        onClose={() => setDel(null)}
        onConfirm={() => deleteProduct(delTarget?._id || delTarget?.id)}
        title="Delete Product?"
        message={`Are you sure you want to delete "${delTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete Product"
        danger
      />
    </div >
  )
}
