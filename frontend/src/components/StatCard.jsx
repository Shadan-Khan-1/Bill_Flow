export default function StatCard({ label, value, icon: Icon, color, bg, sub, trend }) {
  const isPositive = typeof trend === 'string' && trend.startsWith('+')
  const isNegative = typeof trend === 'string' && trend.startsWith('-')

  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 13, background: bg,
          border: `1px solid ${color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon size={21} color={color} />
        </div>
        {trend && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
            background: isPositive ? 'var(--green-dim)' : isNegative ? 'var(--red-dim)' : 'var(--accent-dim)',
            color: isPositive ? 'var(--green)' : isNegative ? 'var(--red)' : 'var(--accent)',
          }}>
            {trend}
          </span>
        )}
      </div>

      <div className="font-mono" style={{
        fontSize: 26, fontWeight: 700,
        color: 'var(--text-primary)',
        letterSpacing: '-0.5px',
        marginBottom: 4
      }}>
        {value}
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>

      {sub && (
        <div style={{ fontSize: 11, color, marginTop: 5, fontWeight: 600 }}>{sub}</div>
      )}
    </div>
  )
}
