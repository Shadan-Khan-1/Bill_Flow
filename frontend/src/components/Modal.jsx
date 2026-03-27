import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, size = '', children, footer }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size}`}>
        {title && (
          <div className="modal-header">
            <h3 className="font-syne" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {title}
            </h3>
            <button className="btn btn-icon" onClick={onClose}><X size={15} /></button>
          </div>
        )}
        <div>{children}</div>
        {footer && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
