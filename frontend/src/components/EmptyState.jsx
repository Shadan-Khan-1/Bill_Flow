export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 20px', textAlign: 'center',
    }}>
      {Icon && (
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'var(--bg-hover)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Icon size={30} color="var(--text-muted)" strokeWidth={1.5} />
        </div>
      )}
      <h3 style={{
        fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700,
        color: 'var(--text-primary)', marginBottom: 8,
      }}>{title}</h3>
      {description && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 300, lineHeight: 1.6, marginBottom: 20 }}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
