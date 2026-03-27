import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Lock, Eye, EyeOff, RefreshCw, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: 'admin@billflow.in', password: 'admin123' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{ width: '100%', maxWidth: 420 }} className="animate-fadeIn">

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, background: 'var(--accent)',
            borderRadius: 18, display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', marginBottom: 18,
            boxShadow: '0 8px 32px var(--accent-glow)'
          }}>
            <Zap size={30} color="#0a0e1a" strokeWidth={2.5} />
          </div>
          <h1 className="font-syne" style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            BillFlow
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 5 }}>
            Smart Billing for Modern Business
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 className="font-syne" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>
            Sign in to your dashboard
          </p>

          {error && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 9, padding: '10px 14px', marginBottom: 18,
              fontSize: 13, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 8
            }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center'
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={loading}
              style={{ width: '100%', marginTop: 4 }}
            >
              {loading
                ? <><RefreshCw size={15} className="animate-spin" /> Signing in...</>
                : <><Lock size={15} /> Sign In</>
              }
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{
            marginTop: 22, padding: 14,
            background: 'var(--bg-secondary)', borderRadius: 10
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Demo Credentials
            </p>
            {[
              { role: '👑 Admin', email: 'admin@billflow.in', pass: 'admin123', color: 'var(--accent)' },
              { role: '👤 Staff', email: 'staff@billflow.in', pass: 'staff123', color: 'var(--blue)' },
            ].map(c => (
              <button
                key={c.role}
                onClick={() => setForm({ email: c.email, password: c.pass })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', background: 'none', border: '1px solid var(--border)',
                  borderRadius: 7, padding: '7px 10px', cursor: 'pointer',
                  color: 'var(--text-secondary)', fontSize: 12, marginBottom: 6,
                  transition: 'all 0.2s', fontFamily: 'inherit'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = c.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <span>{c.role}</span>
                <span className="font-mono" style={{ color: c.color, marginLeft: 'auto' }}>{c.email}</span>
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
          © 2025 BillFlow · <span style={{ color: 'var(--accent)' }}>v2.4.1</span>
        </p>
      </div>
    </div>
  )
}
