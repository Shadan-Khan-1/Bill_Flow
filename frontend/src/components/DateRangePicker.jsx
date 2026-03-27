import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'

const PRESETS = [
  { label: 'Today',     value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month',value: 'month' },
  { label: 'Quarter',   value: 'quarter' },
  { label: 'This Year', value: 'year' },
  { label: 'Custom',    value: 'custom' },
]

export default function DateRangePicker({ value, onChange }) {
  const [open,   setOpen]   = useState(false)
  const [custom, setCustom] = useState({ from: '', to: '' })

  const current = PRESETS.find(p => p.value === value?.period) || PRESETS[2]

  const select = (preset) => {
    if (preset.value === 'custom') {
      setOpen(true)
      return
    }
    onChange({ period: preset.value })
    setOpen(false)
  }

  const applyCustom = () => {
    if (!custom.from || !custom.to) return
    onChange({ from: custom.from, to: custom.to, period: 'custom' })
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-ghost"
        onClick={() => setOpen(o => !o)}
        style={{ gap: 8 }}
      >
        <Calendar size={14} />
        {value?.period === 'custom' && value?.from
          ? `${value.from} → ${value.to}`
          : current.label}
        <ChevronDown size={13} />
      </button>

      {open && (
        <div className="animate-scaleIn" style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 16, minWidth: 220,
          boxShadow: 'var(--shadow-lg)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            {PRESETS.filter(p => p.value !== 'custom').map(p => (
              <button
                key={p.value}
                onClick={() => select(p)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, textAlign: 'left',
                  background: current.value === p.value ? 'var(--accent-dim)' : 'transparent',
                  color:      current.value === p.value ? 'var(--accent)' : 'var(--text-secondary)',
                  border:     current.value === p.value ? '1px solid var(--border-active)' : '1px solid transparent',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Custom Range
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input className="input" type="date" value={custom.from} onChange={e => setCustom(c => ({...c, from: e.target.value}))} />
              <input className="input" type="date" value={custom.to}   onChange={e => setCustom(c => ({...c, to:   e.target.value}))} />
              <button className="btn btn-primary btn-sm" onClick={applyCustom} style={{ width: '100%', justifyContent: 'center' }}>
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
