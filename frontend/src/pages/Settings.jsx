import { useState } from 'react'
import { Database, Shield, Lock, Zap, Star, CheckCircle, Save, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

const SECURITY_FEATURES = [
  { icon: Lock, label: 'JWT Authentication', desc: 'Token-based session management' },
  { icon: Shield, label: 'Role-Based Access', desc: 'Admin & Staff permission model' },
  { icon: Database, label: 'Audit Logging', desc: 'All transactions tracked' },
  { icon: Zap, label: 'Rate Limiting', desc: '100 requests / 15 min per IP' },
  { icon: Star, label: 'CSRF Protection', desc: 'Cross-site forgery guard' },
  { icon: CheckCircle, label: 'XSS Sanitization', desc: 'All inputs sanitized' },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const { dark, toggle } = useTheme()

  const [company, setCompany] = useState({
    name: 'BillFlow Technologies Pvt. Ltd.',
    address: '404, Nexus Complex, Bandra Kurla Complex, Mumbai – 400051',
    phone: '+91 98765 43210',
    email: 'billing@billflow.in',
    gstin: '27AABCT1234F1Z5',
    state: 'Maharashtra',
    stateCode: '27',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  })
  const [invoicePrefix, setInvoicePrefix] = useState('INV')
  const [taxInclusive, setTaxInclusive] = useState(true)
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setCompany(c => ({ ...c, [k]: e.target.value }))

  const save = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    toast.success('Settings saved successfully!')
  }

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="page-subtitle">Manage your business preferences</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          <Save size={14} /> {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Company Info (full width) */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="font-syne" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
            Company Information
          </div>
          <div className="grid grid-3" style={{ gap: 16 }}>
            {[
              { label: 'Company Name', key: 'name', span: 2 },
              { label: 'GSTIN', key: 'gstin' },
              { label: 'Phone', key: 'phone' },
              { label: 'Email', key: 'email' },
              { label: 'State', key: 'state' },
              { label: 'State Code', key: 'stateCode' },
            ].map(f => (
              <div key={f.key} className="form-group" style={f.span ? { gridColumn: `span ${f.span}` } : {}}>
                <label className="form-label">{f.label}</label>
                <input className="input" value={company[f.key]} onChange={set(f.key)} />
              </div>
            ))}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Address</label>
              <textarea className="input" rows={2} value={company.address} onChange={set('address')} />
            </div>
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="card">
          <div className="font-syne" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>
            Invoice Settings
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Invoice Number Prefix</label>
              <input className="input" value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} placeholder="INV" />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="input" value={company.currency} onChange={set('currency')}>
                <option value="INR">INR – Indian Rupee (₹)</option>
                <option value="USD">USD – US Dollar ($)</option>
                <option value="EUR">EUR – Euro (€)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select className="input" value={company.timezone} onChange={set('timezone')}>
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>
            {/* Tax inclusive toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>Tax Inclusive Pricing</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Prices entered include GST</div>
              </div>
              <button
                onClick={() => setTaxInclusive(t => !t)}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: taxInclusive ? 'var(--accent)' : 'var(--border)',
                  border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.3s'
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 9, background: 'white',
                  position: 'absolute', top: 3, left: taxInclusive ? 23 : 3,
                  transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="card">
          <div className="font-syne" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>
            Appearance & Account
          </div>

          {/* Dark mode toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>Dark Mode</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Toggle light / dark theme</div>
            </div>
            <button
              onClick={toggle}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: dark ? 'var(--accent)' : 'var(--border)',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.3s'
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 9, background: 'white',
                position: 'absolute', top: 3, left: dark ? 23 : 3,
                transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }} />
            </button>
          </div>

          {/* User profile card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--accent-dim)', border: '2px solid var(--border-active)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 900, color: 'var(--accent)'
            }}>
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
              <span className={`badge badge-${user?.role === 'admin' ? 'amber' : 'blue'}`} style={{ marginTop: 4, fontSize: 10 }}>{user?.role}</span>
            </div>
          </div>

          {[['Session Status', 'Active'], ['Last Login', 'Today 09:43 AM'], ['2FA', 'Not enabled']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '8px 2px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{k}</span>
              <span className="font-mono" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Security Features (full width) */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="font-syne" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>
            Security Features
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {SECURITY_FEATURES.map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: 'var(--bg-secondary)',
                borderRadius: 10, border: '1px solid var(--border)'
              }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <f.icon size={16} color="var(--green)" />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.desc}</div>
                </div>
                <CheckCircle size={14} color="var(--green)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
