import { useState } from 'react'
import { TrendingUp, ShoppingCart, IndianRupee, Percent, Download } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import StatCard from '../components/StatCard'
import { formatINR } from '../utils/helpers'

const TREND = [
  { month: 'Oct', sales: 312000, purchases: 240000, profit: 72000  },
  { month: 'Nov', sales: 428000, purchases: 318000, profit: 110000 },
  { month: 'Dec', sales: 589000, purchases: 421000, profit: 168000 },
  { month: 'Jan', sales: 398000, purchases: 298000, profit: 100000 },
  { month: 'Feb', sales: 467000, purchases: 340000, profit: 127000 },
  { month: 'Mar', sales: 361251, purchases: 280000, profit: 81251  },
]

const PAY_DATA = [
  { name: 'Cash',          value: 12119,  color: '#fbbf24' },
  { name: 'Card',          value: 30811,  color: '#3b82f6' },
  { name: 'UPI',           value: 92446,  color: '#10b981' },
  { name: 'Bank Transfer', value: 225875, color: '#8b5cf6' },
]

const TOP_PRODUCTS = [
  { name: 'Apple MacBook Air M3', sales: 1, revenue: 114900, margin: 17 },
  { name: 'Dell 27" 4K Monitor',  sales: 2, revenue: 105980, margin: 20 },
  { name: 'Samsung Galaxy S24',   sales: 1, revenue: 79999,  margin: 18 },
  { name: 'Sony WH-1000XM5',      sales: 1, revenue: 29990,  margin: 25 },
]

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--accent)', fontSize: 12 }}>
          {p.name}: {formatINR(p.value)}
        </div>
      ))}
    </div>
  )
}

const RANGES = ['This Week', 'This Month', 'This Quarter', 'This Year', 'Custom']

export default function Reports() {
  const [range, setRange] = useState('This Month')

  const totalRevenue   = 361251
  const totalPurchases = 280000
  const grossProfit    = totalRevenue - totalPurchases
  const totalGST       = 63251

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h2 className="page-title">Reports & Analytics</h2>
          <p className="page-subtitle">Business performance overview</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select className="input" style={{ width: 'auto' }} value={range} onChange={e => setRange(e.target.value)}>
            {RANGES.map(r => <option key={r}>{r}</option>)}
          </select>
          <button className="btn btn-ghost"><Download size={14} /> Export Excel</button>
          <button className="btn btn-ghost"><Download size={14} /> Export PDF</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Revenue',    value: formatINR(totalRevenue),   icon: TrendingUp,   color: 'var(--green)',  bg: 'var(--green-dim)',  trend: '+12.4%', sub: `4 invoices` },
          { label: 'Total Purchases',  value: formatINR(totalPurchases), icon: ShoppingCart, color: 'var(--blue)',   bg: 'var(--blue-dim)',   trend: '+8.1%',  sub: `4 orders`   },
          { label: 'Gross Profit',     value: formatINR(grossProfit),    icon: IndianRupee,  color: 'var(--accent)', bg: 'var(--accent-dim)', trend: '+5.2%',  sub: `${Math.round((grossProfit/totalRevenue)*100)}% margin` },
          { label: 'GST Collected',    value: formatINR(totalGST),       icon: Percent,      color: 'var(--purple)', bg: 'var(--purple-dim)', trend: null,     sub: 'Tax liability' },
        ].map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        {/* P&L Bar Chart */}
        <div className="card">
          <div className="font-syne" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Profit & Loss Trend</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>Monthly performance</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={TREND} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v/1000}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="sales"  fill="#10b981" radius={[4,4,0,0]} name="Sales" />
              <Bar dataKey="profit" fill="#fbbf24" radius={[4,4,0,0]} name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Line */}
        <div className="card">
          <div className="font-syne" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Sales vs Purchases</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>6-month comparison</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={TREND} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v/1000}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="sales"     stroke="#10b981" strokeWidth={2.5} dot={false} name="Sales" />
              <Line type="monotone" dataKey="purchases" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="Purchases" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        {/* Payment Methods Pie */}
        <div className="card">
          <div className="font-syne" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Payment Methods</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Revenue by payment mode</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={PAY_DATA} cx="50%" cy="50%" outerRadius={75} paddingAngle={4} dataKey="value">
                  {PAY_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={v => formatINR(v)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PAY_DATA.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{d.name}</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 11 }}>{formatINR(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GST Summary */}
        <div className="card">
          <div className="font-syne" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>GST Summary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Total Sales (incl. GST)', value: formatINR(totalRevenue), color: 'var(--green)' },
              { label: 'Taxable Value (excl. GST)', value: formatINR(totalRevenue - totalGST), color: 'var(--blue)' },
              { label: 'CGST @ 9%', value: formatINR(totalGST / 2), color: 'var(--purple)' },
              { label: 'SGST @ 9%', value: formatINR(totalGST / 2), color: 'var(--purple)' },
              { label: 'Total Tax Liability', value: formatINR(totalGST), color: 'var(--accent)' },
            ].map((r, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'var(--bg-secondary)',
                borderRadius: 9, border: '1px solid var(--border)'
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.label}</span>
                <span className="font-mono" style={{ fontWeight: 800, color: r.color, fontSize: 13 }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="card card-flush">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="font-syne" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Top Selling Products</div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Product</th><th>Units Sold</th><th>Revenue</th><th>Margin %</th><th>Performance</th></tr>
            </thead>
            <tbody>
              {TOP_PRODUCTS.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td className="font-mono">{p.sales}</td>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatINR(p.revenue)}</td>
                  <td>
                    <span className="badge badge-green">+{p.margin}%</span>
                  </td>
                  <td style={{ width: 140 }}>
                    <div className="progress">
                      <div className="progress-fill" style={{ width: `${(p.revenue / TOP_PRODUCTS[0].revenue) * 100}%`, background: 'var(--accent)' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
