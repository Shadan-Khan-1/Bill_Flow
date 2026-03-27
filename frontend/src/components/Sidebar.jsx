import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Receipt,
  BarChart3, Settings, Zap, LogOut, X
} from 'lucide-react'
// import { useAuth } from '../../context/AuthContext'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products',  label: 'Products',   icon: Package },
  { to: '/purchases', label: 'Purchases',  icon: ShoppingCart },
  { to: '/sales',     label: 'Sales & Billing', icon: Receipt },
  { to: '/reports',   label: 'Reports',    icon: BarChart3 },
  { to: '/settings',  label: 'Settings',   icon: Settings },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="modal-overlay no-print"
          style={{ zIndex: 99, background: 'rgba(0,0,0,0.5)' }}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar no-print ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, background: 'var(--accent)',
              borderRadius: 10, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0
            }}>
              <Zap size={18} color="#0a0e1a" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-syne" style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                BillFlow
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Business Suite
              </div>
            </div>
            <button className="btn btn-icon" onClick={onClose} style={{ marginLeft: 'auto', display: 'none' }} id="close-sidebar">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', padding: '6px 6px 10px', textTransform: 'uppercase' }}>
            Menu
          </div>
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Panel */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px', borderRadius: 10,
            background: 'var(--bg-hover)', border: '1px solid var(--border)',
            marginBottom: 8
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'var(--accent-dim)', border: '1px solid var(--border-active)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: 'var(--accent)', flexShrink: 0
            }}>
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <span className={`badge badge-${user?.role === 'admin' ? 'amber' : 'blue'}`} style={{ fontSize: 10 }}>
                {user?.role}
              </span>
            </div>
          </div>
          <button
            className="btn btn-ghost"
            onClick={logout}
            style={{ width: '100%', color: 'var(--red)', borderColor: 'rgba(239,68,68,0.2)' }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>

        <style>{`
          @media (max-width: 768px) {
            #close-sidebar { display: flex !important; }
          }
        `}</style>
      </aside>
    </>
  )
}
