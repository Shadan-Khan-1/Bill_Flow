import { useEffect, useState } from 'react'
import {
  TrendingUp, ShoppingCart, IndianRupee, Package,
  AlertTriangle, CheckCircle, ArrowUpRight
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import StatCard from '../components/StatCard'
import { formatINR, formatINRShort } from '../utils/helpers'
import { reportsService } from '../services/transactions.service'

/* ── Fallback mock data if API not connected ── */
const MOCK_TREND = [
  { month: 'Oct', sales: 312000, purchases: 240000, profit: 72000 },
  { month: 'Nov', sales: 428000, purchases: 318000, profit: 110000 },
  { month: 'Dec', sales: 589000, purchases: 421000, profit: 168000 },
  { month: 'Jan', sales: 398000, purchases: 298000, profit: 100000 },
  { month: 'Feb', sales: 467000, purchases: 340000, profit: 127000 },
  { month: 'Mar', sales: 515000, purchases: 380000, profit: 135000 },
]
const MOCK_CATS = [
  { name: 'Electronics', value: 45, color: '#fbbf24' },
  { name: 'Laptops',     value: 25, color: '#3b82f6' },
  { name: 'Monitors',    value: 15, color: '#10b981' },
  { name: 'Accessories', value: 15, color: '#8b5cf6' },
]
const MOCK_RECENT_SALES = [
  { invoiceNo: 'INV-004', customerName: 'Kavitha R',     total: 12119,  date: '2025-03-23', status: 'paid' },
  { invoiceNo: 'INV-003', customerName: 'Arjun Tech Hub',total: 225875, date: '2025-03-22', status: 'paid' },
  { invoiceNo: 'INV-002', customerName: 'Priya Mehta',   total: 30811,  date: '2025-03-21', status: 'paid' },
  { invoiceNo: 'INV-001', customerName: 'Rahul Sharma',  total: 92446,  date: '2025-03-20', status: 'pending' },
]
const MOCK_LOW = [
  { name: 'USB-C Hub 7-in-1',    stock: 2, minStock: 5, image: '🔌' },
  { name: 'Apple MacBook Air M3', stock: 4, minStock: 2, image: '💻' },
  { name: 'Dell 27" 4K Monitor',  stock: 3, minStock: 2, image: '🖥️' },
]

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontSize: 12 }}>
          {p.name}: {formatINR(p.value)}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [summary, setSummary]   = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    reportsService.getSummary()
      .then(({ data }) => setSummary(data))
      .catch(() => {/* use mock */})
      .finally(() => setLoading(false))
  }, [])

  const stats = summary ? [
    { label: 'Total Revenue',    value: formatINR(summary.totalRevenue),   icon: TrendingUp,   color: 'var(--green)',  bg: 'var(--green-dim)',  trend: '+12.4%' },
    { label: 'Total Purchases',  value: formatINR(summary.totalPurchases), icon: ShoppingCart, color: 'var(--blue)',   bg: 'var(--blue-dim)',   trend: '+8.1%'  },
    { label: 'Gross Profit',     value: formatINR(summary.grossProfit),    icon: IndianRupee,  color: 'var(--accent)', bg: 'var(--accent-dim)', trend: '+5.2%'  },
    { label: 'Total Products',   value: String(summary.totalProducts),     icon: Package,      color: 'var(--purple)', bg: 'var(--purple-dim)', trend: `${summary.lowStock} low` },
  ] : [
    { label: 'Total Revenue',   value: '₹3,61,251',  icon: TrendingUp,   color: 'var(--green)',  bg: 'var(--green-dim)',  trend: '+12.4%' },
    { label: 'Total Purchases', value: '₹8,34,260',  icon: ShoppingCart, color: 'var(--blue)',   bg: 'var(--blue-dim)',   trend: '+8.1%'  },
    { label: 'Gross Profit',    value: '−₹4,73,009', icon: IndianRupee,  color: 'var(--red)',    bg: 'var(--red-dim)',    trend: '−15.3%' },
    { label: 'Total Products',  value: '8',           icon: Package,      color: 'var(--purple)', bg: 'var(--purple-dim)', trend: '3 low' },
  ]

  return (
    <div className="animate-fadeIn">

      {/* ── KPI Cards ── */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 16, marginBottom: 24 }}>

        {/* Revenue Area Chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div className="font-syne" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                Revenue Overview
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Last 6 months
              </div>
            </div>
            <span className="tag">Monthly</span>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={MOCK_TREND} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPurch" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false}
                tickFormatter={v => `₹${v / 1000}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 14 }} />
              <Area type="monotone" dataKey="sales"     stroke="#10b981" strokeWidth={2} fill="url(#gSales)" name="Sales" />
              <Area type="monotone" dataKey="purchases" stroke="#3b82f6" strokeWidth={2} fill="url(#gPurch)" name="Purchases" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="card">
          <div className="font-syne" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Category Split
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Sales by category</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={MOCK_CATS} cx="50%" cy="50%" innerRadius={44} outerRadius={70}
                paddingAngle={3} dataKey="value">
                {MOCK_CATS.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Pie>
              <Tooltip
                formatter={v => `${v}%`}
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {MOCK_CATS.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{c.name}</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 16 }}>

        {/* Recent Sales Table */}
        <div className="card card-flush">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="font-syne" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Recent Sales
            </div>
            <span className="tag">Live</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RECENT_SALES.map((s, i) => (
                  <tr key={i}>
                    <td>
                      <span className="font-mono" style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12 }}>
                        {s.invoiceNo}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{s.customerName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.date}</div>
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 700 }}>{formatINR(s.total)}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${s.status === 'paid' ? 'green' : 'amber'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={16} color="var(--red)" />
            <div className="font-syne" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Low Stock Alerts
            </div>
          </div>
          {MOCK_LOW.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 28 }}>
              <CheckCircle size={30} color="var(--green)" style={{ marginBottom: 10, display: 'block', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>All products well stocked!</p>
            </div>
          ) : (
            MOCK_LOW.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', background: 'var(--bg-hover)',
                borderRadius: 10, marginBottom: 8,
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: 24, flexShrink: 0 }}>{p.image}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <div className="progress">
                      <div className="progress-fill" style={{
                        width: `${Math.min(100, (p.stock / (p.minStock * 3)) * 100)}%`,
                        background: p.stock <= p.minStock / 2 ? 'var(--red)' : 'var(--accent)'
                      }} />
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="font-mono" style={{ fontSize: 18, fontWeight: 800, color: p.stock === 0 ? 'var(--red)' : 'var(--accent)' }}>
                    {p.stock}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>/ min {p.minStock}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
