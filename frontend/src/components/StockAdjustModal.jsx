import { useState } from 'react'
import { Package, TrendingUp, TrendingDown } from 'lucide-react'
import Modal from './Modal'
import { productsService } from '../services/products.service'
import toast from 'react-hot-toast'

export default function StockAdjustModal({ open, onClose, product, onUpdated }) {
  const [mode,   setMode]   = useState('add')      // 'add' | 'remove' | 'set'
  const [qty,    setQty]    = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  if (!product) return null

  const adjustment = mode === 'add'
    ? +qty
    : mode === 'remove'
      ? -Math.abs(+qty)
      : (+qty) - product.stock   // 'set' → delta to reach target

  const newStock = Math.max(0, product.stock + adjustment)

  const handle = async () => {
    if (!qty) return toast.error('Enter quantity')
    setSaving(true)
    try {
      const { data } = await productsService.updateStock(product._id, adjustment, reason)
      toast.success(`Stock updated: ${data.adjustment.before} → ${data.adjustment.after}`)
      onUpdated?.(data.product)
      onClose()
      setQty(''); setReason('')
    } catch (_) {}
    finally { setSaving(false) }
  }

  const modeConfig = {
    add:    { label: 'Add Stock',   color: 'var(--green)',  icon: TrendingUp   },
    remove: { label: 'Remove Stock',color: 'var(--red)',    icon: TrendingDown },
    set:    { label: 'Set Stock',   color: 'var(--blue)',   icon: Package      },
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adjust Stock"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handle} disabled={saving}>
          {saving ? 'Saving…' : 'Update Stock'}
        </button>
      </>}
    >
      {/* Product summary */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
        background: 'var(--bg-secondary)', borderRadius: 10, marginBottom: 20,
      }}>
        <div style={{ fontSize: 28 }}>{product.image}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{product.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            SKU: {product.sku} · Current Stock:
            <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, color: 'var(--accent)', marginLeft: 4 }}>
              {product.stock} {product.unit}
            </span>
          </div>
        </div>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {Object.entries(modeConfig).map(([key, cfg]) => {
          const Icon = cfg.icon
          return (
            <button
              key={key}
              onClick={() => setMode(key)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 9, cursor: 'pointer',
                border: `2px solid ${mode === key ? cfg.color : 'var(--border)'}`,
                background: mode === key ? `${cfg.color}18` : 'var(--bg-secondary)',
                color: mode === key ? cfg.color : 'var(--text-secondary)',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'all 0.15s',
              }}
            >
              <Icon size={15} />
              {cfg.label}
            </button>
          )
        })}
      </div>

      {/* Quantity input */}
      <div className="form-group" style={{ marginBottom: 14 }}>
        <label className="form-label">
          {mode === 'set' ? 'New Stock Level' : 'Quantity'}
        </label>
        <input
          className="input"
          type="number"
          min="0"
          placeholder={mode === 'set' ? `Current: ${product.stock}` : '0'}
          value={qty}
          onChange={e => setQty(e.target.value)}
          style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, textAlign: 'center', padding: '12px' }}
        />
      </div>

      {/* Reason */}
      <div className="form-group" style={{ marginBottom: 18 }}>
        <label className="form-label">Reason (optional)</label>
        <input
          className="input"
          placeholder="e.g. Damaged goods, Stock count correction…"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
      </div>

      {/* Preview */}
      {qty && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10,
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>New stock will be</div>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 900,
            color: newStock <= product.minStock ? 'var(--red)' : 'var(--green)',
          }}>
            {newStock} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>{product.unit}</span>
          </div>
        </div>
      )}
    </Modal>
  )
}
