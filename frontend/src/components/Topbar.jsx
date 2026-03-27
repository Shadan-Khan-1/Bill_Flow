import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sun, Moon, Bell, Menu, AlertTriangle, Wifi, WifiOff } from 'lucide-react'
// import { useTheme } from '../../context/ThemeContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
// import { useOfflineSync } from '../../hooks/useOfflineSync'
import { useOfflineSync } from '../hooks/useOfflineSync'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/purchases': 'Purchases',
  '/sales': 'Sales & Billing',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

export default function Topbar({ lowStockCount, onOpenSidebar }) {
  const { dark, toggle } = useTheme()
  const { user } = useAuth()
  const { isOnline, pendingCount } = useOfflineSync()
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'BillFlow'

  return (
    <header style={{
      height: 'var(--topbar-h)',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 14,
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }} className="no-print">
      {/* Mobile menu button */}
      <button className="btn btn-icon" onClick={onOpenSidebar} id="mobile-menu">
        <Menu size={16} />
      </button>

      <h1 className="font-syne" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
        {title}
      </h1>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Online indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
          {isOnline
            ? <Wifi size={13} color="var(--green)" />
            : <WifiOff size={13} color="var(--red)" />}
          {pendingCount > 0 && (
            <span className="badge badge-amber">{pendingCount} pending sync</span>
          )}
        </div>

        {/* Dark mode toggle */}
        <button className="btn btn-icon" onClick={toggle} title="Toggle theme">
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button className="btn btn-icon">
            <Bell size={15} />
          </button>
          {lowStockCount > 0 && <div className="dot-red" />}
        </div>

        {/* Low stock badge */}
        {lowStockCount > 0 && (
          <div className="badge badge-red hide-mobile">
            <AlertTriangle size={11} /> {lowStockCount} Low Stock
          </div>
        )}

        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: 'var(--accent-dim)', border: '1px solid var(--border-active)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, color: 'var(--accent)', cursor: 'pointer'
        }}>
          {user?.name?.slice(0, 2).toUpperCase()}
        </div>
      </div>

      <style>{`
        #mobile-menu { display: none; }
        @media (max-width: 768px) {
          #mobile-menu { display: flex; }
        }
      `}</style>
    </header>
  )
}
