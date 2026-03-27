import { useState, useEffect, useRef } from 'react'
import { Bell, AlertTriangle, Clock, CheckCircle, X, Package } from 'lucide-react'

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

const NOTIFICATION_TYPES = {
  low_stock:      { icon: AlertTriangle, color: 'var(--red)',    bg: 'var(--red-dim)',    label: 'Low Stock' },
  pending_sale:   { icon: Clock,         color: 'var(--accent)', bg: 'var(--accent-dim)', label: 'Pending Sale' },
  pending_payment:{ icon: Clock,         color: 'var(--blue)',   bg: 'var(--blue-dim)',   label: 'Pending Payment' },
  success:        { icon: CheckCircle,   color: 'var(--green)',  bg: 'var(--green-dim)',  label: 'Success' },
}

export default function NotificationPanel({ lowStockProducts = [], pendingSales = [], pendingPayments = [] }) {
  const [open,    setOpen]    = useState(false)
  const [read,    setRead]    = useState(new Set())
  const panelRef = useRef(null)

  useClickOutside(panelRef, () => setOpen(false))

  const notifications = [
    ...lowStockProducts.map(p => ({
      id:      `ls_${p._id}`,
      type:    'low_stock',
      title:   'Low Stock Alert',
      message: `${p.name} has only ${p.stock} ${p.unit} left (min: ${p.minStock})`,
      time:    'Now',
    })),
    ...pendingSales.map(s => ({
      id:      `ps_${s._id}`,
      type:    'pending_sale',
      title:   'Pending Sale',
      message: `Invoice ${s.invoiceNo} for ${s.customer?.name} is unpaid`,
      time:    s.date,
    })),
    ...pendingPayments.map(p => ({
      id:      `pp_${p._id}`,
      type:    'pending_payment',
      title:   'Purchase Payment Due',
      message: `${p.supplier} — Invoice ${p.invoiceNo} payment pending`,
      time:    p.date,
    })),
  ]

  const unread = notifications.filter(n => !read.has(n.id)).length

  const markAllRead = () => setRead(new Set(notifications.map(n => n.id)))
  const dismiss     = (id) => setRead(s => new Set([...s, id]))

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="btn btn-icon"
        style={{ position: 'relative' }}
        title="Notifications"
      >
        <Bell size={15} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: 'var(--red)', color: '#fff',
            fontSize: 9, fontWeight: 800,
            width: 16, height: 16, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg-secondary)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="animate-scaleIn" style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: 360, maxHeight: 480,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          zIndex: 200,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
          }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                Notifications
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                {unread} unread
              </div>
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div style={{ overflowY: 'auto', maxHeight: 380 }}>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <CheckCircle size={32} style={{ marginBottom: 10, opacity: 0.4, display: 'block', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 13 }}>All caught up!</div>
              </div>
            ) : notifications.map(n => {
              const cfg   = NOTIFICATION_TYPES[n.type]
              const isNew = !read.has(n.id)
              const Icon  = cfg.icon
              return (
                <div
                  key={n.id}
                  style={{
                    display: 'flex', gap: 12, padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: isNew ? `${cfg.bg}` : 'transparent',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: cfg.bg, border: `1px solid ${cfg.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} color={cfg.color} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{n.title}</span>
                      {isNew && (
                        <span style={{ width: 6, height: 6, borderRadius: 3, background: cfg.color, display: 'inline-block', flexShrink: 0 }} />
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{n.time}</div>
                  </div>
                  <button
                    onClick={() => dismiss(n.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, flexShrink: 0, display: 'flex', alignItems: 'flex-start' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
